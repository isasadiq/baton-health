-- =====================================================================
-- 02_seed.sql  |  Synthetic demo data + reset_demo()
-- Run after 01_schema.sql. All names, clinics and numbers are invented.
-- =====================================================================

insert into patients (id, full_name, phone, language, consent_messaging) values
  ('00000000-0000-0000-0000-0000000000a1', 'Hauwa Musa',   '+000 000 0001', 'ha', true),
  ('00000000-0000-0000-0000-0000000000a2', 'Ibrahim Sani', '+000 000 0002', 'ha', true),
  ('00000000-0000-0000-0000-0000000000a3', 'Grace Okafor', '+000 000 0003', 'en', false)
on conflict (id) do nothing;

insert into clinics (name, kind, area, priority, has_evening_slots) values
  ('Northside Primary Health Centre',            'primary',    'North',   100, false),
  ('City General - Gastro Clinic',               'specialist', 'Central',  10, false),
  ('Riverside Community Hospital - Gastro Clinic','specialist','Riverside', 20, false),
  ('Eastgate Evening Clinic',                    'specialist', 'East',      30, true)
on conflict (name) do nothing;

-- Directory of real help available at this site (edit freely)
delete from resources;
insert into resources (barrier_code, title, description, clinic_id) values
  ('cost',          'Subsidised follow-up site',        'Reduced-fee follow-up at Riverside',
     (select id from clinics where name like 'Riverside%')),
  ('cost',          'Community health subsidy voucher', 'Covers the confirmatory procedure fee', null),
  ('transport',     'Transport assistance',             'Ride support to the clinic', null),
  ('time_off',      'Evening clinic slots',             'After-work appointments at Eastgate',
     (select id from clinics where name like 'Eastgate%')),
  ('fear',          'Call with a nurse',                'A nurse calls back within 4 hours', null),
  ('understanding', 'Plain-language explainer call',    'A clinician explains the result and next steps', null);

-- Wipes loops and reseeds a fresh demo. Wire this to a "Reset demo" button.
create or replace function reset_demo() returns void language plpgsql as $$
begin
  truncate loops restart identity cascade;     -- also clears transitions, attempts, messages
  update demo_clock set offset_hours = 0;
  update clinics set accepting = true;

  perform create_loop('00000000-0000-0000-0000-0000000000a1', 'fit',
    'FIT positive (synthetic)', 'positive', 'Dr. Amina Bello');
  perform create_loop('00000000-0000-0000-0000-0000000000a2', 'fit',
    'FIT positive (synthetic)', 'positive', 'Dr. Amina Bello');
  perform create_loop('00000000-0000-0000-0000-0000000000a3', 'hpv',
    'HPV 16/18 positive (synthetic)', 'hpv16_18', 'Dr. Amina Bello');
end $$;

select reset_demo();

-- =====================================================================
-- DEMO WALKTHROUGH (run one block at a time in the SQL editor; replace
-- <LOOP> with: select id from loops where patient_id = '...a1';)
-- =====================================================================
-- 1. Notify the patient, patient acknowledges
--    select advance_loop('<LOOP>', 'notified',     'Dr. Amina Bello', 'ordering_clinician', 'system');
--    select advance_loop('<LOOP>', 'acknowledged', 'Dr. Amina Bello', 'ordering_clinician', 'patient');
--
-- 2. Patient says "I can't afford it" -> board turns amber, options returned
--    select record_barrier('<LOOP>', 'cost');
--    select resolve_barrier('<LOOP>', '<RESOURCE_ID>', 'Dr. Amina Bello', 'ordering_clinician');
--
-- 3. Send referral, first clinic declines, auto-reroutes, second accepts
--    select route_referral('<LOOP>');
--    select decline_referral('<LOOP>', 'no_capacity', 'City General - Gastro Clinic');
--    select accept_referral('<LOOP>', 'Riverside referral desk');
--
-- 4. Early closure is BLOCKED (no evidence), then done properly
--    select advance_loop('<LOOP>', 'closed', 'Dr. Amina Bello', 'ordering_clinician', 'dr_bello');   -- fails
--    select advance_loop('<LOOP>', 'appointment', 'Riverside referral desk', 'receiving_clinic', 'riverside',
--                        '{"type":"booking","ref":"RV-1042"}');
--    select advance_loop('<LOOP>', 'in_care', 'Riverside referral desk', 'receiving_clinic', 'riverside',
--                        '{"type":"attended_appointment"}');
--    select advance_loop('<LOOP>', 'closed', 'Dr. Amina Bello', 'ordering_clinician', 'dr_bello',
--                        '{"type":"treatment_started","signed_by":"Dr. Amina Bello"}');
--
-- 5. SLA breach on demand
--    select fast_forward(72);   select sweep_timeouts();   select * from v_board;
--
-- 6. Metrics
--    select * from v_metrics_summary;   select * from v_dropoff_reasons;
