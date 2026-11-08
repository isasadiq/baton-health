import React, { useState } from 'react';
import { Clock, FastForward, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { batonEngine } from '../lib/batonEngine';

export const DemoClockBar: React.FC = () => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFastForward = (hours: number) => {
    batonEngine.fastForward(hours);
    showToast(`Fast-forwarded +${hours} hours. Swept SLA timeouts.`);
  };

  const handleSweepTimeouts = () => {
    const swept = batonEngine.sweepTimeouts();
    showToast(`Swept timeouts: ${swept} referral(s) timed out & rerouted.`);
  };

  const handleReset = () => {
    if (confirm('Reset entire demo back to pristine seed state?')) {
      batonEngine.resetDemo();
      showToast('Demo data reset to pristine seed state.');
    }
  };

  const offsetHours = batonEngine.getOffsetHours();
  const appNowDate = batonEngine.appNow();

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Clock state */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span>Simulated Clock:</span>
            <span className="font-mono text-white font-medium">
              {appNowDate.toLocaleDateString()} {appNowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {offsetHours > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                +{offsetHours}h offset
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Zero Unowned Cases • Deterministic SLA Engine Active</span>
          </div>
        </div>

        {/* Demo Fast Forward Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium hidden sm:inline">Simulate Time:</span>
          
          <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
            <button
              onClick={() => handleFastForward(4)}
              className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Advance 4 hours (Triggers Urgent notification deadlines)"
            >
              +4h
            </button>
            <button
              onClick={() => handleFastForward(12)}
              className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Advance 12 hours"
            >
              +12h
            </button>
            <button
              onClick={() => handleFastForward(24)}
              className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Advance 24 hours"
            >
              +24h
            </button>
            <button
              onClick={() => handleFastForward(72)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold transition-colors"
              title="Advance 72 hours (Triggers SLA breaches & automatic reroutes)"
            >
              <FastForward className="h-3 w-3" />
              <span>+72h (SLA Breach)</span>
            </button>
          </div>

          <button
            onClick={handleSweepTimeouts}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Evaluate timed-out referrals and trigger auto-reroutes"
          >
            Sweep Timeouts
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors"
            title="Reset database to fresh seed state"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Floating toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/40 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
};
