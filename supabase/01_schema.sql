-- =====================================================================
-- 01_schema.sql  |  Screening-to-Care Loop ("Baton" model)
-- Every actionable result = one Loop: one owner, one clock, no closure
-- without evidence. Run in the Supabase SQL editor, then run 02_seed.sql.
-- SYNTHETIC DATA ONLY. Enable RLS + policies before any real data.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Simulated clock (lets the demo "fast-forward" to show an SLA breach)
-- ---------------------------------------------------------------------
create table demo_clock (
  id int primary key default 1 check (id = 1),
  offset_hours numeric not null default 0
);
insert into demo_clock default values;

create function app_now() returns timestamptz
language sql stable as $$
  select now() + (offset_hours * interval '1 hour') from demo_clock;
$$;

create function fast_forward(p_hours numeric) returns void
language sql as $$
  update demo_clock set offset_hours = offset_hours + p_hours;
$$;

-- ---------------------------------------------------------------------
-- Core types and reference tables
-- ---------------------------------------------------------------------
create type loop_state as enum (
  'issued',        -- result issued, ordering clinician holds the baton
  'notified',      -- patient contacted, waiting for acknowledgement
  'acknowledged',  -- patient confirmed they saw it, next clinical step pending
  'referred',      -- offered to a receiving clinic, waiting for accept/decline
  'accepted',      -- clinic accepted, waiting for an appointment
  'appointment',   -- appointment booked, waiting for attendance
  'in_care',       -- treatment or surveillance under way
  'closed'         -- closed WITH evidence and human sign-off
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  language text not null default 'en',
  consent_messaging boolean not null default false,
  created_at timestamptz not null default now()
);

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null check (kind in ('primary', 'specialist')),
  area text,
  accepting boolean not null default true,
  has_evening_slots boolean not null default false,
  priority int not null default 100          -- lower = tried first
);

-- Configurable directory of what help actually exists at this site
create table resources (
  id uuid primary key default gen_random_uuid(),
  barrier_code text not null
    check (barrier_code in ('cost', 'transport', 'fear', 'time_off', 'understanding')),
  title text not null,
  description text,
  clinic_id uuid references clinics(id),
  available boolean not null default true
);

-- Deterministic urgency rules (no AI score): test type + flag -> urgency
create table urgency_rules (
  test_type text not null,
  flag text not null,
  urgency text not null check (urgency in ('routine', 'priority', 'urgent')),
  primary key (test_type, flag)
);
insert into urgency_rules values
  ('fit', 'positive', 'priority'),
  ('hpv', 'hpv16_18', 'urgent'),
  ('hpv', 'other_hr', 'priority');

-- Hours allowed in a state before the loop is overdue.
-- Illustrative values: set per programme policy.
create table sla_rules (
  urgency text not null check (urgency in ('routine', 'priority', 'urgent')),
  state loop_state not null,
  hours numeric not null,
  primary key (urgency, state)
);
insert into sla_rules (urgency, state, hours) values
  ('urgent',   'issued', 4),   ('urgent',   'notified', 24), ('urgent',   'acknowledged', 24),
  ('urgent',   'referred', 12),('urgent',   'accepted', 48), ('urgent',   'appointment', 168),
  ('urgent',   'in_care', 720),
  ('priority', 'issued', 12),  ('priority', 'notified', 48), ('priority', 'acknowledged', 72),
  ('priority', 'referred', 24),('priority', 'accepted', 120),('priority', 'appointment', 336),
  ('priority', 'in_care', 720),
  ('routine',  'issued', 24),  ('routine',  'notified', 72), ('routine',  'acknowledged', 120),
  ('routine',  'referred', 48),('routine',  'accepted', 168),('routine',  'appointment', 504),
  ('routine',  'in_care', 720);

create function sla_due(p_urgency text, p_state loop_state) returns timestamptz
language sql stable as $$
  select app_now() + (hours * interval '1 hour')
  from sla_rules where urgency = p_urgency and state = p_state;
$$;

