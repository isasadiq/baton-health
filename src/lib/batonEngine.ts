import {
  Patient,
  Clinic,
  Resource,
  Loop,
  Transition,
  ReferralAttempt,
  Message,
  LoopState,
  Urgency,
  BarrierCode,
  ClosureEvidence,
  BoardRow,
  MetricsSummary,
  DropoffReasonCount
} from '../types/baton';

// SLA Rules from 01_schema.sql
const SLA_RULES: Record<Urgency, Record<LoopState, number>> = {
  urgent: {
    issued: 4,
    notified: 24,
    acknowledged: 24,
    referred: 12,
    accepted: 48,
    appointment: 168,
    in_care: 720,
    closed: 0,
  },
  priority: {
    issued: 12,
    notified: 48,
    acknowledged: 72,
    referred: 24,
    accepted: 120,
    appointment: 336,
    in_care: 720,
    closed: 0,
  },
  routine: {
    issued: 24,
    notified: 72,
    acknowledged: 120,
    referred: 48,
    accepted: 168,
    appointment: 504,
    in_care: 720,
    closed: 0,
  },
};

// Urgency rules
const URGENCY_RULES: Record<string, Record<string, Urgency>> = {
  fit: { positive: 'priority' },
  hpv: { hpv16_18: 'urgent', other_hr: 'priority' },
};

// Allowed transitions from 01_schema.sql
const ALLOWED_TRANSITIONS: Record<string, { requiresEvidence: boolean }> = {
  'issued->notified': { requiresEvidence: false },
  'notified->acknowledged': { requiresEvidence: false },
  'acknowledged->referred': { requiresEvidence: false },
  'acknowledged->in_care': { requiresEvidence: true },
  'referred->accepted': { requiresEvidence: true },
  'accepted->appointment': { requiresEvidence: true },
  'appointment->in_care': { requiresEvidence: true },
  'notified->closed': { requiresEvidence: true },
  'acknowledged->closed': { requiresEvidence: true },
  'referred->closed': { requiresEvidence: true },
  'accepted->closed': { requiresEvidence: true },
  'appointment->closed': { requiresEvidence: true },
  'in_care->closed': { requiresEvidence: true },
};

export const CLOSURE_EVIDENCE_TYPES = [
  { code: 'treatment_started', label: 'Treatment started' },
  { code: 'attended_appointment', label: 'Specialist appointment attended' },
  { code: 'repeat_test_normal', label: 'Confirmatory/repeat test normal' },
  { code: 'patient_declined_documented', label: 'Patient declined care (documented)' },
  { code: 'patient_unreachable_documented', label: 'Unreachable after documented attempts' },
  { code: 'clinician_decision_stop', label: 'Clinician-signed decision to stop' },
  { code: 'transferred_out', label: 'Care transferred to another provider' },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: '00000000-0000-0000-0000-0000000000a1',
    full_name: 'Hauwa Musa',
    phone: '+234 803 123 4567',
    language: 'ha',
    consent_messaging: true,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-0000000000a2',
    full_name: 'Ibrahim Sani',
    phone: '+234 802 987 6543',
    language: 'ha',
    consent_messaging: true,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-0000000000a3',
    full_name: 'Grace Okafor',
    phone: '+234 814 555 0199',
    language: 'en',
    consent_messaging: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Northside Primary Health Centre',
    kind: 'primary',
    area: 'North',
    priority: 100,
    has_evening_slots: false,
    accepting: true,
  },
  {
    id: 'c0000002-0000-0000-0000-000000000002',
    name: 'City General - Gastro Clinic',
    kind: 'specialist',
    area: 'Central',
    priority: 10,
    has_evening_slots: false,
    accepting: true,
  },
  {
    id: 'c0000003-0000-0000-0000-000000000003',
    name: 'Riverside Community Hospital - Gastro Clinic',
    kind: 'specialist',
    area: 'Riverside',
    priority: 20,
    has_evening_slots: false,
    accepting: true,
  },
  {
    id: 'c0000004-0000-0000-0000-000000000004',
    name: 'Eastgate Evening Clinic',
    kind: 'specialist',
    area: 'East',
    priority: 30,
    has_evening_slots: true,
    accepting: true,
  },
];

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'r0000001-0000-0000-0000-000000000001',
    barrier_code: 'cost',
    title: 'Subsidised follow-up site',
    description: 'Reduced-fee follow-up at Riverside Community Hospital',
    clinic_id: 'c0000003-0000-0000-0000-000000000003',
    available: true,
  },
  {
    id: 'r0000002-0000-0000-0000-000000000002',
    barrier_code: 'cost',
    title: 'Community health subsidy voucher',
    description: 'Covers the confirmatory procedure fee through partner grant funds',
    clinic_id: null,
    available: true,
  },
  {
    id: 'r0000003-0000-0000-0000-000000000003',
    barrier_code: 'transport',
    title: 'Transport assistance',
    description: 'Direct door-to-clinic transport dispatch or transit stipend',
    clinic_id: null,
    available: true,
  },
  {
    id: 'r0000004-0000-0000-0000-000000000004',
    barrier_code: 'time_off',
    title: 'Evening clinic slots',
    description: 'Flexible after-work & weekend appointments at Eastgate',
    clinic_id: 'c0000004-0000-0000-0000-000000000004',
    available: true,
  },
  {
    id: 'r0000005-0000-0000-0000-000000000005',
    barrier_code: 'fear',
    title: 'Call with a nurse',
    description: 'A compassionate tele-triage nurse calls back within 4 hours to answer personal concerns',
    clinic_id: null,
    available: true,
  },
  {
    id: 'r0000006-0000-0000-0000-000000000006',
    barrier_code: 'understanding',
    title: 'Plain-language explainer call',
    description: 'A clinician explains the test result in Hausa/Pidgin/English and answers all questions',
    clinic_id: null,
    available: true,
  },
];

