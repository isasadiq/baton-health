import React, { useState } from 'react';
import {
  X,
  Clock,
  User,
  Shield,
  GitCommit,
  CheckCircle,
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold">
              {loop.test_type.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {patient ? patient.full_name : 'Patient Record'}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {loop.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Screening Loop: <span className="text-slate-200 font-medium">{loop.result_summary}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Active Custody & SLA Card */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Active Baton Holder (Owner)
              </span>
              <p className="text-sm font-bold text-white mt-1">{loop.owner}</p>
              <p className="text-[11px] text-slate-400 font-mono">Role: {loop.owner_role}</p>
            </div>

            <div>
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                One Clock (SLA Deadline)
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className={`h-4 w-4 ${isOverdue ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`} />
                <p className={`text-sm font-mono font-bold ${isOverdue ? 'text-rose-400' : 'text-slate-200'}`}>
                  {new Date(loop.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                  {new Date(loop.due_at).toLocaleDateString()}
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                {isOverdue ? '🚨 SLA Breached — Human Escalation Active' : 'Countdown to Escalation'}
              </p>
            </div>
          </div>

          {/* Patient Barrier Banner (Amber State) */}
          {loop.barrier_code && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Patient Reported Barrier: "{loop.barrier_code.toUpperCase()}"</span>
              </div>
              <p className="text-slate-300 text-xs">
                The patient responded that something is stopping them. The case clock has adapted, and
                support resources are available to close this barrier.
              </p>

              {/* Barrier resolution selector */}
              <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="bg-slate-950 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-slate-200 flex-1 focus:outline-none"
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
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
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
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Open Patient Mobile Edge</span>
            </button>

            {loop.state === 'referred' && (
              <button
                onClick={() => onOpenClinicianAction(loop.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Open Clinic Magic Link</span>
              </button>
            )}

            {loop.state !== 'closed' && (
              <button
                onClick={() => onOpenClosureModal(loop.id)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 font-medium transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
                <span>Close Loop</span>
              </button>
            )}
          </div>

          {/* Referral Attempts History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-400" />
                <span>Specialist Referral Routing Ledger</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {referralAttempts.length} attempt(s)
              </span>
            </div>

            {referralAttempts.length === 0 ? (
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 text-slate-500 text-center">
                No referral has been dispatched yet.
              </div>
            ) : (
              <div className="space-y-2">
                {referralAttempts.map((att) => (
                  <div
                    key={att.id}
                    className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{att.clinic_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Dispatched: {new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {att.reason_code && (
                          <span className="ml-2 text-rose-400 font-sans">
                            (Reason: {att.reason_code})
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      {att.status === 'accepted' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                          Accepted
                        </span>
                      )}
                      {att.status === 'declined' && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase">
                          Declined
                        </span>
                      )}
                      {att.status === 'timed_out' && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
                          Timed Out
                        </span>
                      )}
                      {att.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase animate-pulse">
                          Awaiting 1-Tap
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
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-blue-400" />
                <span>Append-Only Relay Timeline (`transitions`)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {transitions.length} event(s)
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {transitions.map((t) => (
                <div key={t.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-blue-500 group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">
                          {t.from_state ? `${t.from_state} → ${t.to_state}` : t.to_state}
                        </span>
                        {t.reason_code && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
                            {t.reason_code}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-500 text-[10px]">
                        {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Baton Held By: <strong className="text-slate-300">{t.owner}</strong></span>
                      <span className="font-mono text-[10px]">actor: {t.actor}</span>
                    </div>

                    {t.note && (
                      <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-900">
                        "{t.note}"
                      </p>
                    )}

                    {t.evidence && (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800/80 mt-1">
                        <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                          Documented Evidence Payload:
                        </span>
                        <pre className="font-mono text-[10px] text-emerald-400 overflow-x-auto">
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
