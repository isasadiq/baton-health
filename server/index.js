import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Database connection mode
const DATABASE_URL = process.env.DATABASE_URL;
let pgPool = null;

if (DATABASE_URL) {
  try {
    const { default: pg } = await import('pg');
    pgPool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    console.log('Connected to PostgreSQL database:', DATABASE_URL.split('@')[1] || 'custom');
  } catch (err) {
    console.warn('PostgreSQL driver not available or failed to connect. Falling back to in-memory engine.', err.message);
  }
}

// =========================================================================
// IN-MEMORY / SYNTHETIC ENGINE (Identical to 01_schema.sql & 02_seed.sql)
// =========================================================================
let offsetHours = 0;

const SLA_RULES = {
  urgent: { issued: 4, notified: 24, acknowledged: 24, referred: 12, accepted: 48, appointment: 168, in_care: 720, closed: 0 },
  priority: { issued: 12, notified: 48, acknowledged: 72, referred: 24, accepted: 120, appointment: 336, in_care: 720, closed: 0 },
  routine: { issued: 24, notified: 72, acknowledged: 120, referred: 48, accepted: 168, appointment: 504, in_care: 720, closed: 0 },
};

const URGENCY_RULES = {
  fit: { positive: 'priority' },
  hpv: { hpv16_18: 'urgent', other_hr: 'priority' },
};

let patients = [
  { id: '00000000-0000-0000-0000-0000000000a1', full_name: 'Hauwa Musa', phone: '+234 803 123 4567', language: 'ha', consent_messaging: true },
  { id: '00000000-0000-0000-0000-0000000000a2', full_name: 'Ibrahim Sani', phone: '+234 802 987 6543', language: 'ha', consent_messaging: true },
  { id: '00000000-0000-0000-0000-0000000000a3', full_name: 'Grace Okafor', phone: '+234 814 555 0199', language: 'en', consent_messaging: false }
];

let clinics = [
  { id: 'c0000001', name: 'Northside Primary Health Centre', kind: 'primary', area: 'North', priority: 100, accepting: true, has_evening_slots: false },
  { id: 'c0000002', name: 'City General - Gastro Clinic', kind: 'specialist', area: 'Central', priority: 10, accepting: true, has_evening_slots: false },
  { id: 'c0000003', name: 'Riverside Community Hospital - Gastro Clinic', kind: 'specialist', area: 'Riverside', priority: 20, accepting: true, has_evening_slots: false },
  { id: 'c0000004', name: 'Eastgate Evening Clinic', kind: 'specialist', area: 'East', priority: 30, accepting: true, has_evening_slots: true }
];

let resources = [
  { id: 'r0000001', barrier_code: 'cost', title: 'Subsidised follow-up site', description: 'Reduced-fee follow-up at Riverside Community Hospital', available: true },
  { id: 'r0000002', barrier_code: 'cost', title: 'Community health subsidy voucher', description: 'Covers the confirmatory procedure fee through partner grant funds', available: true },
  { id: 'r0000003', barrier_code: 'transport', title: 'Transport assistance', description: 'Direct door-to-clinic transport dispatch or transit stipend', available: true },
  { id: 'r0000004', barrier_code: 'time_off', title: 'Evening clinic slots', description: 'Flexible after-work & weekend appointments at Eastgate', available: true },
  { id: 'r0000005', barrier_code: 'fear', title: 'Call with a nurse', description: 'A compassionate tele-triage nurse calls back within 4 hours to answer personal concerns', available: true },
  { id: 'r0000006', barrier_code: 'understanding', title: 'Plain-language explainer call', description: 'A clinician explains the test result in Hausa/Pidgin/English and answers all questions', available: true }
];

let loops = [];
let transitions = [];
let referralAttempts = [];

function appNow() {
  return new Date(Date.now() + offsetHours * 3600 * 1000);
}

function calculateSlaDue(urgency, state) {
  const hours = SLA_RULES[urgency]?.[state] ?? 24;
  return new Date(appNow().getTime() + hours * 3600 * 1000).toISOString();
}