export class BatonEngine {
  private offsetHours: number = 0;
  private patients: Patient[] = [];
  private clinics: Clinic[] = [];
  private resources: Resource[] = [];
  private loops: Loop[] = [];
  private transitions: Transition[] = [];
  private referralAttempts: ReferralAttempt[] = [];
  private messages: Message[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadOrSeed();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.saveState();
    this.listeners.forEach((l) => l());
  }

  private saveState() {
    try {
      const state = {
        offsetHours: this.offsetHours,
        patients: this.patients,
        clinics: this.clinics,
        resources: this.resources,
        loops: this.loops,
        transitions: this.transitions,
        referralAttempts: this.referralAttempts,
        messages: this.messages,
      };
      localStorage.setItem('baton_engine_state_v1', JSON.stringify(state));
    } catch (e) {
      // Ignore if localStorage unavailable
    }
  }

  private loadOrSeed() {
    try {
      const saved = localStorage.getItem('baton_engine_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.offsetHours = parsed.offsetHours || 0;
        this.patients = parsed.patients;
        this.clinics = parsed.clinics;
        this.resources = parsed.resources;
        this.loops = parsed.loops;
        this.transitions = parsed.transitions;
        this.referralAttempts = parsed.referralAttempts;
        this.messages = parsed.messages;
        return;
      }
    } catch (e) {
      // Fallback to fresh seed
    }
    this.resetDemo();
  }

  public resetDemo() {
    this.offsetHours = 0;
    this.patients = JSON.parse(JSON.stringify(INITIAL_PATIENTS));
    this.clinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
    this.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
    this.loops = [];
    this.transitions = [];
    this.referralAttempts = [];
    this.messages = [];

    // Seed 3 Loops exactly as in 02_seed.sql
    this.createLoop(
      '00000000-0000-0000-0000-0000000000a1',
      'fit',
      'FIT positive (synthetic)',
      'positive',
      'Dr. Amina Bello',
      'ordering_clinician'
    );
    this.createLoop(
      '00000000-0000-0000-0000-0000000000a2',
      'fit',
      'FIT positive (synthetic)',
      'positive',
      'Dr. Amina Bello',
      'ordering_clinician'
    );
    this.createLoop(
      '00000000-0000-0000-0000-0000000000a3',
      'hpv',
      'HPV 16/18 positive (synthetic)',
      'hpv16_18',
      'Dr. Amina Bello',
      'ordering_clinician'
    );

    this.notify();
  }

