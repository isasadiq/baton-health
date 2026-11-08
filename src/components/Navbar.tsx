import React from 'react';
import { Activity, Shield, Users, Stethoscope, BarChart3, HelpCircle } from 'lucide-react';

interface NavbarProps {
  currentTab: 'board' | 'metrics' | 'guide';
  setCurrentTab: (tab: 'board' | 'metrics' | 'guide') => void;
  openPatientDemo: () => void;
  openClinicianDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openPatientDemo,
  openClinicianDemo,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">Baton</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                Relay Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Screening-to-Care Closed-Loop Orchestration
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentTab('board')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'board'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Staff Board</span>
          </button>

          <button
            onClick={() => setCurrentTab('metrics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'metrics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Programme Metrics</span>
          </button>

          <button
            onClick={() => setCurrentTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'guide'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden md:inline">Demo Script</span>
          </button>
        </nav>

        {/* Edge View Simulators */}
        <div className="flex items-center gap-2">
          <button
            onClick={openPatientDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
            title="Open patient mobile view simulation"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Patient Edge</span>
          </button>

          <button
            onClick={openClinicianDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 transition-colors"
            title="Open clinician 1-tap referral card"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Clinician Edge</span>
          </button>
        </div>
      </div>
    </header>
  );
};
