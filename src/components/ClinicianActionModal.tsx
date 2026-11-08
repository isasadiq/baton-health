import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  FileText,
  User
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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-slate-800">
        
        {/* Clinician Card Header - Clean Figma Medical Style */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#063a2f] shadow-sm">
              <Stethoscope className="h-6 w-6 text-[#063a2f]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Receiving Clinic Intake</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100/70 text-[#063a2f] text-[10px] font-bold uppercase tracking-wider">
                  Zero-Login
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {clinicName} • Secure Clinician Dispatch
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

        {/* Body Content */}
        <div className="p-6 space-y-5 text-sm">
          {successMessage ? (
            <div className="bg-emerald-50 border border-emerald-200 p-7 rounded-2xl text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{successMessage}</h3>
              <p className="text-xs text-slate-600">
                The centralized Baton board and audit trail have updated in real time.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-[#063a2f] hover:bg-[#084c3e] text-white font-bold rounded-xl transition-all shadow-sm"
              >
                Return to Board
              </button>
            </div>
          ) : (
            <>
              {/* Case details summary */}
              <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                  <span className="text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    Referral Transfer Request
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[11px] font-bold uppercase">
                    Urgency: {loop.urgency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wide">Patient Name</p>
                    <p className="font-bold text-slate-900 text-base">
                      {patient ? patient.full_name : 'Patient Record'}
                    </p>
                    <p className="text-[11px] text-slate-500">ID: {loop.patient_id.slice(0, 10)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wide">Screening Protocol</p>
                    <p className="font-bold text-slate-900 text-base uppercase">
                      {loop.test_type}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold">Positive Result Verified</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Ordering Clinician:</span>
                    <strong className="text-slate-900">Dr. Amina Bello</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Origin Facility:</span>
                    <span className="text-slate-700 font-medium">Northside PHC</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">Clinical Finding: </span>
                    <span className="font-semibold text-slate-900">"{loop.result_summary}"</span>
                  </div>
                </div>
              </div>

              {/* Baton Relay Rule Note */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-emerald-950 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#063a2f] shrink-0 mt-0.5" />
                <p className="leading-relaxed text-xs text-slate-700">
                  <strong className="text-[#063a2f]">Baton Protocol Rule:</strong> A referral only transfers custody when you click
                  <strong className="text-slate-900"> Accept</strong>. If you decline, you must provide a reason, and Baton will
                  immediately auto-reroute to the next specialist clinic on the priority schedule.
                </p>
              </div>

              {/* Accept / Decline actions */}
              {showDeclineModal ? (
                <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-3 animate-in fade-in">
                  <p className="font-bold text-rose-900 text-xs">Decline Referral — Select Required Reason:</p>
                  <select
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                  >
                    <option value="no_capacity">No clinic appointment capacity within SLA</option>
                    <option value="out_of_area">Patient is out of clinical catchment area</option>
                    <option value="equipment_down">Diagnostic equipment / theater down</option>
                    <option value="specialist_unavailable">Specialist on leave</option>
                  </select>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowDeclineModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDecline}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      Confirm & Auto-Reroute
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleAccept}
                    className="flex-1 py-3.5 px-5 rounded-2xl bg-[#063a2f] hover:bg-[#084c3e] text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Accept Custody</span>
                  </button>

                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="py-3.5 px-5 rounded-2xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-semibold flex items-center gap-2 transition-all"
                  >
                    <XCircle className="h-5 w-5 text-slate-400" />
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
