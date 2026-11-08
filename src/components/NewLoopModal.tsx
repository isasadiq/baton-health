import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Activity } from 'lucide-react';
import { batonEngine } from '../lib/batonEngine';

interface NewLoopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewLoopModal: React.FC<NewLoopModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const patients = batonEngine.getPatients();

  const [patientId, setPatientId] = useState<string>(patients[0]?.id || '');
  const [testType, setTestType] = useState<string>('fit');
  const [flag, setFlag] = useState<string>('positive');
  const [summary, setSummary] = useState<string>('Fecal Immunochemical Test (FIT) positive >100ug/g');
  const [owner, setOwner] = useState<string>('Dr. Amina Bello');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      batonEngine.createLoop(patientId, testType, summary, flag, owner, 'ordering_clinician');
      onClose();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-[#063a2f] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Activity className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Ingest Screening Result</h2>
              <p className="text-xs text-emerald-200">Creates a new accountable care loop baton</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Select Patient:</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.phone}) — Lang: {p.language}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Screening Test:</label>
              <select
                value={testType}
                onChange={(e) => {
                  const t = e.target.value;
                  setTestType(t);
                  if (t === 'fit') {
                    setFlag('positive');
                    setSummary('Fecal Immunochemical Test (FIT) positive >100ug/g');
                  } else {
                    setFlag('hpv16_18');
                    setSummary('HPV DNA positive (Types 16/18 detected)');
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 uppercase font-mono font-bold"
              >
                <option value="fit">FIT (Colorectal)</option>
                <option value="hpv">HPV (Cervical)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Urgency Rule Flag:</label>
              <select
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
              >
                {testType === 'fit' ? (
                  <option value="positive">positive (Urgency: Priority)</option>
                ) : (
                  <>
                    <option value="hpv16_18">hpv16_18 (Urgency: Urgent)</option>
                    <option value="other_hr">other_hr (Urgency: Priority)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Result Summary (Internal Only):</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              * Protected health information. Never displayed in plain-text patient messaging.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Initial Baton Holder (Ordering Clinician):</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#063a2f] hover:bg-[#042c23] text-white font-bold transition-colors shadow-lg shadow-emerald-950/20"
            >
              Issue Baton
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
