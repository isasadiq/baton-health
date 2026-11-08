export type LoopState = 
  | 'issued'
  | 'notified'
  | 'acknowledged'
  | 'referred'
  | 'accepted'
  | 'appointment'
  | 'in_care'
  | 'closed';

export type Urgency = 'routine' | 'priority' | 'urgent';

export type BarrierCode = 'cost' | 'transport' | 'fear' | 'time_off' | 'understanding';

export type ClinicKind = 'primary' | 'specialist';

export type ReferralStatus = 'pending' | 'accepted' | 'declined' | 'timed_out';

export type BoardStatus = 'on_track' | 'at_risk' | 'overdue' | 'closed';

export type ClosureEvidenceCode = 
  | 'treatment_started'
  | 'attended_appointment'
  | 'repeat_test_normal'
  | 'patient_declined_documented'
  | 'patient_unreachable_documented'
  | 'clinician_decision_stop'
  | 'transferred_out';

export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  language: string;
  consent_messaging: boolean;
  created_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  kind: ClinicKind;
  area: string;
  accepting: boolean;
  has_evening_slots: boolean;
  priority: number;
}

export interface Resource {
  id: string;
  barrier_code: BarrierCode;
  title: string;
  description: string;
  clinic_id?: string | null;
  available: boolean;
}

export interface ClosureEvidence {
  type: ClosureEvidenceCode;
  signed_by: string;
  attempts?: number;
  note?: string;
  ref?: string;
}

export interface Loop {
  id: string;
  patient_id: string;
  test_type: string;
  result_summary: string;
  urgency: Urgency;
  state: LoopState;
  owner: string;
  owner_role: string;
  due_at: string;
  barrier_code: BarrierCode | null;
  escalated: boolean;
  referral_clinic_id: string | null;
  access_token: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface Transition {
  id: number;
  loop_id: string;
  from_state: LoopState | null;
  to_state: LoopState;
  owner: string;
  actor: string;
  evidence: any | null;
  reason_code: string | null;
  note: string | null;
  created_at: string;
}

export interface ReferralAttempt {
  id: number;
  loop_id: string;
  clinic_id: string;
  status: ReferralStatus;
  reason_code: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Message {
  id: number;
  loop_id: string;
  channel: string;
  direction: 'in' | 'out';
  body: string;
  created_at: string;
}

export interface BoardRow {
  id: string;
  patient: string;
  test_type: string;
  urgency: Urgency;
  state: LoopState;
  owner: string;
  owner_role: string;
  due_at: string;
  hours_to_due: number;
  barrier_code: BarrierCode | null;
  escalated: boolean;
  status: BoardStatus;
}

export interface MetricsSummary {
  total_loops: number;
  closed_loops: number;
  open_loops: number;
  overdue_loops: number;
  avg_hrs_to_notify: number;
  avg_hrs_to_acknowledge: number;
  avg_hrs_to_appointment: number;
  avg_hrs_to_close: number;
}

export interface DropoffReasonCount {
  reason_code: string;
  events: number;
}