  // Simulated app clock (app_now())
  public appNow(): Date {
    return new Date(Date.now() + this.offsetHours * 3600 * 1000);
  }

  public getOffsetHours(): number {
    return this.offsetHours;
  }

  public fastForward(hours: number) {
    this.offsetHours += hours;
    this.sweepTimeouts();
    this.notify();
  }

  public calculateSlaDue(urgency: Urgency, state: LoopState): Date {
    const hours = SLA_RULES[urgency]?.[state] ?? 24;
    return new Date(this.appNow().getTime() + hours * 3600 * 1000);
  }

  // create_loop()
  public createLoop(
    patientId: string,
    testType: string,
    resultSummary: string,
    flag: string,
    owner: string,
    ownerRole: string = 'ordering_clinician'
  ): Loop {
    const urgency = URGENCY_RULES[testType]?.[flag] || 'routine';
    const dueAt = this.calculateSlaDue(urgency, 'issued').toISOString();
    const nowIso = this.appNow().toISOString();
    const loopId = 'loop-' + Math.random().toString(36).substring(2, 10);
    const accessToken = 'tok_' + Math.random().toString(36).substring(2, 18);

    const loop: Loop = {
      id: loopId,
      patient_id: patientId,
      test_type: testType,
      result_summary: resultSummary,
      urgency,
      state: 'issued',
      owner,
      owner_role: ownerRole,
      due_at: dueAt,
      barrier_code: null,
      escalated: false,
      referral_clinic_id: null,
      access_token: accessToken,
      created_at: nowIso,
      updated_at: nowIso,
      closed_at: null,
    };

    this.loops.push(loop);

    this.transitions.push({
      id: this.transitions.length + 1,
      loop_id: loopId,
      from_state: null,
      to_state: 'issued',
      owner,
      actor: 'lab',
      evidence: null,
      reason_code: null,
      note: 'Actionable result issued',
      created_at: nowIso,
    });

    this.notify();
    return loop;
  }

  // advance_loop()
  public advanceLoop(
    loopId: string,
    toState: LoopState,
    owner: string,
    ownerRole: string,
    actor: string,
    evidence?: any,
    reasonCode?: string,
    note?: string
  ): Loop {
    if (!owner || !owner.trim()) {
      throw new Error('Every transition needs a named owner');
    }

    const loop = this.loops.find((l) => l.id === loopId);
    if (!loop) throw new Error(`Loop ${loopId} not found`);

    const transitionKey = `${loop.state}->${toState}`;
    const rule = ALLOWED_TRANSITIONS[transitionKey];
    if (!rule) {
      throw new Error(`Transition ${loop.state} -> ${toState} is not allowed`);
    }

    if (rule.requiresEvidence && (!evidence || Object.keys(evidence).length === 0)) {
      throw new Error(`Moving to ${toState} requires documented evidence`);
    }

    if (toState === 'closed') {
      this.checkClosureEvidence(evidence);
    }

    const nowIso = this.appNow().toISOString();

    this.transitions.push({
      id: this.transitions.length + 1,
      loop_id: loopId,
      from_state: loop.state,
      to_state: toState,
      owner,
      actor,
      evidence: evidence || null,
      reason_code: reasonCode || null,
      note: note || null,
      created_at: nowIso,
    });

    loop.state = toState;
    loop.owner = owner;
    loop.owner_role = ownerRole;
    loop.due_at = toState === 'closed' ? nowIso : this.calculateSlaDue(loop.urgency, toState).toISOString();
    loop.escalated = false;
    loop.updated_at = nowIso;
    loop.closed_at = toState === 'closed' ? nowIso : null;

    this.notify();
    return loop;
  }

  private checkClosureEvidence(evidence: ClosureEvidence) {
    if (!evidence || !CLOSURE_EVIDENCE_TYPES.some((t) => t.code === evidence.type)) {
      throw new Error(
        `Closure needs evidence of an accepted type (got: ${evidence?.type || 'none'})`
      );
    }
    if (!evidence.signed_by || !evidence.signed_by.trim()) {
      throw new Error('Closure needs a named clinician sign-off (evidence.signed_by)');
    }
    if (evidence.type === 'patient_unreachable_documented' && (evidence.attempts || 0) < 3) {
      throw new Error('Closing as unreachable needs at least 3 documented contact attempts');
    }
  }

