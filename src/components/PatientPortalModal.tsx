import React, { useState } from 'react';
import {
  X,
  Heart,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Car,
  Clock,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  ArrowLeft
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
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full text-center">
          <p className="text-slate-300">Invalid or expired patient token.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-white">
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
          'Patient confirmed understanding on mobile edge'
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
      setResolvedMessage(`Thank you. We have arranged "${res.title}" for you. A care navigator will follow up.`);
      setActiveBarrier(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-md bg-slate-950 border-4 border-slate-800 rounded-[36px] overflow-hidden shadow-2xl flex flex-col my-auto relative">
        {/* Phone Notch */}
        <div className="h-6 bg-slate-900 flex items-center justify-center relative">
          <div className="w-24 h-3.5 bg-slate-950 rounded-b-xl" />
          <button
            onClick={onClose}
            className="absolute right-3 top-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* WhatsApp/SMS Simulated Header */}
        <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm">
              HN
            </div>
            <div>
              <p className="font-semibold text-xs leading-tight">Health Navigator Care Team</p>
              <p className="text-[10px] text-emerald-200">Secure Healthcare Messenger • Online</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-600/40 font-mono">
            Encrypted
          </span>
        </div>

        {/* Messaging Body */}
        <div className="p-4 bg-slate-900 flex-1 space-y-4 text-xs overflow-y-auto max-h-[580px]">
          {/* Incoming message bubble */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="h-4 w-4" />
              <span>Confidential Health Update</span>
            </div>

            <p className="text-slate-200 leading-relaxed">
              Hello <strong className="text-white">{data.first_name}</strong>, your local health center has received your recent screening test.
            </p>

            <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              Screening is a routine preventive check. Sometimes a test shows a finding that needs a simple follow-up with a doctor so you stay safe.
            </p>

            <p className="text-[11px] text-slate-400 italic">
              🔒 In accordance with patient privacy, medical details are never sent over text. We are here to guide you directly to the next step.
            </p>
          </div>

          {/* Action Pathways */}
          {resolvedMessage ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl space-y-2 text-center animate-in zoom-in-95">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-white text-xs">{resolvedMessage}</p>
              <p className="text-[11px] text-emerald-300">
                The care team has updated your case timeline. You may safely close this page.
              </p>
            </div>
          ) : acknowledged ? (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Thank you for confirming, {data.first_name}!</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Your primary doctor (Dr. Amina Bello) is now coordinating with specialist clinics for your follow-up appointment. You will receive appointment confirmation details as soon as a slot is secured.
              </p>

              {/* Optional barrier trigger */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => setActiveBarrier('cost')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                >
                  Need to change details or facing an obstacle?
                </button>
              </div>
            </div>
          ) : activeBarrier ? (
            /* Barrier Resolution Options */
            <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <p className="font-bold text-amber-300 text-xs">
                  We are here to help remove that obstacle.
                </p>
                <button
                  onClick={() => setActiveBarrier(null)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>

              <p className="text-slate-300 text-[11px]">
                Select which option works best for you:
              </p>

              <div className="space-y-2">
                {matchingResources.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleAcceptResource(res)}
                    className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all flex items-start justify-between gap-2 group"
                  >
                    <div>
                      <p className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {res.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{res.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Primary Patient Buttons */
            <div className="space-y-2.5">
              <button
                onClick={handleAcknowledge}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>I understand — please guide me to an appointment</span>
              </button>

              <p className="text-center text-[10px] text-slate-500 font-medium uppercase tracking-wider my-1">
                — OR LET US KNOW WHAT IS IN THE WAY —
              </p>

              <div className="space-y-1.5">
                <button
                  onClick={() => handleSelectBarrier('cost')}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-left flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                    <span>I'm worried about the cost</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                </button>

                <button
                  onClick={() => handleSelectBarrier('transport')}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-left flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Car className="h-3.5 w-3.5 text-blue-400" />
                    <span>I don't have transport to get there</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                </button>

                <button
                  onClick={() => handleSelectBarrier('fear')}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-left flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                    <span>I feel scared or anxious</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                </button>

                <button
                  onClick={() => handleSelectBarrier('time_off')}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-left flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-purple-400" />
                    <span>I can't take time off during normal hours</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                </button>

                <button
                  onClick={() => handleSelectBarrier('understanding')}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-left flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                    <span>I'm confused and need someone to explain</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Phone Footer Home Bar */}
        <div className="h-5 bg-slate-950 flex items-center justify-center">
          <div className="w-32 h-1 bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
};
