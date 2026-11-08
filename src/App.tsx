import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Table as TableIcon,
  Users,
  Stethoscope,
  BarChart3,
  MessageSquare,
  Plus,
  Clock,
  FastForward,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Send,
  GitPullRequest,
  CheckCircle2,
  FileCheck2,
  Info,
  Calendar,
  Phone,
  HelpCircle
} from 'lucide-react';
import { batonEngine } from './lib/batonEngine';
import { BoardRow, LoopState, Urgency, BarrierCode } from './types/baton';
import { CaseDrawer } from './components/CaseDrawer';
import { PatientPortalModal } from './components/PatientPortalModal';
import { ClinicianActionModal } from './components/ClinicianActionModal';
import { ClosureModal } from './components/ClosureModal';
import { MetricsView } from './components/MetricsView';
import { MessagesView } from './components/MessagesView';
import { NewLoopModal } from './components/NewLoopModal';
import { AutoDemoController } from './components/AutoDemoController';

export const App: React.FC = () => {
  // Active Sidebar Nav
  const [currentNav, setCurrentNav] = useState<'board' | 'patient' | 'clinician' | 'metrics' | 'messages'>('board');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Reactivity
  const [, setTick] = useState(0);
  useEffect(() => {
    return batonEngine.subscribe(() => setTick((t) => t + 1));
  }, []);

  // Modals & Drawers
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null);
  const [patientToken, setPatientToken] = useState<string | null>(null);
  const [clinicianLoopId, setClinicianLoopId] = useState<string | null>(null);
  const [closureLoopId, setClosureLoopId] = useState<string | null>(null);
  const [showNewLoopModal, setShowNewLoopModal] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_track' | 'at_risk' | 'overdue' | 'closed'>('all');

  const board = batonEngine.getBoard();
  const metrics = batonEngine.getMetricsSummary();
  const appNow = batonEngine.appNow();
  const offsetHours = batonEngine.getOffsetHours();

  // Filtered
  const filteredBoard = board.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  // Kanban Stage Columns
  const STAGES: { key: LoopState; label: string }[] = [
    { key: 'issued', label: 'ISSUED' },
    { key: 'notified', label: 'NOTIFIED' },
    { key: 'acknowledged', label: 'ACKNOWLEDGED' },
    { key: 'referred', label: 'REFERRED' },
    { key: 'accepted', label: 'ACCEPTED' },
    { key: 'appointment', label: 'APPOINTMENT' },
    { key: 'in_care', label: 'IN CARE' },
    { key: 'closed', label: 'CLOSED' },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased overflow-hidden">
      {/* =========================================================================
          LEFT SIDEBAR (Deep Forest Green: #063a2f / #064e3b)
         ========================================================================= */}
      <aside className="w-64 bg-[#063a2f] text-white flex flex-col justify-between shrink-0 shadow-xl z-20">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 pb-8 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">Baton</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/70">Screening-to-Care Loop</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1.5">
            <button
              onClick={() => setCurrentNav('board')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentNav === 'board'
                  ? 'bg-white text-[#063a2f] shadow-md font-bold'
                  : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Kanban className="h-4 w-4 shrink-0" />
              <span>Case board</span>
              <span
                className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  currentNav === 'board' ? 'bg-[#063a2f]/10 text-[#063a2f]' : 'bg-emerald-900/80 text-emerald-200'
                }`}
              >
                {metrics.open_loops}
              </span>
            </button>

            <button
              onClick={() => {
                const firstLoop = batonEngine.getLoops()[0];
                if (firstLoop) setPatientToken(firstLoop.access_token);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-100/80 hover:bg-white/10 hover:text-white transition-all"
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Patient view</span>
              <span className="ml-auto text-[10px] text-emerald-300 font-mono">Mobile</span>
            </button>

            <button
              onClick={() => {
                const referredLoop = batonEngine.getLoops().find((l) => l.state === 'referred') || batonEngine.getLoops()[0];
                if (referredLoop) setClinicianLoopId(referredLoop.id);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-100/80 hover:bg-white/10 hover:text-white transition-all"
            >
              <Stethoscope className="h-4 w-4 shrink-0" />
              <span>Clinician</span>
              <span className="ml-auto text-[10px] text-emerald-300 font-mono">1-Tap</span>
            </button>

            <button
              onClick={() => setCurrentNav('metrics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentNav === 'metrics'
                  ? 'bg-white text-[#063a2f] shadow-md font-bold'
                  : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Metrics</span>
            </button>

            <button
              onClick={() => setCurrentNav('messages')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentNav === 'messages'
                  ? 'bg-white text-[#063a2f] shadow-md font-bold'
                  : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span>Messages</span>
            </button>
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 m-3 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center font-bold text-white text-xs">
            AB
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Dr. Amina Bello</p>
            <p className="text-[10px] text-emerald-200/70 truncate">Northside PHC Lead</p>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN RIGHT AREA
         ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Warm Sand Bar (from Figma) */}
        <div className="bg-[#FEFCE8] border-b border-[#FEF08A] px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-semibold">
              <Clock className="h-4 w-4 text-amber-700" />
              <span>Demo Clock:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200 font-bold">
                {appNow.toLocaleDateString()} {appNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {offsetHours > 0 && (
                <span className="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.2 rounded text-[10px]">
                  +{offsetHours}h fast-forwarded
                </span>
              )}
            </div>

            <span className="text-amber-800/40 hidden md:inline">•</span>
            <span className="text-amber-800/80 text-[11px] hidden md:inline">
              Rule: One owner at all times. A handoff only counts when accepted.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => batonEngine.fastForward(24)}
              className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-semibold transition-colors flex items-center gap-1 text-[11px]"
              title="Fast forward simulated time by 24h"
            >
              <FastForward className="h-3 w-3" />
              <span>+24h</span>
            </button>

            <button
              onClick={() => batonEngine.fastForward(72)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-900 font-bold transition-colors flex items-center gap-1 text-[11px] border border-rose-300"
              title="Fast forward 72h to trigger SLA breaches and auto-reroutes"
            >
              <FastForward className="h-3 w-3 text-rose-600" />
              <span>+72h (SLA Breach)</span>
            </button>

            <button
              onClick={() => batonEngine.resetDemo()}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-amber-200 transition-colors flex items-center gap-1 text-[11px]"
              title="Reset to pristine seed state"
            >
              <RotateCcw className="h-3 w-3 text-slate-500" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {currentNav === 'metrics' ? (
          <div className="flex-1 overflow-y-auto p-8">
            <MetricsView />
          </div>
        ) : currentNav === 'messages' ? (
          <div className="flex-1 overflow-y-auto p-8">
            <MessagesView onOpenPatientPortal={(tok) => setPatientToken(tok)} />
          </div>
        ) : (
          /* Case Board View */
          <div className="flex-1 overflow-y-auto p-8 flex flex-col">
            {/* Header section (matching Figma) */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 shrink-0">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase mb-1">
                  CARE LOOP ORCHESTRATION
                </p>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Case board</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every actionable screening result is a baton. One owner, one clock, no closure without proof.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* View switcher */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'kanban' ? 'bg-[#063a2f] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Kanban columns view"
                  >
                    <Kanban className="h-3.5 w-3.5" />
                    <span>Lanes</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'table' ? 'bg-[#063a2f] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Detailed table view"
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                    <span>Table</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowNewLoopModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#063a2f] hover:bg-[#042c23] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Ingest Screening Result</span>
                </button>
              </div>
            </div>

            {/* One-Click Autonomous Demo Player */}
            <AutoDemoController
              onOpenPatientPortal={(tok) => setPatientToken(tok)}
              onClosePatientPortal={() => setPatientToken(null)}
              onOpenClinicianAction={(id) => setClinicianLoopId(id)}
              onCloseClinicianAction={() => setClinicianLoopId(null)}
              onOpenClosureModal={(id) => setClosureLoopId(id)}
              onCloseClosureModal={() => setClosureLoopId(null)}
              onSwitchNav={(nav) => setCurrentNav(nav)}
            />

            {/* Filter Card & Legend (matching Figma) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4 shrink-0">
              {/* Filter tabs */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  All Cases ({board.length})
                </button>
                <button
                  onClick={() => setStatusFilter('on_track')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    statusFilter === 'on_track'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  On Track ({board.filter((b) => b.status === 'on_track').length})
                </button>
                <button
                  onClick={() => setStatusFilter('at_risk')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    statusFilter === 'at_risk'
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  At Risk ({board.filter((b) => b.status === 'at_risk').length})
                </button>
                <button
                  onClick={() => setStatusFilter('overdue')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    statusFilter === 'overdue'
                      ? 'bg-rose-100 text-rose-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Overdue / Escalated ({board.filter((b) => b.status === 'overdue').length})
                </button>
              </div>

              {/* Status Legend */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>On track</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>At risk (barrier)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span>Overdue</span>
                </div>
              </div>
            </div>

            {/* Kanban Columns Layout (Exact Figma Lane design) */}
            {viewMode === 'kanban' ? (
              <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex items-start gap-4 min-w-max h-full">
                  {STAGES.map((col) => {
                    const casesInStage = filteredBoard.filter((r) => r.state === col.key);

                    return (
                      <div
                        key={col.key}
                        className="w-72 bg-slate-100/80 border border-slate-200 rounded-2xl flex flex-col max-h-full shrink-0 shadow-inner"
                      >
                        {/* Column Header */}
                        <div className="p-3.5 px-4 border-b border-slate-200 flex items-center justify-between font-bold text-xs text-slate-700">
                          <span className="tracking-wide uppercase">{col.label}</span>
                          <span className="h-5 min-w-5 px-1.5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-mono">
                            {casesInStage.length}
                          </span>
                        </div>

                        {/* Cards List */}
                        <div className="p-3 space-y-3 overflow-y-auto flex-1">
                          {casesInStage.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs italic">
                              No cases in this stage
                            </div>
                          ) : (
                            casesInStage.map((c) => {
                              const loop = batonEngine.getLoops().find((l) => l.id === c.id);
                              const isOverdue = c.hours_to_due < 0 || c.escalated;

                              return (
                                <div
                                  key={c.id}
                                  onClick={() => setSelectedLoopId(c.id)}
                                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-emerald-600/50 cursor-pointer transition-all space-y-3 relative overflow-hidden group"
                                >
                                  {/* Color Accent Top Bar */}
                                  <div
                                    className={`absolute top-0 left-0 right-0 h-1 ${
                                      c.status === 'closed'
                                        ? 'bg-slate-400'
                                        : isOverdue
                                        ? 'bg-rose-500'
                                        : c.barrier_code
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                  />

                                  {/* Test & Urgency */}
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-[11px] font-extrabold uppercase text-slate-800 tracking-wider">
                                      {c.test_type}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                        c.urgency === 'urgent'
                                          ? 'bg-rose-100 text-rose-800'
                                          : c.urgency === 'priority'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {c.urgency}
                                    </span>
                                  </div>

                                  {/* Patient Name */}
                                  <div>
                                    <p className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900 transition-colors">
                                      {c.patient}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Baton: <strong className="text-slate-700">{c.owner}</strong>
                                    </p>
                                  </div>

                                  {/* Barrier Pill if any */}
                                  {c.barrier_code && (
                                    <div className="p-1.5 px-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-1.5 text-[11px]">
                                      <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                                      <span>Barrier: {c.barrier_code}</span>
                                    </div>
                                  )}

                                  {/* Bottom Clock & Quick Action */}
                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1 text-[11px] font-mono">
                                      <Clock
                                        className={`h-3 w-3 ${
                                          isOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-400'
                                        }`}
                                      />
                                      <span
                                        className={
                                          isOverdue
                                            ? 'text-rose-600 font-bold'
                                            : c.barrier_code
                                            ? 'text-amber-700 font-semibold'
                                            : 'text-slate-500'
                                        }
                                      >
                                        {c.status === 'closed'
                                          ? 'Closed'
                                          : c.hours_to_due > 0
                                          ? `${c.hours_to_due}h left`
                                          : `${Math.abs(c.hours_to_due)}h OVERDUE`}
                                      </span>
                                    </div>

                                    {/* Action link */}
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950"
                                    >
                                      {c.state === 'issued' && (
                                        <button
                                          onClick={() => {
                                            batonEngine.advanceLoop(
                                              c.id,
                                              'notified',
                                              c.owner,
                                              c.owner_role,
                                              'system',
                                              null,
                                              null,
                                              'Dispatched plain-language notification'
                                            );
                                          }}
                                          className="text-emerald-700 hover:underline flex items-center gap-0.5"
                                        >
                                          <span>Notify</span>
                                          <ChevronRight className="h-3 w-3" />
                                        </button>
                                      )}
                                      {c.state === 'notified' && loop && (
                                        <button
                                          onClick={() => setPatientToken(loop.access_token)}
                                          className="text-blue-700 hover:underline flex items-center gap-0.5"
                                        >
                                          <span>Patient Link</span>
                                          <ChevronRight className="h-3 w-3" />
                                        </button>
                                      )}
                                      {c.state === 'acknowledged' && (
                                        <button
                                          onClick={() => batonEngine.routeReferral(c.id, 'coordinator')}
                                          className="text-purple-700 hover:underline flex items-center gap-0.5"
                                        >
                                          <span>Route</span>
                                          <ChevronRight className="h-3 w-3" />
                                        </button>
                                      )}
                                      {c.state === 'referred' && (
                                        <button
                                          onClick={() => setClinicianLoopId(c.id)}
                                          className="text-purple-700 hover:underline flex items-center gap-0.5"
                                        >
                                          <span>Clinic Action</span>
                                          <ChevronRight className="h-3 w-3" />
                                        </button>
                                      )}
                                      {c.state === 'accepted' && (
                                        <button
                                          onClick={() => {
                                            batonEngine.advanceLoop(
                                              c.id,
                                              'appointment',
                                              c.owner,
                                              c.owner_role,
                                              'clinic',
                                              { type: 'booking', ref: 'APT-1042' }
                                            );
                                          }}
                                          className="text-emerald-700 hover:underline flex items-center gap-0.5"
                                        >
                                          <span>Book Appt</span>
                                          <ChevronRight className="h-3 w-3" />
                                        </button>
                                      )}
                                      {c.state === 'appointment' && (
                                        <button
                                          onClick={() => {
                                            batonEngine.advanceLoop(
                                              c.id,
                                              'in_care',
                                              c.owner,
                                              c.owner_role,
                                              'clinic',
                                              { type: 'attended_appointment' }
                                            );
                                          }}
                                          className="text-teal-700 hover:underline flex items-center gap-0.5"
                                        >
                                          <span>In Care</span>
                                          <ChevronRight className="h-3 w-3" />
                                        </button>
                                      )}
                                      {c.state === 'in_care' && (
                                        <button
                                          onClick={() => setClosureLoopId(c.id)}
                                          className="text-blue-700 hover:underline flex items-center gap-0.5 font-bold"
                                        >
                                          <span>Close</span>
                                          <ChevronRight className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Table View Option */
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Test</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Baton Holder</th>
                      <th className="py-3 px-4">Clock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBoard.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedLoopId(row.id)}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              row.status === 'closed'
                                ? 'bg-slate-100 text-slate-600'
                                : row.status === 'overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : row.status === 'at_risk'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.patient}</td>
                        <td className="py-3 px-4 font-mono font-bold uppercase">{row.test_type}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{row.state}</td>
                        <td className="py-3 px-4">{row.owner}</td>
                        <td className="py-3 px-4 font-mono">
                          {row.hours_to_due > 0 ? `${row.hours_to_due}h` : `${row.hours_to_due}h (overdue)`}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-800">
                          Inspect &rarr;
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-over Drawer for Case Inspection */}
      <CaseDrawer
        loopId={selectedLoopId}
        onClose={() => setSelectedLoopId(null)}
        onOpenPatientPortal={(tok) => setPatientToken(tok)}
        onOpenClinicianAction={(id) => setClinicianLoopId(id)}
        onOpenClosureModal={(id) => setClosureLoopId(id)}
      />

      {/* Patient View Modal (Mobile Experience) */}
      <PatientPortalModal token={patientToken} onClose={() => setPatientToken(null)} />

      {/* Clinician View Modal (1-Tap Magic Link) */}
      <ClinicianActionModal loopId={clinicianLoopId} onClose={() => setClinicianLoopId(null)} />

      {/* Documented Closure Modal */}
      <ClosureModal loopId={closureLoopId} onClose={() => setClosureLoopId(null)} />

      {/* New Loop Modal */}
      <NewLoopModal
        isOpen={showNewLoopModal}
        onClose={() => setShowNewLoopModal(false)}
      />
    </div>
  );
};