  // route_referral()
  public routeReferral(loopId: string, actor: string = 'system'): Loop {
    const loop = this.loops.find((l) => l.id === loopId);
    if (!loop) throw new Error(`Loop ${loopId} not found`);
    if (loop.state !== 'acknowledged' && loop.state !== 'referred') {
      throw new Error(`Can only route a referral from acknowledged or referred (loop is ${loop.state})`);
    }

    const attemptedClinicIds = this.referralAttempts
      .filter((a) => a.loop_id === loopId)
      .map((a) => a.clinic_id);

    const availableClinic = this.clinics
      .filter((c) => c.kind === 'specialist' && c.accepting && !attemptedClinicIds.includes(c.id))
      .sort((a, b) => a.priority - b.priority)[0];

    const nowIso = this.appNow().toISOString();

    if (!availableClinic) {
      // Escalation to human coordinator
      loop.escalated = true;
      loop.owner = 'Care coordinator (referral unplaced)';
      loop.owner_role = 'care_coordinator';
      loop.updated_at = nowIso;

      this.transitions.push({
        id: this.transitions.length + 1,
        loop_id: loopId,
        from_state: loop.state,
        to_state: loop.state,
        owner: loop.owner,
        actor,
        evidence: null,
        reason_code: 'no_capacity',
        note: 'No specialist clinic available; escalated to a human coordinator',
        created_at: nowIso,
      });

      this.notify();
      return loop;
    }

    // Record attempt
    this.referralAttempts.push({
      id: this.referralAttempts.length + 1,
      loop_id: loopId,
      clinic_id: availableClinic.id,
      status: 'pending',
      reason_code: null,
      created_at: nowIso,
      resolved_at: null,
    });

    if (loop.state === 'acknowledged') {
      loop.referral_clinic_id = availableClinic.id;
      return this.advanceLoop(
        loopId,
        'referred',
        availableClinic.name,
        'receiving_clinic',
        actor,
        null,
        null,
        `Referral sent to ${availableClinic.name}`
      );
    }

    // If already referred, reroute
    loop.referral_clinic_id = availableClinic.id;
    loop.owner = availableClinic.name;
    loop.owner_role = 'receiving_clinic';
    loop.escalated = false;
    loop.due_at = this.calculateSlaDue(loop.urgency, 'referred').toISOString();
    loop.updated_at = nowIso;

    this.transitions.push({
      id: this.transitions.length + 1,
      loop_id: loopId,
      from_state: 'referred',
      to_state: 'referred',
      owner: availableClinic.name,
      actor,
      evidence: { clinic_id: availableClinic.id },
      reason_code: 'rerouted',
      note: `Rerouted to ${availableClinic.name}`,
      created_at: nowIso,
    });

    this.notify();
    return loop;
  }

  // accept_referral()
  public acceptReferral(loopId: string, actor: string): Loop {
    const attempt = this.referralAttempts
      .filter((a) => a.loop_id === loopId && a.status === 'pending')
      .slice(-1)[0];

    if (!attempt) throw new Error('No pending referral for this loop');

    const clinic = this.clinics.find((c) => c.id === attempt.clinic_id);
    if (!clinic) throw new Error('Clinic not found');

    const nowIso = this.appNow().toISOString();
    attempt.status = 'accepted';
    attempt.resolved_at = nowIso;

    return this.advanceLoop(
      loopId,
      'accepted',
      clinic.name,
      'receiving_clinic',
      actor,
      {
        type: 'referral_accepted',
        clinic_id: clinic.id,
        accepted_by: actor,
      }
    );
  }

  // decline_referral()
  public declineReferral(loopId: string, reason: string, actor: string): Loop {
    if (!reason || !reason.trim()) {
      throw new Error('A decline needs a reason');
    }

    const attempt = this.referralAttempts
      .filter((a) => a.loop_id === loopId && a.status === 'pending')
      .slice(-1)[0];

    if (!attempt) throw new Error('No pending referral to decline');

    const nowIso = this.appNow().toISOString();
    attempt.status = 'declined';
    attempt.reason_code = reason;
    attempt.resolved_at = nowIso;

    this.transitions.push({
      id: this.transitions.length + 1,
      loop_id: loopId,
      from_state: 'referred',
      to_state: 'referred',
      owner: actor,
      actor,
      evidence: { reason },
      reason_code: 'referral_declined',
      note: `Declined: ${reason}`,
      created_at: nowIso,
    });

    return this.routeReferral(loopId, 'system');
  }