function seedDefaultData() {
  offsetHours = 0;
  loops = [];
  transitions = [];
  referralAttempts = [];

  function addLoop(id, patientId, testType, summary, flag, owner) {
    const urgency = URGENCY_RULES[testType]?.[flag] || 'routine';
    const dueAt = calculateSlaDue(urgency, 'issued');
    const nowIso = appNow().toISOString();
    loops.push({
      id,
      patient_id: patientId,
      test_type: testType,
      result_summary: summary,
      urgency,
      state: 'issued',
      owner,
      owner_role: 'ordering_clinician',
      due_at: dueAt,
      barrier_code: null,
      escalated: false,
      referral_clinic_id: null,
      access_token: 'tok_' + Math.random().toString(36).substring(2, 14),
      created_at: nowIso,
      updated_at: nowIso,
      closed_at: null,
    });
    transitions.push({
      id: transitions.length + 1,
      loop_id: id,
      from_state: null,
      to_state: 'issued',
      owner,
      actor: 'lab',
      note: 'Actionable result issued',
      created_at: nowIso,
    });
  }

  addLoop('loop-1', '00000000-0000-0000-0000-0000000000a1', 'fit', 'FIT positive (synthetic)', 'positive', 'Dr. Amina Bello');
  addLoop('loop-2', '00000000-0000-0000-0000-0000000000a2', 'fit', 'FIT positive (synthetic)', 'positive', 'Dr. Amina Bello');
  addLoop('loop-3', '00000000-0000-0000-0000-0000000000a3', 'hpv', 'HPV 16/18 positive (synthetic)', 'hpv16_18', 'Dr. Amina Bello');
}

seedDefaultData();

// =========================================================================
// API ROUTES
// =========================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: pgPool ? 'postgresql' : 'in-memory-engine',
    clock: appNow().toISOString(),
    offset_hours: offsetHours,
  });
});

// GET /api/board -> v_board
app.get('/api/board', async (req, res) => {
  if (pgPool) {
    try {
      const { rows } = await pgPool.query('SELECT * FROM v_board ORDER BY due_at ASC');
      return res.json(rows);
    } catch (e) {
      console.error('Database query failed, falling back to local memory:', e.message);
    }
  }

  const now = appNow();
  const board = loops.map((l) => {
    const patient = patients.find((p) => p.id === l.patient_id);
    const dueDate = new Date(l.due_at);
    const hoursToDue = Math.round(((dueDate.getTime() - now.getTime()) / (3600 * 1000)) * 10) / 10;

    let status = 'on_track';
    if (l.state === 'closed') status = 'closed';
    else if (l.escalated || hoursToDue < 0) status = 'overdue';
    else if (l.barrier_code !== null) status = 'at_risk';

    return {
      id: l.id,
      patient: patient ? patient.full_name : 'Unknown',
      test_type: l.test_type,
      urgency: l.urgency,
      state: l.state,
      owner: l.owner,
      owner_role: l.owner_role,
      due_at: l.due_at,
      hours_to_due: hoursToDue,
      barrier_code: l.barrier_code,
      escalated: l.escalated,
      status,
      access_token: l.access_token,
    };
  });

  res.json(board);
});

// GET /api/metrics -> v_metrics_summary
app.get('/api/metrics', async (req, res) => {
  if (pgPool) {
    try {
      const { rows } = await pgPool.query('SELECT * FROM v_metrics_summary');
      return res.json(rows[0] || {});
    } catch (e) {
      console.error(e.message);
    }
  }

  const total = loops.length;
  const closed = loops.filter((l) => l.state === 'closed').length;
  const open = total - closed;
  const overdue = loops.filter((l) => new Date(l.due_at) < appNow() && l.state !== 'closed').length;

  res.json({
    total_loops: total,
    closed_loops: closed,
    open_loops: open,
    overdue_loops: overdue,
    avg_hrs_to_notify: 2.1,
    avg_hrs_to_acknowledge: 5.4,
    avg_hrs_to_appointment: 48.2,
    avg_hrs_to_close: 96.0,
  });
});

// GET /api/dropoffs -> v_dropoff_reasons
app.get('/api/dropoffs', async (req, res) => {
  if (pgPool) {
    try {
      const { rows } = await pgPool.query('SELECT * FROM v_dropoff_reasons');
      return res.json(rows);
    } catch (e) {
      console.error(e.message);
    }
  }

  const counts = {};
  for (const t of transitions) {
    if (t.reason_code && t.reason_code !== 'barrier_resolved' && t.reason_code !== 'rerouted') {
      counts[t.reason_code] = (counts[t.reason_code] || 0) + 1;
    }
  }

  const result = Object.entries(counts).map(([reason_code, events]) => ({ reason_code, events }));
  res.json(result);
});

// GET /api/loops/:id -> loop detail & timeline
app.get('/api/loops/:id', (req, res) => {
  const loop = loops.find((l) => l.id === req.params.id);
  if (!loop) return res.status(404).json({ error: 'Loop not found' });
  const patient = patients.find((p) => p.id === loop.patient_id);
  const loopTransitions = transitions.filter((t) => t.loop_id === loop.id);
  const attempts = referralAttempts.filter((a) => a.loop_id === loop.id);

  res.json({
    loop,
    patient,
    transitions: loopTransitions,
    referral_attempts: attempts,
  });
});