-- The state machine itself, as data
create table allowed_transitions (
  from_state loop_state not null,
  to_state loop_state not null,
  requires_evidence boolean not null default false,
  primary key (from_state, to_state)
);
insert into allowed_transitions (from_state, to_state, requires_evidence) values
  ('issued',       'notified',     false),
  ('notified',     'acknowledged', false),
  ('acknowledged', 'referred',     false),
  ('acknowledged', 'in_care',      true),   -- handled locally in primary care
  ('referred',     'accepted',     true),
  ('accepted',     'appointment',  true),
  ('appointment',  'in_care',      true),
  ('notified',     'closed',       true),
  ('acknowledged', 'closed',       true),
  ('referred',     'closed',       true),
  ('accepted',     'closed',       true),
  ('appointment',  'closed',       true),
  ('in_care',      'closed',       true);

-- What counts as proof for closing a loop
create table closure_evidence_types (code text primary key, label text not null);
insert into closure_evidence_types values
  ('treatment_started',               'Treatment started'),
  ('attended_appointment',            'Specialist appointment attended'),
  ('repeat_test_normal',              'Confirmatory/repeat test normal'),
  ('patient_declined_documented',     'Patient declined care (documented)'),
  ('patient_unreachable_documented',  'Unreachable after documented attempts'),
  ('clinician_decision_stop',         'Clinician-signed decision to stop'),
  ('transferred_out',                 'Care transferred to another provider');

-- ---------------------------------------------------------------------
-- Loops, audit trail, referral attempts, messages
-- ---------------------------------------------------------------------
create table loops (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  test_type text not null,
  result_summary text not null,              -- internal only, never put in messages
  urgency text not null default 'routine'
    check (urgency in ('routine', 'priority', 'urgent')),
  state loop_state not null default 'issued',
  owner text not null,                       -- who holds the baton right now
  owner_role text not null,
  due_at timestamptz,
  barrier_code text,                         -- open patient barrier => "amber"
  escalated boolean not null default false,  -- needs a human coordinator now
  referral_clinic_id uuid references clinics(id),
  access_token text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default app_now(),
  updated_at timestamptz not null default app_now(),
  closed_at timestamptz
);

-- Append-only timeline: every handoff, barrier, reroute and closure
create table transitions (
  id bigint generated always as identity primary key,
  loop_id uuid not null references loops(id) on delete cascade,
  from_state loop_state,
  to_state loop_state not null,
  owner text not null,
  actor text not null,
  evidence jsonb,
  reason_code text,    -- cost, transport, fear, time_off, understanding,
                       -- referral_declined, referral_timed_out, no_capacity, ...
  note text,
  created_at timestamptz not null default app_now()
);
create index on transitions (loop_id, created_at);

create table referral_attempts (
  id bigint generated always as identity primary key,
  loop_id uuid not null references loops(id) on delete cascade,
  clinic_id uuid not null references clinics(id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'timed_out')),
  reason_code text,
  created_at timestamptz not null default app_now(),
  resolved_at timestamptz
);

create table messages (
  id bigint generated always as identity primary key,
  loop_id uuid not null references loops(id) on delete cascade,
  channel text not null default 'whatsapp_mock',
  direction text not null check (direction in ('out', 'in')),
  body text not null,                        -- keep minimal: link, not the result
  created_at timestamptz not null default app_now()
);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create function log_event(
  p_loop_id uuid, p_state loop_state, p_owner text, p_actor text,
  p_reason text, p_evidence jsonb default null, p_note text default null
) returns void language sql as $$
  insert into transitions (loop_id, from_state, to_state, owner, actor, reason_code, evidence, note)
  values (p_loop_id, p_state, p_state, p_owner, p_actor, p_reason, p_evidence, p_note);
$$;

create function check_closure_evidence(p_evidence jsonb) returns void
language plpgsql stable as $$
begin
  if p_evidence is null
     or not exists (select 1 from closure_evidence_types where code = p_evidence->>'type') then
    raise exception 'Closure needs evidence of an accepted type (got: %)',
      coalesce(p_evidence->>'type', 'none');
  end if;
  if coalesce(trim(p_evidence->>'signed_by'), '') = '' then
    raise exception 'Closure needs a named clinician sign-off (evidence.signed_by)';
  end if;
  if p_evidence->>'type' = 'patient_unreachable_documented'
     and coalesce((p_evidence->>'attempts')::int, 0) < 3 then
    raise exception 'Closing as unreachable needs at least 3 documented contact attempts';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Creating a loop (called when an actionable result arrives)
-- ---------------------------------------------------------------------
create function create_loop(
  p_patient uuid, p_test_type text, p_result_summary text, p_flag text,
  p_owner text, p_owner_role text default 'ordering_clinician'
) returns loops language plpgsql as $$
declare
  v_urgency text;
  v_loop loops;