  // sweep_timeouts()
  public sweepTimeouts(): number {
    const now = this.appNow();
    let count = 0;

    const overdueReferred = this.loops.filter(
      (l) => l.state === 'referred' && new Date(l.due_at) < now
    );

    for (const loop of overdueReferred) {
      const pendingAttempt = this.referralAttempts
        .filter((a) => a.loop_id === loop.id && a.status === 'pending')
        .slice(-1)[0];

      if (pendingAttempt) {
        pendingAttempt.status = 'timed_out';
        pendingAttempt.resolved_at = now.toISOString();

        this.transitions.push({
          id: this.transitions.length + 1,
          loop_id: loop.id,
          from_state: 'referred',
          to_state: 'referred',
          owner: loop.owner,
          actor: 'system',
          evidence: null,
          reason_code: 'referral_timed_out',
          note: 'SLA expired without response from receiving clinic',
          created_at: now.toISOString(),
        });

        this.routeReferral(loop.id, 'system');
        count++;
      }
    }

    if (count > 0) this.notify();
    return count;
  }

  // record_barrier()
  public recordBarrier(loopId: string, barrier: BarrierCode, actor: string = 'patient'): Resource[] {
    const loop = this.loops.find((l) => l.id === loopId);
    if (!loop) throw new Error(`Loop ${loopId} not found`);
    if (loop.state === 'closed') throw new Error('Loop is closed');

    let owner = loop.owner;
    let role = loop.owner_role;
    let dueAt = new Date(loop.due_at);

    // Fear or confusion goes to nurse callback with a 4h short clock
    if (barrier === 'fear' || barrier === 'understanding') {
      owner = 'Tele-triage nurse';
      role = 'nurse_triage';
      const fourHoursLater = new Date(this.appNow().getTime() + 4 * 3600 * 1000);
      dueAt = dueAt < fourHoursLater ? dueAt : fourHoursLater;
    }

    loop.barrier_code = barrier;
    loop.owner = owner;
    loop.owner_role = role;
    loop.due_at = dueAt.toISOString();
    loop.updated_at = this.appNow().toISOString();

    this.transitions.push({
      id: this.transitions.length + 1,
      loop_id: loopId,
      from_state: loop.state,
      to_state: loop.state,
      owner,
      actor,
      evidence: null,
      reason_code: barrier,
      note: `Patient reported a barrier: ${barrier}`,
      created_at: this.appNow().toISOString(),
    });

    this.notify();
    return this.resources.filter((r) => r.barrier_code === barrier && r.available);
  }

  // resolve_barrier()
  public resolveBarrier(
    loopId: string,
    resourceId: string,
    owner: string,
    ownerRole: string,
    actor: string = 'patient'
  ): Loop {
    const loop = this.loops.find((l) => l.id === loopId);
    if (!loop) throw new Error(`Loop ${loopId} not found`);
    if (!loop.barrier_code) throw new Error('No open barrier on this loop');

    const resource = this.resources.find((r) => r.id === resourceId && r.available);
    if (!resource) throw new Error('Resource not available');

    loop.barrier_code = null;
    loop.owner = owner;
    loop.owner_role = ownerRole;
    loop.due_at = this.calculateSlaDue(loop.urgency, loop.state).toISOString();
    loop.updated_at = this.appNow().toISOString();

    this.transitions.push({
      id: this.transitions.length + 1,
      loop_id: loopId,
      from_state: loop.state,
      to_state: loop.state,
      owner,
      actor,
      evidence: { resource_id: resource.id, resource: resource.title },
      reason_code: 'barrier_resolved',
      note: `Resolved via ${resource.title}`,
      created_at: this.appNow().toISOString(),
    });

    this.notify();
    return loop;
  }

