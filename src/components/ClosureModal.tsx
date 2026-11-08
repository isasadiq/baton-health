import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  AlertOctagon,
  CheckCircle2,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { ClosureEvidenceCode } from '../types/baton';
import { batonEngine, CLOSURE_EVIDENCE_TYPES } from '../lib/batonEngine';

interface ClosureModalProps {
  loopId: string | null;
  onClose: () => void;
}

export const ClosureModal: React.FC<ClosureModalProps> = ({ loopId, onClose }) => {
  if (!loopId) return null;

  const loop = batonEngine.getLoops().find((l) => l.id === loopId);
  if (!loop) return null;

  const [evidenceType, setEvidenceType] = useState<ClosureEvidenceCode>('treatment_started');
  const [signedBy, setSignedBy] = useState<string>('Dr. Amina Bello');
  const [attempts, setAttempts] = useState<number>(3);
  const [clinicalNotes, setClinicalNotes] = useState<string>('Confirmed confirmatory biopsy completed and patient initiated on appropriate care plan.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCloseLoop = () => {
    setErrorMessage(null);
    try {
      batonEngine.advanceLoop(
        loopId,
        'closed',
        signedBy,
        'ordering_clinician',
        signedBy.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        {
          type: evidenceType,
          signed_by: signedBy,
          attempts: evidenceType === 'patient_unreachable_documented' ? attempts : undefined,
          note: clinicalNotes,
        },
        evidenceType,
        `Documented closure sign-off by ${signedBy}`
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-slate-800">
        
        {/* Header - Clean Figma Style */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#063a2f] shadow-sm">
              <FileCheck2 className="h-6 w-6 text-[#063a2f]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">Documented Loop Closure</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100/70 text-[#063a2f] text-[10px] font-bold uppercase tracking-wider">
                  Audit Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Strict Evidence Verification Protocol</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Rule Reminder */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/70 text-slate-700 space-y-1">
            <div className="flex items-center gap-2 text-[#063a2f] font-bold text-xs">
              <UserCheck className="h-4 w-4 text-[#063a2f]" />
              <span>Baton Clinical Governance Rule</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              A screening loop can <strong className="text-slate-900">never</strong> be closed automatically by a system job.
              It strictly requires proof of an accepted clinical evidence type and the legal signature
              of a named clinician.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5 animate-in shake">
              <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs">Closure Validation Rejected:</p>
                <p className="text-[11px] text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Evidence Type */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold text-xs">
              Accepted Evidence Type:
            </label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as ClosureEvidenceCode)}
              className="w-full bg-[#FAF9F6] border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#063a2f]"
            >
              {CLOSURE_EVIDENCE_TYPES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unreachable attempts requirement */}
          {evidenceType === 'patient_unreachable_documented' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-amber-900">
                <span className="font-bold text-xs">Documented Outreach Attempts (Min: 3):</span>
                <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-amber-200">{attempts}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={attempts}
                onChange={(e) => setAttempts(Number(e.target.value))}
                className="w-full accent-[#063a2f]"
              />
              {attempts < 3 && (
                <p className="text-[11px] text-rose-600 font-semibold">
                  Protocol requires at least 3 documented contact attempts to close as unreachable!
                </p>
              )}
            </div>
          )}

          {/* Named Clinician */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold text-xs">
              Named Clinician Sign-off:
            </label>
            <input
              type="text"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              placeholder="e.g. Dr. Amina Bello"
              className="w-full bg-[#FAF9F6] border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#063a2f] font-semibold"
            />
          </div>

          {/* Clinical Evidence Note */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold text-xs">
              Documentation & Audit Evidence Note:
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Record chart reference number, treatment clinic, or notes..."
              className="w-full bg-[#FAF9F6] border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#063a2f]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCloseLoop}
              className="flex-1 py-3 rounded-2xl bg-[#063a2f] hover:bg-[#084c3e] text-white font-bold text-xs transition-all shadow-sm hover:shadow"
            >
              Sign & Seal Closure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
