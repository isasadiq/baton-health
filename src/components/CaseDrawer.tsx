import React, { useState } from 'react';
import {
  X,
  Clock,
  User,
  Shield,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Phone,
  FileText,
  Building2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Loop, Transition, ReferralAttempt, BarrierCode } from '../types/baton';
import { batonEngine } from '../lib/batonEngine';

interface CaseDrawerProps {
  loopId: string | null;
  onClose: () => void;
  onOpenPatientPortal: (token: string) => void;
  onOpenClinicianAction: (loopId: string) => void;
  onOpenClosureModal: (loopId: string) => void;
}

export const CaseDrawer: React.FC<CaseDrawerProps> = ({
  loopId,
  onClose,
  onOpenPatientPortal,
  onOpenClinicianAction,
  onOpenClosureModal,
}) => {
  if (!loopId) return null;

  const loop = batonEngine.getLoops().find((l) => l.id === loopId);
  if (!loop) return null;

  const patient = batonEngine.getPatients().find((p) => p.id === loop.patient_id);
  const transitions = batonEngine.getTransitions(loopId);
  const referralAttempts = batonEngine.getReferralAttempts(loopId);
  const resources = batonEngine.getResources();

  const [selectedResourceId, setSelectedResourceId] = useState<string>('');

  const handleResolveBarrier = () => {
    if (!selectedResourceId) {
      alert('Please select an available resource to resolve the barrier.');
      return;
    }
    try {
      batonEngine.resolveBarrier(
        loop.id,
        selectedResourceId,
        'Dr. Amina Bello',
        'ordering_clinician',
        'coordinator'
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  const isOverdue = new Date(loop.due_at) < batonEngine.appNow() && loop.state !== 'closed';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col shadow-2xl text-slate-800">
        
        {/* Header - Figma Medical Theme */}
        <div className="p-5 border-b border-slate-100 bg-[#F8FAFC] sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#063a2f] font-mono font-bold text-xs shadow-sm">
              {loop.test_type.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {patient ? patient.full_name : 'Patient Record'}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                  {loop.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Screening Loop: <span className="text-slate-900 font-semibold">{loop.result_summary}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Active Custody & SLA Card */}
          <div className="grid grid-cols-2 gap-4 bg-[#FAF9F6] p-5 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                Active Baton Holder (Owner)
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">{loop.owner}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Role: {loop.owner_role}</p>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                One Clock (SLA Deadline)
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className={`h-4 w-4 ${isOverdue ? 'text-rose-600 animate-pulse' : 'text-[#063a2f]'}`} />
                <p className={`text-base font-mono font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                  {new Date(loop.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                  {new Date(loop.due_at).toLocaleDateString()}
                </p>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isOverdue ? '🚨 SLA Breached — Human Escalation Active' : 'Countdown to Escalation'}
              </p>
            </div>
          </div>

          {/* Patient Barrier Banner (Amber State) */}
          {loop.barrier_code && (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Patient Reported Barrier: "{loop.barrier_code.toUpperCase()}"</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                The patient responded that something is stopping them. The case clock has adapted, and
                support resources are available to close this barrier.
              </p>

              {/* Barrier resolution selector */}
              <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-800 flex-1 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                >
                  <option value="">Select Resource from Site Directory...</option>
                  {resources
                    .filter((r) => r.barrier_code === loop.barrier_code && r.available)
                    .map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.title} — {res.description}
                      </option>
                    ))}
                </select>

                <button
                  onClick={handleResolveBarrier}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-sm"
                >
                  Resolve & Resume Clock
                </button>
              </div>
            </div>
          )}

          {/* Quick Simulation Edge Links */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenPatientPortal(loop.access_token)}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#063a2f] border border-emerald-200 flex items-center justify-center gap-2 font-bold transition-colors shadow-xs"
            >
              <Phone className="h-4 w-4" />
              <span>Patient Mobile Link</span>
            </button>

            {loop.state === 'referred' && (
              <button
                onClick={() => onOpenClinicianAction(loop.id)}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center gap-2 font-bold transition-colors shadow-xs"
              >
                <Building2 className="h-4 w-4" />
                <span>Specialist Intake Link</span>
              </button>
            )}

            {loop.state !== 'closed' && (
              <button
                onClick={() => onOpenClosureModal(loop.id)}
                className="py-3 px-4 rounded-xl bg-[#063a2f] hover:bg-[#084c3e] text-white flex items-center justify-center gap-1.5 font-bold transition-all shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Close Loop</span>
              </button>
            )}
          </div>

          {/* Referral Attempts History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-[#063a2f]" />
                <span>Specialist Referral Routing Ledger</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono font-medium">
                {referralAttempts.length} attempt(s)
              </span>
            </div>

            {referralAttempts.length === 0 ? (
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200 text-slate-500 text-center text-xs">
                No referral has been dispatched yet.
              </div>
            ) : (
              <div className="space-y-2">
                {referralAttempts.map((att) => (
                  <div
                    key={att.id}
                    className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{att.clinic_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Dispatched: {new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {att.reason_code && (
                          <span className="ml-2 text-rose-600 font-sans font-medium">
                            (Reason: {att.reason_code})
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      {att.status === 'accepted' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">
                          Accepted
                        </span>
                      )}
                      {att.status === 'declined' && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase">
                          Declined
                        </span>
                      )}
                      {att.status === 'timed_out' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase">
                          Timed Out
                        </span>
                      )}
                      {att.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase animate-pulse">
                          Awaiting Intake
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Immutable Transition Timeline (Baton Handoff Ledger) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <GitCommit className="h-4 w-4 text-[#063a2f]" />
                <span>Append-Only Relay Timeline (`transitions`)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono font-medium">
                {transitions.length} event(s)
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {transitions.map((t) => (
                <div key={t.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-[#063a2f] shadow-xs group-hover:scale-125 transition-transform" />

                  <div className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/80 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {t.from_state ? `${t.from_state} → ${t.to_state}` : t.to_state}
                        </span>
                        {t.reason_code && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 text-[10px] font-mono border border-amber-200/60 font-semibold">
                            {t.reason_code}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">
                        {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span>Baton Custodian: <strong className="text-slate-900 font-bold">{t.owner}</strong></span>
                      <span className="font-mono text-[10px] text-slate-400">actor: {t.actor}</span>
                    </div>

                    {t.note && (
                      <p className="text-[11px] text-slate-700 italic pt-1.5 border-t border-slate-200/60">
                        "{t.note}"
                      </p>
                    )}

                    {t.evidence && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 mt-1.5">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">
                          Documented Evidence Payload:
                        </span>
                        <pre className="font-mono text-[10px] text-emerald-800 overflow-x-auto bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                          {JSON.stringify(t.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
