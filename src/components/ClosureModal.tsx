import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  AlertOctagon,
  CheckCircle,
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Documented Loop Closure Sign-off</h2>
              <p className="text-xs text-slate-400">Strict Evidence Verification Protocol</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Rule Reminder */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-semibold">
              <UserCheck className="h-4 w-4" />
              <span>Baton Clinical Governance Rule</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              A screening loop can <strong>never</strong> be closed automatically by a system job.
              It strictly requires proof of an accepted clinical evidence type and the legal signature
              of a named clinician.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-2.5 animate-in shake">
              <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs">Closure Validation Rejected:</p>
                <p className="text-[11px] text-rose-200">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Evidence Type */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Accepted Evidence Type:
            </label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as ClosureEvidenceCode)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
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
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-amber-300">
                <span className="font-semibold">Documented Outreach Attempts (Min: 3):</span>
                <span className="font-mono font-bold text-sm">{attempts}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={attempts}
                onChange={(e) => setAttempts(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              {attempts < 3 && (
                <p className="text-[10px] text-rose-400 font-semibold">
                  ⚠️ Protocol requires at least 3 documented contact attempts to close as unreachable!
                </p>
              )}
            </div>
          )}

          {/* Named Clinician */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Named Clinician Sign-off:
            </label>
            <input
              type="text"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              placeholder="e.g. Dr. Amina Bello"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          {/* Clinical Evidence Note */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Documentation & Audit Evidence Note:
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Record chart reference number, treatment clinic, or notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCloseLoop}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-900/30"
            >
              Sign & Seal Closure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
