import React from 'react';
import { MessageSquare, Phone, ExternalLink, ShieldCheck, CheckCheck } from 'lucide-react';
import { batonEngine } from '../lib/batonEngine';

interface MessagesViewProps {
  onOpenPatientPortal: (token: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onOpenPatientPortal }) => {
  const loops = batonEngine.getLoops();
  const patients = batonEngine.getPatients();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase mb-1">
          COMMUNICATION DISPATCH LOG
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Messages</h1>
        <p className="text-xs text-slate-500 mt-1">
          Minimal, respectful, encrypted outreach. Medical result details are <strong>never</strong> transmitted in plain text.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
        {loops.map((l) => {
          const patient = patients.find((p) => p.id === l.patient_id);
          if (!patient) return null;

          return (
            <div key={l.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {patient.full_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{patient.full_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{patient.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    WhatsApp Mock
                  </span>
                  <button
                    onClick={() => onOpenPatientPortal(l.access_token)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#063a2f] hover:bg-[#042c23] text-white text-[11px] font-semibold transition-colors"
                  >
                    <span>Open Phone View</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Message Payload Preview */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                <p className="leading-relaxed">
                  "Hello {patient.full_name.split(' ')[0]}, your health center has received your recent screening check. Please tap below to confirm you received this and see how we can assist your next step: <span className="text-emerald-700 underline font-mono">https://baton.health/checkin/{l.access_token.slice(0, 8)}...</span>"
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-mono">
                  <span>Dispatched: {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-sans font-semibold">
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Delivered</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