begin
  select urgency into v_urgency from urgency_rules
   where test_type = p_test_type and flag = p_flag;
  v_urgency := coalesce(v_urgency, 'routine');

  insert into loops (patient_id, test_type, result_summary, urgency, owner, owner_role, due_at)
  values (p_patient, p_test_type, p_result_summary, v_urgency, p_owner, p_owner_role,
          sla_due(v_urgency, 'issued'))
  returning * into v_loop;

  insert into transitions (loop_id, from_state, to_state, owner, actor, note)
  values (v_loop.id, null, 'issued', p_owner, 'lab', 'Actionable result issued');

  return v_loop;
end $$;

-- ---------------------------------------------------------------------
-- The core: advance a loop. Rejects invalid moves, needs a named owner,
-- needs evidence where required, and enforces closure rules.
-- ---------------------------------------------------------------------
create function advance_loop(
  p_loop_id uuid, p_to loop_state, p_owner text, p_owner_role text, p_actor text,
  p_evidence jsonb default null, p_reason_code text default null, p_note text default null
) returns loops language plpgsql as $$
declare
  v_loop loops;
  v_rule allowed_transitions;
begin
  if coalesce(trim(p_owner), '') = '' then
    raise exception 'Every transition needs a named owner';
  end if;

  select * into v_loop from loops where id = p_loop_id for update;
  if not found then
    raise exception 'Loop % not found', p_loop_id;
  end if;

  select * into v_rule from allowed_transitions
   where from_state = v_loop.state and to_state = p_to;
  if not found then
    raise exception 'Transition % -> % is not allowed', v_loop.state, p_to;
  end if;

  if v_rule.requires_evidence and (p_evidence is null or p_evidence = '{}'::jsonb) then
    raise exception 'Moving to % requires evidence', p_to;
  end if;

  if p_to = 'closed' then
    perform check_closure_evidence(p_evidence);
  end if;

  insert into transitions (loop_id, from_state, to_state, owner, actor, evidence, reason_code, note)
  values (p_loop_id, v_loop.state, p_to, p_owner, p_actor, p_evidence, p_reason_code, p_note);

  update loops set
    state = p_to,
    owner = p_owner,
    owner_role = p_owner_role,
    due_at = sla_due(urgency, p_to),
    escalated = false,
    updated_at = app_now(),
    closed_at = case when p_to = 'closed' then app_now() else null end
  where id = p_loop_id
  returning * into v_loop;

  return v_loop;
end $$;

-- ---------------------------------------------------------------------
-- Referral routing: offer -> accept / decline (reason) / timeout -> reroute
-- ---------------------------------------------------------------------
create function route_referral(p_loop_id uuid, p_actor text default 'system')
returns loops language plpgsql as $$
declare
  v_loop loops;
  v_clinic clinics;
begin
  select * into v_loop from loops where id = p_loop_id for update;
  if not found then
    raise exception 'Loop % not found', p_loop_id;
  end if;
  if v_loop.state not in ('acknowledged', 'referred') then
    raise exception 'Can only route a referral from acknowledged or referred (loop is %)', v_loop.state;
  end if;

  select c.* into v_clinic from clinics c
   where c.kind = 'specialist' and c.accepting
     and not exists (select 1 from referral_attempts a
                      where a.loop_id = p_loop_id and a.clinic_id = c.id)
   order by c.priority limit 1;

  if not found then
    -- Nobody left to try: hand the baton to a human, visibly
    update loops set escalated = true,
           owner = 'Care coordinator (referral unplaced)',
           owner_role = 'care_coordinator',
           updated_at = app_now()
     where id = p_loop_id returning * into v_loop;
    perform log_event(p_loop_id, v_loop.state, v_loop.owner, p_actor, 'no_capacity', null,
                      'No specialist clinic available; escalated to a human');
    return v_loop;
  end if;

  insert into referral_attempts (loop_id, clinic_id) values (p_loop_id, v_clinic.id);

  if v_loop.state = 'acknowledged' then
    update loops set referral_clinic_id = v_clinic.id where id = p_loop_id;
    return advance_loop(p_loop_id, 'referred', v_clinic.name, 'receiving_clinic', p_actor,
                        null, null, 'Referral sent to ' || v_clinic.name);
  end if;

  update loops set referral_clinic_id = v_clinic.id, owner = v_clinic.name,
         owner_role = 'receiving_clinic', escalated = false,
         due_at = sla_due(urgency, 'referred'), updated_at = app_now()
   where id = p_loop_id returning * into v_loop;
  perform log_event(p_loop_id, 'referred', v_clinic.name, p_actor, 'rerouted',
                    jsonb_build_object('clinic_id', v_clinic.id), 'Rerouted to ' || v_clinic.name);
  return v_loop;
