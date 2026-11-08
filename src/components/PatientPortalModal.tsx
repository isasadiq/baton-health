import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Calendar,
  Wallet,
  Car,
  HeartPulse,
  Clock,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Activity,
  Plus
} from 'lucide-react';
import { BarrierCode, Resource } from '../types/baton';
import { batonEngine } from '../lib/batonEngine';

interface PatientPortalModalProps {
  token: string | null;
  onClose: () => void;
}

export const PatientPortalModal: React.FC<PatientPortalModalProps> = ({ token, onClose }) => {
  if (!token) return null;

  const data = batonEngine.getLoopByToken(token);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [activeBarrier, setActiveBarrier] = useState<BarrierCode | null>(data?.barrier_code || null);
  const [matchingResources, setMatchingResources] = useState<Resource[]>([]);
  const [resolvedMessage, setResolvedMessage] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-sm w-full text-center shadow-xl">
          <p className="text-slate-700 font-semibold">Invalid or expired patient link.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-[#063a2f] text-white rounded-xl text-xs font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleAcknowledge = () => {
    try {
      if (data.state === 'notified') {
        batonEngine.advanceLoop(
          data.loop_id,
          'acknowledged',
          'Dr. Amina Bello',
          'ordering_clinician',
          'patient',
          null,
          null,
          'Patient confirmed receipt and requested scheduling'
        );
      }
      setAcknowledged(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSelectBarrier = (code: BarrierCode) => {
    try {
      const resources = batonEngine.recordBarrier(data.loop_id, code, 'patient');
      setActiveBarrier(code);
      setMatchingResources(resources);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAcceptResource = (res: Resource) => {
    try {
      batonEngine.resolveBarrier(
        data.loop_id,
        res.id,
        'Dr. Amina Bello',
        'ordering_clinician',
        'patient'
      );
      setResolvedMessage(`Support Confirmed: "${res.title}". Your care team has updated your journey.`);
      setActiveBarrier(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Mobile Device Frame matching Figma */}
      <div className="w-full max-w-[420px] bg-[#FAF9F6] border border-slate-200 rounded-[36px] overflow-hidden shadow-2xl flex flex-col my-auto relative text-slate-800">
        
        {/* Top Header */}
        <div className="p-4 px-5 pb-3 border-b border-slate-200/80 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#064e3b] text-white flex items-center justify-center font-bold shadow-sm">
              <Plus className="h-5 w-5 stroke-[3]" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-slate-900 leading-tight">Northside Primary</p>
              <p className="text-[10px] text-slate-500 font-medium">Health Centre</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>Verified Care Team</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">End-to-End Encrypted</p>
              <p className="text-[9px] text-slate-400">HIPAA/GDPR Compliant</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[640px] text-xs">
          
          {/* Hero Greeting Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>A personal note from Dr. Amina Bello</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hello, {data.first_name}
            </h1>

            <p className="text-slate-600 leading-relaxed text-xs">
              Your health center safely received your recent routine screening check. Routine screenings are standard preventive care. Our goal is to guide you safely through your next step with clarity and reassurance.
            </p>

            {/* Confidentiality Notice */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950 text-[11px]">Confidentiality Notice</p>
                <p className="text-[10px] text-emerald-800 leading-normal mt-0.5">
                  Medical result details are never sent over unencrypted text.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action / Status Response */}
          {resolvedMessage ? (
            <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-slate-900 text-xs">{resolvedMessage}</p>
              <p className="text-[11px] text-slate-600">
                You may safely close this page. A care coordinator will be in touch.
              </p>
            </div>
          ) : acknowledged ? (
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Thank you, {data.first_name}</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Your request has been delivered to your care team. Dr. Amina Bello and our referral coordinator are matching clinic slots for your confirmatory visit.
              </p>
            </div>
          ) : activeBarrier ? (
            /* Barrier Resolution Resource Picker */
            <div className="bg-white border border-emerald-300 p-5 rounded-2xl space-y-3 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Support Available</span>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">
                    We are here to remove that obstacle:
                  </p>
                </div>
                <button onClick={() => setActiveBarrier(null)} className="text-slate-400 hover:text-slate-600">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {matchingResources.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleAcceptResource(res)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all flex items-start justify-between gap-2 group"
                  >
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                        {res.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{res.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Primary CTA Button (matching Figma) */
            <button
              onClick={handleAcknowledge}
              className="w-full p-4 rounded-2xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold flex items-center justify-between shadow-md transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-emerald-200" />
                </div>
                <span className="text-xs font-bold text-left">
                  I understand — guide me to schedule follow-up
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Divider with Figma label */}
          <div className="relative py-2 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-[#FAF9F6] px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              OR LET US HELP REMOVE ANY OBSTACLE
            </span>
          </div>

          {/* Barrier Cards Section (matching Figma) */}
          <div className="space-y-2.5">
            <div>
              <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                WE CAN HELP
              </p>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Is something making this difficult right now?
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Choose what feels most helpful. Your care team will support you.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {/* Card 1: Cost */}
              <button
                onClick={() => handleSelectBarrier('cost')}
                className="w-full p-3 px-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/40 hover:shadow-sm text-left flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-900 transition-colors">
                      I'm worried about the cost
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Access community grants & reduced-fee clinics
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              {/* Card 2: Transport */}
              <button
                onClick={() => handleSelectBarrier('transport')}
                className="w-full p-3 px-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/40 hover:shadow-sm text-left flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Car className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-900 transition-colors">
                      I have trouble with transport
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Request a ride voucher or transit stipend
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              {/* Card 3: Fear */}
              <button
                onClick={() => handleSelectBarrier('fear')}
                className="w-full p-3 px-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/40 hover:shadow-sm text-left flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <HeartPulse className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-900 transition-colors">
                      I feel scared or anxious
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Request a 10-minute callback from a tele-triage nurse
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              {/* Card 4: Time Off */}
              <button
                onClick={() => handleSelectBarrier('time_off')}
                className="w-full p-3 px-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/40 hover:shadow-sm text-left flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-900 transition-colors">
                      I can't take time off work
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      View flexible evening & weekend clinic slots
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              {/* Card 5: Understanding */}
              <button
                onClick={() => handleSelectBarrier('understanding')}
                className="w-full p-3 px-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/40 hover:shadow-sm text-left flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-900 transition-colors">
                      I don't understand what this means
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Listen to a plain-language audio note in Hausa or English
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Supported by Northside PHC Care Team. You are never on this journey alone.
          </p>
        </div>
      </div>
    </div>
  );
};