// POST /api/loops -> create_loop()
app.post('/api/loops', (req, res) => {
  const { patient_id, test_type, result_summary, flag, owner } = req.body;
  const urgency = URGENCY_RULES[test_type]?.[flag] || 'routine';
  const id = 'loop-' + Math.random().toString(36).substring(2, 8);
  const nowIso = appNow().toISOString();

  const newLoop = {
    id,
    patient_id,
    test_type,
    result_summary,
    urgency,
    state: 'issued',
    owner: owner || 'Dr. Amina Bello',
    owner_role: 'ordering_clinician',
    due_at: calculateSlaDue(urgency, 'issued'),
    barrier_code: null,
    escalated: false,
    referral_clinic_id: null,
    access_token: 'tok_' + Math.random().toString(36).substring(2, 14),
    created_at: nowIso,
    updated_at: nowIso,
    closed_at: null,
  };

  loops.push(newLoop);
  transitions.push({
    id: transitions.length + 1,
    loop_id: id,
    from_state: null,
    to_state: 'issued',
    owner: newLoop.owner,
    actor: 'lab',
    note: 'Actionable result issued',
    created_at: nowIso,
  });

  res.status(201).json(newLoop);
});

// POST /api/loops/:id/advance -> advance_loop()
app.post('/api/loops/:id/advance', (req, res) => {
  const loop = loops.find((l) => l.id === req.params.id);
  if (!loop) return res.status(404).json({ error: 'Loop not found' });

  const { to_state, owner, owner_role, actor, evidence, reason_code, note } = req.body;

  if (!owner || !owner.trim()) {
    return res.status(400).json({ error: 'Every transition needs a named owner' });
  }

  // Evidence validation on closure
  if (to_state === 'closed') {
    if (!evidence || !evidence.type) {
      return res.status(400).json({ error: 'Closure needs evidence of an accepted type' });
    }
    if (!evidence.signed_by || !evidence.signed_by.trim()) {
      return res.status(400).json({ error: 'Closure needs a named clinician sign-off' });
    }
  }

  const nowIso = appNow().toISOString();
  transitions.push({
    id: transitions.length + 1,
    loop_id: loop.id,
    from_state: loop.state,
    to_state,
    owner,
    actor: actor || 'system',
    evidence: evidence || null,
    reason_code: reason_code || null,
    note: note || null,
    created_at: nowIso,
  });

  loop.state = to_state;
  loop.owner = owner;
  loop.owner_role = owner_role || loop.owner_role;
  loop.due_at = to_state === 'closed' ? nowIso : calculateSlaDue(loop.urgency, to_state);
  loop.updated_at = nowIso;
  loop.closed_at = to_state === 'closed' ? nowIso : null;

  res.json(loop);
});

// POST /api/loops/:id/referral/route -> route_referral()
app.post('/api/loops/:id/referral/route', (req, res) => {
  const loop = loops.find((l) => l.id === req.params.id);
  if (!loop) return res.status(404).json({ error: 'Loop not found' });

  const attemptedIds = referralAttempts.filter((a) => a.loop_id === loop.id).map((a) => a.clinic_id);
  const clinic = clinics.filter((c) => c.kind === 'specialist' && c.accepting && !attemptedIds.includes(c.id)).sort((a, b) => a.priority - b.priority)[0];

  const nowIso = appNow().toISOString();
  if (!clinic) {
    loop.escalated = true;
    loop.owner = 'Care coordinator (referral unplaced)';
    loop.owner_role = 'care_coordinator';
    loop.updated_at = nowIso;
    transitions.push({
      id: transitions.length + 1,
      loop_id: loop.id,
      from_state: loop.state,
      to_state: loop.state,
      owner: loop.owner,
      actor: 'system',
      reason_code: 'no_capacity',
      note: 'No specialist clinic available; escalated to human coordinator',
      created_at: nowIso,
    });
    return res.json({ loop, escalated: true });
  }

  referralAttempts.push({
    id: referralAttempts.length + 1,
    loop_id: loop.id,
    clinic_id: clinic.id,
    clinic_name: clinic.name,
    status: 'pending',
    reason_code: null,
    created_at: nowIso,
  });

  loop.state = 'referred';
  loop.referral_clinic_id = clinic.id;
  loop.owner = clinic.name;
  loop.owner_role = 'receiving_clinic';
  loop.due_at = calculateSlaDue(loop.urgency, 'referred');
  loop.updated_at = nowIso;

  transitions.push({
    id: transitions.length + 1,
    loop_id: loop.id,
    from_state: 'acknowledged',
    to_state: 'referred',
    owner: clinic.name,
    actor: req.body.actor || 'system',
    note: `Referral sent to ${clinic.name}`,
    created_at: nowIso,
  });

  res.json({ loop, clinic });
});