end $$;

create function accept_referral(p_loop_id uuid, p_actor text)
returns loops language plpgsql as $$
declare
  v_attempt referral_attempts;
  v_clinic clinics;
begin
  select * into v_attempt from referral_attempts
   where loop_id = p_loop_id and status = 'pending'
   order by id desc limit 1 for update;
  if not found then
    raise exception 'No pending referral for this loop';
  end if;
  select * into v_clinic from clinics where id = v_attempt.clinic_id;

  update referral_attempts set status = 'accepted', resolved_at = app_now()
   where id = v_attempt.id;

  return advance_loop(p_loop_id, 'accepted', v_clinic.name, 'receiving_clinic', p_actor,
    jsonb_build_object('type', 'referral_accepted', 'clinic_id', v_clinic.id, 'accepted_by', p_actor));
end $$;

create function decline_referral(p_loop_id uuid, p_reason text, p_actor text)
returns loops language plpgsql as $$
begin
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A decline needs a reason';
  end if;

  update referral_attempts set status = 'declined', reason_code = p_reason, resolved_at = app_now()
   where loop_id = p_loop_id and status = 'pending';
  if not found then
    raise exception 'No pending referral to decline';
  end if;

  perform log_event(p_loop_id, 'referred', p_actor, p_actor, 'referral_declined',
                    jsonb_build_object('reason', p_reason), 'Declined: ' || p_reason);
  return route_referral(p_loop_id, 'system');
end $$;

-- Run on a schedule (pg_cron) or by hand after fast_forward() in the demo
create function sweep_timeouts() returns int language plpgsql as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select l.id, l.owner from loops l
     where l.state = 'referred' and l.due_at < app_now()
       and exists (select 1 from referral_attempts a
                    where a.loop_id = l.id and a.status = 'pending')
  loop
    update referral_attempts set status = 'timed_out', resolved_at = app_now()
     where loop_id = r.id and status = 'pending';
    perform log_event(r.id, 'referred', r.owner, 'system', 'referral_timed_out');
    perform route_referral(r.id, 'system');
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------
-- Patient barriers: report -> options from the directory -> resolve
-- ---------------------------------------------------------------------
create function record_barrier(p_loop_id uuid, p_barrier text, p_actor text default 'patient')
returns jsonb language plpgsql as $$
declare
  v_loop loops;
  v_owner text;
  v_role text;
  v_due timestamptz;
begin
  if p_barrier not in ('cost', 'transport', 'fear', 'time_off', 'understanding') then
    raise exception 'Unknown barrier code %', p_barrier;
  end if;

  select * into v_loop from loops where id = p_loop_id for update;
  if not found then
    raise exception 'Loop % not found', p_loop_id;
  end if;
  if v_loop.state = 'closed' then
    raise exception 'Loop is closed';
  end if;

  v_owner := v_loop.owner;
  v_role := v_loop.owner_role;
  v_due := v_loop.due_at;

  -- Fear or confusion goes to a human nurse callback with a short clock
  if p_barrier in ('fear', 'understanding') then
    v_owner := 'Tele-triage nurse';
    v_role := 'nurse_triage';
    v_due := least(coalesce(v_loop.due_at, app_now() + interval '4 hours'),
                   app_now() + interval '4 hours');
  end if;

  update loops set barrier_code = p_barrier, owner = v_owner, owner_role = v_role,
         due_at = v_due, updated_at = app_now()
   where id = p_loop_id;

  perform log_event(p_loop_id, v_loop.state, v_owner, p_actor, p_barrier, null,
                    'Patient reported a barrier');

  return (select coalesce(jsonb_agg(jsonb_build_object(
            'id', r.id, 'title', r.title, 'description', r.description,
            'clinic_id', r.clinic_id)), '[]'::jsonb)
            from resources r where r.barrier_code = p_barrier and r.available);
end $$;

create function resolve_barrier(
  p_loop_id uuid, p_resource_id uuid, p_owner text, p_owner_role text,
  p_actor text default 'patient'
) returns loops language plpgsql as $$
declare
  v_loop loops;
  v_res resources;