  // Patient token lookup
  public getLoopByToken(token: string) {
    const loop = this.loops.find((l) => l.access_token === token);
    if (!loop) return null;
    const patient = this.patients.find((p) => p.id === loop.patient_id);
    if (!patient) return null;

    return {
      loop_id: loop.id,
      first_name: patient.full_name.split(' ')[0],
      test_type: loop.test_type,
      state: loop.state,
      barrier_code: loop.barrier_code,
      due_at: loop.due_at,
      token: loop.access_token,
      phone: patient.phone,
      language: patient.language,
    };
  }

  // Views
  public getBoard(): BoardRow[] {
    const now = this.appNow();
    return this.loops.map((l) => {
      const patient = this.patients.find((p) => p.id === l.patient_id);
      const dueDate = new Date(l.due_at);
      const hoursToDue = Math.round(((dueDate.getTime() - now.getTime()) / (3600 * 1000)) * 10) / 10;

      let status: 'closed' | 'overdue' | 'at_risk' | 'on_track';
      if (l.state === 'closed') {
        status = 'closed';
      } else if (l.escalated || hoursToDue < 0) {
        status = 'overdue';
      } else if (l.barrier_code !== null) {
        status = 'at_risk';
      } else {
        status = 'on_track';
      }

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
      };
    });
  }

  public getTransitions(loopId: string): Transition[] {
    return this.transitions
      .filter((t) => t.loop_id === loopId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getReferralAttempts(loopId: string): (ReferralAttempt & { clinic_name: string })[] {
    return this.referralAttempts
      .filter((a) => a.loop_id === loopId)
      .map((a) => {
        const c = this.clinics.find((cli) => cli.id === a.clinic_id);
        return {
          ...a,
          clinic_name: c ? c.name : 'Unknown clinic',
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getMetricsSummary(): MetricsSummary {
    const board = this.getBoard();
    const total = board.length;
    const closed = board.filter((b) => b.status === 'closed').length;
    const open = total - closed;
    const overdue = board.filter((b) => b.status === 'overdue').length;

    // Calculate milestone durations from transitions
    const notifyTimes: number[] = [];
    const ackTimes: number[] = [];
    const apptTimes: number[] = [];
    const closeTimes: number[] = [];

    for (const loop of this.loops) {
      const loopTrans = this.transitions.filter((t) => t.loop_id === loop.id);
      const issued = loopTrans.find((t) => t.to_state === 'issued');
      if (!issued) continue;
      const t0 = new Date(issued.created_at).getTime();

      const notified = loopTrans.find((t) => t.to_state === 'notified');
      if (notified) notifyTimes.push((new Date(notified.created_at).getTime() - t0) / 3600000);

      const ack = loopTrans.find((t) => t.to_state === 'acknowledged');
      if (ack) ackTimes.push((new Date(ack.created_at).getTime() - t0) / 3600000);

      const appt = loopTrans.find((t) => t.to_state === 'appointment');
      if (appt) apptTimes.push((new Date(appt.created_at).getTime() - t0) / 3600000);

      const closedT = loopTrans.find((t) => t.to_state === 'closed');
      if (closedT) closeTimes.push((new Date(closedT.created_at).getTime() - t0) / 3600000);
    }

    const avg = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

    return {
      total_loops: total,
      closed_loops: closed,
      open_loops: open,
      overdue_loops: overdue,
      avg_hrs_to_notify: avg(notifyTimes),
      avg_hrs_to_acknowledge: avg(ackTimes),
      avg_hrs_to_appointment: avg(apptTimes),
      avg_hrs_to_close: avg(closeTimes),
    };
  }

  public getDropoffReasons(): DropoffReasonCount[] {
    const counts: Record<string, number> = {};
    for (const t of this.transitions) {
      if (t.reason_code && t.reason_code !== 'barrier_resolved' && t.reason_code !== 'rerouted') {
        counts[t.reason_code] = (counts[t.reason_code] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([reason_code, events]) => ({ reason_code, events }))
      .sort((a, b) => b.events - a.events);
  }

  public getPatients(): Patient[] {
    return this.patients;
  }

  public getClinics(): Clinic[] {
    return this.clinics;
  }

  public getResources(): Resource[] {
    return this.resources;
  }

  public getLoops(): Loop[] {
    return this.loops;
  }
}

// Global Singleton instance for reactivity
export const batonEngine = new BatonEngine();
