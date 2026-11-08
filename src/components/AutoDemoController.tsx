import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { batonEngine } from '../lib/batonEngine';

interface AutoDemoControllerProps {
  onOpenPatientPortal: (token: string) => void;
  onClosePatientPortal: () => void;
  onOpenClinicianAction: (loopId: string) => void;
  onCloseClinicianAction: () => void;
  onOpenClosureModal: (loopId: string) => void;
  onCloseClosureModal: () => void;
  onSwitchNav: (nav: 'board' | 'patient' | 'clinician' | 'metrics' | 'messages') => void;
}

export const AutoDemoController: React.FC<AutoDemoControllerProps> = ({
  onOpenPatientPortal,
  onClosePatientPortal,
  onOpenClinicianAction,
  onCloseClinicianAction,
  onOpenClosureModal,
  onCloseClosureModal,
  onSwitchNav,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepText, setCurrentStepText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const cancelRef = useRef<boolean>(false);

  const sleep = (ms: number) => {
    return new Promise((resolve) => {
      const t = setTimeout(resolve, ms);
      if (cancelRef.current) clearTimeout(t);
    });
  };

  const stopDemo = () => {
    cancelRef.current = true;
    setIsPlaying(false);
    setCurrentStepText('');
    setProgress(0);
    onClosePatientPortal();
    onCloseClinicianAction();
    onCloseClosureModal();
    onSwitchNav('board');
  };

  const runAutoDemo = async () => {
    cancelRef.current = false;
    setIsPlaying(true);
    setProgress(5);

    // 0. Reset demo to pristine state
    setCurrentStepText('Step 1/5: Initializing pristine screening registry...');
    batonEngine.resetDemo();
    onSwitchNav('board');
    await sleep(2500);
    if (cancelRef.current) return;

    // 1. Patient Notification & Barrier Resolution
    const loops = batonEngine.getLoops();
    const loop1 = loops[0];
    setProgress(20);
    setCurrentStepText('Step 2/5: Notifying patient Hauwa Musa via encrypted check-in...');
    batonEngine.advanceLoop(
      loop1.id,
      'notified',
      loop1.owner,
      loop1.owner_role,
      'system',
      null,
      null,
      'Automated encrypted link dispatched'
    );
    await sleep(1500);
    if (cancelRef.current) return;

    // Open Patient View Modal
    setCurrentStepText('Step 2/5: Patient opens check-in & reports cost barrier...');
    onOpenPatientPortal(loop1.access_token);
    await sleep(2500);
    if (cancelRef.current) return;

    // Record Cost Barrier
    batonEngine.recordBarrier(loop1.id, 'cost', 'patient');
    await sleep(2000);
    if (cancelRef.current) return;

    // Resolve with community voucher
    setCurrentStepText('Step 2/5: Matching community voucher & confirming appointment...');
    const voucherRes = batonEngine.getResources().find((r) => r.barrier_code === 'cost');
    if (voucherRes) {
      batonEngine.resolveBarrier(
        loop1.id,
        voucherRes.id,
        'Dr. Amina Bello',
        'ordering_clinician',
        'patient'
      );
    }
    await sleep(2500);
    if (cancelRef.current) return;

    // Close Patient Modal & Acknowledge
    onClosePatientPortal();
    batonEngine.advanceLoop(
      loop1.id,
      'acknowledged',
      'Dr. Amina Bello',
      'ordering_clinician',
      'patient',
      null,
      null,
      'Patient ready for scheduling'
    );
    await sleep(1500);
    if (cancelRef.current) return;

    // 2. Dispatch Referral & 1-Tap Clinician Handoff with Auto-Reroute
    setProgress(45);
    setCurrentStepText('Step 3/5: Routing referral to specialist clinic...');
    batonEngine.routeReferral(loop1.id, 'coordinator');
    await sleep(1500);
    if (cancelRef.current) return;

    // Open Clinician Action Modal
    setCurrentStepText('Step 3/5: City General is full -> Declining with "no_capacity"...');
    onOpenClinicianAction(loop1.id);
    await sleep(2500);
    if (cancelRef.current) return;

    // Decline and Auto-Reroute
    batonEngine.declineReferral(loop1.id, 'no_capacity', 'City General - Gastro Clinic');
    setCurrentStepText('Step 3/5: Automated protocol reroutes to Riverside Community Hospital!');
    await sleep(2500);
    if (cancelRef.current) return;

    // Accept by Riverside
    setCurrentStepText('Step 3/5: Riverside accepts baton! Case locked to new custodian.');
    batonEngine.acceptReferral(loop1.id, 'Riverside referral desk');
    await sleep(2000);
    if (cancelRef.current) return;
    onCloseClinicianAction();

    // Advance to appointment & in-care
    batonEngine.advanceLoop(
      loop1.id,
      'appointment',
      'Riverside referral desk',
      'receiving_clinic',
      'riverside',
      { type: 'booking', ref: 'APT-9042' }
    );
    await sleep(1500);
    batonEngine.advanceLoop(
      loop1.id,
      'in_care',
      'Riverside referral desk',
      'receiving_clinic',
      'riverside',
      { type: 'attended_appointment' }
    );

    // 3. Fast-Forward SLA Breach (+72h)
    setProgress(70);
    setCurrentStepText('Step 4/5: Fast-forwarding clock +72h to simulate SLA breach alarms...');
    batonEngine.fastForward(72);
    await sleep(3500);
    if (cancelRef.current) return;

    // 4. Evidence-Based Closure Sign-off
    setProgress(85);
    setCurrentStepText('Step 5/5: Documenting clinical closure with Dr. Amina Bello signature...');
    onOpenClosureModal(loop1.id);
    await sleep(2500);
    if (cancelRef.current) return;

    batonEngine.advanceLoop(
      loop1.id,
      'closed',
      'Dr. Amina Bello',
      'ordering_clinician',
      'dr_bello',
      {
        type: 'treatment_started',
        signed_by: 'Dr. Amina Bello',
        note: 'Biopsy confirmed Stage 1 finding. Curative endoscopic resection completed.',
      },
      'treatment_started',
      'Documented closure sign-off'
    );
    onCloseClosureModal();
    await sleep(1500);
    if (cancelRef.current) return;

    // 5. Show Metrics View
    setProgress(100);
    setCurrentStepText('Demo Complete! Displaying real timeline turnaround metrics.');
    onSwitchNav('metrics');
    await sleep(4000);

    setIsPlaying(false);
  };

  return (
    <div className="bg-gradient-to-r from-[#063a2f] via-slate-900 to-[#042c23] border border-emerald-500/40 rounded-2xl p-4 shadow-xl mb-6 text-white shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-sm shadow-inner">
            <Sparkles className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-white tracking-tight">
                One-Click Autonomous Demo
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                Screen Recording Mode
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Click play to let Baton run the entire screening-to-care protocol automatically.
            </p>
          </div>
        </div>

        <div>
          {isPlaying ? (
            <button
              onClick={stopDemo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-950/40 transition-colors animate-pulse"
            >
              <Square className="h-4 w-4 fill-white" />
              <span>Stop Demo</span>
            </button>
          ) : (
            <button
              onClick={runAutoDemo}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Play Complete Demo (Auto)</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Director HUD when Playing */}
      {isPlaying && (
        <div className="mt-3 pt-3 border-t border-emerald-800/60 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              {currentStepText}
            </span>
            <span className="font-mono text-emerald-200/80 text-[11px] font-bold">
              {progress}%
            </span>
          </div>

          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