begin
  select * into v_loop from loops where id = p_loop_id for update;
  if not found then
    raise exception 'Loop % not found', p_loop_id;
  end if;
  if v_loop.barrier_code is null then
    raise exception 'No open barrier on this loop';
  end if;

  select * into v_res from resources where id = p_resource_id and available;
  if not found then
    raise exception 'Resource not available';
  end if;

  update loops set barrier_code = null, owner = p_owner, owner_role = p_owner_role,
         due_at = sla_due(urgency, state), updated_at = app_now()
   where id = p_loop_id returning * into v_loop;

  perform log_event(p_loop_id, v_loop.state, p_owner, p_actor, 'barrier_resolved',
                    jsonb_build_object('resource_id', v_res.id, 'resource', v_res.title));
  return v_loop;
end $$;

-- Patient/clinician secure links: look up by token, never expose the result
create function get_loop_by_token(p_token text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'loop_id', l.id,
    'first_name', split_part(p.full_name, ' ', 1),
    'test_type', l.test_type,
    'state', l.state,
    'barrier_code', l.barrier_code,
    'due_at', l.due_at)
  from loops l join patients p on p.id = l.patient_id
  where l.access_token = p_token;
$$;

-- ---------------------------------------------------------------------
-- Views: board and metrics (computed from the timeline, not projected)
-- ---------------------------------------------------------------------
create view v_board as
select
  l.id, p.full_name as patient, l.test_type, l.urgency, l.state,
  l.owner, l.owner_role, l.due_at,
  round(extract(epoch from (l.due_at - app_now())) / 3600, 1) as hours_to_due,
  l.barrier_code, l.escalated,
  case
    when l.state = 'closed' then 'closed'
    when l.escalated or l.due_at < app_now() then 'overdue'   -- red
    when l.barrier_code is not null then 'at_risk'            -- amber
    else 'on_track'                                           -- green
  end as status
from loops l join patients p on p.id = l.patient_id;

create view v_loop_milestones as
select
  loop_id,
  min(created_at) filter (where to_state = 'issued')       as issued_at,
  min(created_at) filter (where to_state = 'notified')     as notified_at,
  min(created_at) filter (where to_state = 'acknowledged') as acknowledged_at,
  min(created_at) filter (where to_state = 'referred')     as referred_at,
  min(created_at) filter (where to_state = 'accepted')     as accepted_at,
  min(created_at) filter (where to_state = 'appointment')  as appointment_at,
  min(created_at) filter (where to_state = 'in_care')      as in_care_at,
  min(created_at) filter (where to_state = 'closed')       as closed_at
from transitions
where from_state is distinct from to_state      -- ignore same-state events
group by loop_id;

-- All durations measured in hours from the moment the result was issued
create view v_loop_metrics as
select
  m.*,
  extract(epoch from (notified_at - issued_at)) / 3600     as hrs_to_notify,
  extract(epoch from (acknowledged_at - issued_at)) / 3600 as hrs_to_acknowledge,
  extract(epoch from (accepted_at - issued_at)) / 3600     as hrs_to_referral_accepted,
  extract(epoch from (appointment_at - issued_at)) / 3600  as hrs_to_appointment,
  extract(epoch from (closed_at - issued_at)) / 3600       as hrs_to_close
from v_loop_milestones m;

create view v_metrics_summary as
select
  (select count(*) from v_board)                                   as total_loops,
  (select count(*) from v_board where status = 'closed')           as closed_loops,
  (select count(*) from v_board where status <> 'closed')          as open_loops,
  (select count(*) from v_board where status = 'overdue')          as overdue_loops,
  (select round(avg(hrs_to_notify)::numeric, 1) from v_loop_metrics)       as avg_hrs_to_notify,
  (select round(avg(hrs_to_acknowledge)::numeric, 1) from v_loop_metrics)  as avg_hrs_to_acknowledge,
  (select round(avg(hrs_to_appointment)::numeric, 1) from v_loop_metrics)  as avg_hrs_to_appointment,
  (select round(avg(hrs_to_close)::numeric, 1) from v_loop_metrics)        as avg_hrs_to_close;

create view v_dropoff_reasons as
select reason_code, count(*) as events
from transitions
where reason_code is not null and reason_code not in ('barrier_resolved', 'rerouted')
group by reason_code
order by events desc;
