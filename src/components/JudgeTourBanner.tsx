import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Users, Stethoscope, FastForward, FileCheck2, ArrowRight } from 'lucide-react';
import { batonEngine } from '../lib/batonEngine';

interface JudgeTourBannerProps {
  onOpenPatientDemo: (token: string) => void;
  onOpenClinicianDemo: (loopId: string) => void;
  onOpenClosureModal: (loopId: string) => void;
}

export const JudgeTourBanner: React.FC<JudgeTourBannerProps> = ({
  onOpenPatientDemo,
  onOpenClinicianDemo,
  onOpenClosureModal,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const loops = batonEngine.getLoops();
  const firstLoop = loops[0];
  const referredLoop = loops.find((l) => l.state === 'referred') || loops[0];

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-[#063a2f] to-slate-900 border border-emerald-500/40 rounded-2xl p-4 text-white shadow-lg mb-6 shrink-0 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
            🏆
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>Judge & Evaluator Interactive Tour</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                4-Step Protocol Test
              </span>
            </h3>
            <p className="text-[11px] text-emerald-200/80">
              Test how Baton guarantees zero dropped cases across the entire screening-to-care continuum.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-emerald-300 hover:text-white flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10"
        >
          <span>{isOpen ? 'Minimize' : 'Expand Tour'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-emerald-800/60 text-xs">
          {/* Step 1 */}
          <div className="bg-black/30 border border-white/10 p-3 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                1. Patient Barrier-Buster
              </span>
              <p className="text-[11px] text-emerald-100/90 mt-1">
                Encrypted mobile check-in. Test reporting a cost or fear barrier and seeing instant voucher matching.
              </p>
            </div>
            {firstLoop && (
              <button
                onClick={() => onOpenPatientDemo(firstLoop.access_token)}
                className="w-full py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <Users className="h-3 w-3" />
                <span>Test Patient View</span>
              </button>
            )}
          </div>

          {/* Step 2 */}
          <div className="bg-black/30 border border-white/10 p-3 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                2. 1-Tap Clinic Handoff
              </span>
              <p className="text-[11px] text-emerald-100/90 mt-1">
                Zero-login card. Click 'Decline' with reason to witness automated priority rerouting to the next hospital.
              </p>
            </div>
            {referredLoop && (
              <button
                onClick={() => {
                  // Ensure it's in referred state
                  if (referredLoop.state !== 'referred') {
                    try {
                      batonEngine.advanceLoop(referredLoop.id, 'notified', referredLoop.owner, referredLoop.owner_role, 'system');
                      batonEngine.advanceLoop(referredLoop.id, 'acknowledged', referredLoop.owner, referredLoop.owner_role, 'patient');
                      batonEngine.routeReferral(referredLoop.id, 'coordinator');
                    } catch (e) {}
                  }
                  onOpenClinicianDemo(referredLoop.id);
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <Stethoscope className="h-3 w-3" />
                <span>Test 1-Tap Handoff</span>
              </button>
            )}
          </div>

          {/* Step 3 */}
          <div className="bg-black/30 border border-white/10 p-3 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                3. Fast-Forward SLA Breach
              </span>
              <p className="text-[11px] text-emerald-100/90 mt-1">
                Advance the simulated clock 72 hours. Overdue referrals time out and cases escalate red to coordinators.
              </p>
            </div>
            <button
              onClick={() => batonEngine.fastForward(72)}
              className="w-full py-1.5 px-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              <FastForward className="h-3 w-3" />
              <span>Simulate +72h Breach</span>
            </button>
          </div>

          {/* Step 4 */}
          <div className="bg-black/30 border border-white/10 p-3 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                4. Evidence-Based Closure
              </span>
              <p className="text-[11px] text-emerald-100/90 mt-1">
                Try closing without evidence (system blocks it). Then sign off with clinician name to seal the loop.
              </p>
            </div>
            {firstLoop && (
              <button
                onClick={() => onOpenClosureModal(firstLoop.id)}
                className="w-full py-1.5 px-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <FileCheck2 className="h-3 w-3" />
                <span>Test Closure Protocol</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
