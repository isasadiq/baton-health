import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  CheckCircle,
  XCircle,
  Building2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { batonEngine } from '../lib/batonEngine';

interface ClinicianActionModalProps {
  loopId: string | null;
  onClose: () => void;
}

export const ClinicianActionModal: React.FC<ClinicianActionModalProps> = ({ loopId, onClose }) => {
  if (!loopId) return null;

  const loop = batonEngine.getLoops().find((l) => l.id === loopId);
  if (!loop) return null;

  const patient = batonEngine.getPatients().find((p) => p.id === loop.patient_id);
  const attempt = batonEngine
    .getReferralAttempts(loopId)
    .find((a) => a.status === 'pending');

  const [declineReason, setDeclineReason] = useState<string>('no_capacity');
  const [showDeclineModal, setShowDeclineModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clinicName = attempt ? attempt.clinic_name : loop.owner;

  const handleAccept = () => {
    try {
      batonEngine.acceptReferral(loopId, `${clinicName} Referral Desk`);
      setSuccessMessage(`Baton Accepted! ${clinicName} is now the accountable custodian.`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDecline = () => {
    try {
      batonEngine.declineReferral(loopId, declineReason, clinicName);
      setSuccessMessage(`Referral Declined (${declineReason}). Case automatically rerouted to next clinic!`);
      setShowDeclineModal(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Clinician Card Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 text-white flex items-center justify-between border-b border-purple-700/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Stethoscope className="h-5 w-5 text-purple-200" />
            </div>
            <div>
              <p className="font-bold text-sm">Receiving Clinic Intake</p>
              <p className="text-xs text-purple-200">{clinicName} • Zero-Login Access</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-purple-200 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-xs">
          {successMessage ? (
            <div className="bg-emerald-950/50 border border-emerald-500/40 p-6 rounded-2xl text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">{successMessage}</h3>
              <p className="text-slate-300">
                The centralized Baton board and timeline have updated in real time.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
              >
                Close View
              </button>
            </div>
          ) : (
            <>
              {/* Case details summary */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    Referral Request
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-[10px] font-bold uppercase">
                    Urgency: {loop.urgency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <p className="text-slate-500 text-[10px]">Patient Reference:</p>
                    <p className="font-bold text-white text-sm">
                      {patient ? patient.full_name : 'Patient Record'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px]">Screening Test:</p>
                    <p className="font-mono font-bold text-slate-200 text-sm uppercase">
                      {loop.test_type}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="text-slate-400 font-medium">Ordering Provider:</span>{' '}
                  <strong className="text-white">Dr. Amina Bello</strong> (Northside PHC)
                  <p className="text-[11px] text-slate-400 mt-1">
                    Findings: "{loop.result_summary}"
                  </p>
                </div>
              </div>

              {/* Baton Relay Rule Note */}
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-blue-200 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>Baton Protocol Rule:</strong> A referral only transfers custody when you click
                  <strong> Accept</strong>. If you decline, you must provide a reason, and Baton will
                  immediately auto-reroute to the next specialist clinic on the priority schedule.
                </p>
              </div>

              {/* Accept / Decline actions */}
              {showDeclineModal ? (
                <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/40 space-y-3 animate-in fade-in">
                  <p className="font-bold text-rose-300">Decline Referral — Select Required Reason:</p>
                  <select
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="no_capacity">No clinic appointment capacity within SLA</option>
                    <option value="out_of_area">Patient is out of clinical catchment area</option>
                    <option value="equipment_down">Diagnostic equipment / theater down</option>
                    <option value="specialist_unavailable">Specialist on leave</option>
                  </select>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setShowDeclineModal(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDecline}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                    >
                      Confirm & Auto-Reroute
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleAccept}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Accept Baton</span>
                  </button>

                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Decline...</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