// POST /api/loops/:id/referral/accept -> accept_referral()
app.post('/api/loops/:id/referral/accept', (req, res) => {
  const loop = loops.find((l) => l.id === req.params.id);
  if (!loop) return res.status(404).json({ error: 'Loop not found' });

  const attempt = referralAttempts.filter((a) => a.loop_id === loop.id && a.status === 'pending').slice(-1)[0];
  if (!attempt) return res.status(400).json({ error: 'No pending referral attempt' });

  attempt.status = 'accepted';
  attempt.resolved_at = appNow().toISOString();

  loop.state = 'accepted';
  loop.owner = attempt.clinic_name || loop.owner;
  loop.due_at = calculateSlaDue(loop.urgency, 'accepted');
  loop.updated_at = appNow().toISOString();

  transitions.push({
    id: transitions.length + 1,
    loop_id: loop.id,
    from_state: 'referred',
    to_state: 'accepted',
    owner: loop.owner,
    actor: req.body.actor || 'clinic',
    note: 'Referral accepted by receiving clinic',
    created_at: appNow().toISOString(),
  });

  res.json({ loop, attempt });
});

// POST /api/loops/:id/referral/decline -> decline_referral()
app.post('/api/loops/:id/referral/decline', (req, res) => {
  const loop = loops.find((l) => l.id === req.params.id);
  if (!loop) return res.status(404).json({ error: 'Loop not found' });

  const reason = req.body.reason || 'no_capacity';
  const attempt = referralAttempts.filter((a) => a.loop_id === loop.id && a.status === 'pending').slice(-1)[0];
  if (attempt) {
    attempt.status = 'declined';
    attempt.reason_code = reason;
    attempt.resolved_at = appNow().toISOString();
  }

  transitions.push({
    id: transitions.length + 1,
    loop_id: loop.id,
    from_state: 'referred',
    to_state: 'referred',
    owner: loop.owner,
    actor: 'clinic',
    reason_code: 'referral_declined',
    note: `Declined: ${reason}`,
    created_at: appNow().toISOString(),
  });

  // Auto reroute to next clinic
  const attemptedIds = referralAttempts.filter((a) => a.loop_id === loop.id).map((a) => a.clinic_id);
  const nextClinic = clinics.filter((c) => c.kind === 'specialist' && c.accepting && !attemptedIds.includes(c.id)).sort((a, b) => a.priority - b.priority)[0];

  if (nextClinic) {
    referralAttempts.push({
      id: referralAttempts.length + 1,
      loop_id: loop.id,
      clinic_id: nextClinic.id,
      clinic_name: nextClinic.name,
      status: 'pending',
      created_at: appNow().toISOString(),
    });
    loop.owner = nextClinic.name;
    loop.referral_clinic_id = nextClinic.id;
    loop.due_at = calculateSlaDue(loop.urgency, 'referred');
  } else {
    loop.escalated = true;
    loop.owner = 'Care coordinator (referral unplaced)';
  }

  res.json({ loop, rerouted_to: nextClinic ? nextClinic.name : 'escalated_to_coordinator' });
});

// POST /api/demo/fast-forward -> fast_forward()
app.post('/api/demo/fast-forward', (req, res) => {
  const hours = Number(req.body.hours || 24);
  offsetHours += hours;

  // Sweep timeouts
  const now = appNow();
  let swept = 0;
  for (const l of loops) {
    if (l.state === 'referred' && new Date(l.due_at) < now) {
      const att = referralAttempts.filter((a) => a.loop_id === l.id && a.status === 'pending').slice(-1)[0];
      if (att) {
        att.status = 'timed_out';
        att.resolved_at = now.toISOString();
        swept++;
      }
    }
  }

  res.json({ offset_hours: offsetHours, now: now.toISOString(), referrals_timed_out: swept });
});

// POST /api/demo/reset -> reset_demo()
app.post('/api/demo/reset', (req, res) => {
  seedDefaultData();
  res.json({ message: 'Demo reset to pristine state', loops_count: loops.length });
});

app.listen(PORT, () => {
  console.log(`Baton Backend API server listening on http://127.0.0.1:${PORT}`);
});
