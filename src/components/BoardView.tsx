import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  ArrowRight,
  Send,
  GitPullRequest,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  PlusCircle,
  UserCheck,
  Stethoscope,
  FileCheck2,
  Lock
} from 'lucide-react';
import { BoardRow, Urgency, LoopState, BoardStatus, BarrierCode } from '../types/baton';
import { batonEngine } from '../lib/batonEngine';

interface BoardViewProps {
  board: BoardRow[];
  onSelectLoop: (loopId: string) => void;
  onOpenPatientPortal: (token: string) => void;
  onOpenClinicianAction: (loopId: string) => void;
  onOpenClosureModal: (loopId: string) => void;
  onOpenNewLoopModal: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  onSelectLoop,
  onOpenPatientPortal,
  onOpenClinicianAction,
  onOpenClosureModal,
  onOpenNewLoopModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const metrics = batonEngine.getMetricsSummary();

  // Filtered rows
  const filteredBoard = board.filter((row) => {
    if (statusFilter !== 'all' && row.status !== statusFilter) return false;
    if (urgencyFilter !== 'all' && row.urgency !== urgencyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        row.patient.toLowerCase().includes(q) ||
        row.owner.toLowerCase().includes(q) ||
        row.test_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: BoardStatus, barrierCode: BarrierCode | null, escalated: boolean) => {
    if (status === 'closed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
          Closed & Documented
        </span>
      );
    }
    if (status === 'overdue' || escalated) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          Overdue / Escalated
        </span>
      );
    }
    if (status === 'at_risk') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
          At Risk ({barrierCode || 'barrier'})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
        On Track
      </span>
    );
  };

  const getUrgencyBadge = (urgency: Urgency) => {
    switch (urgency) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wide">
            Urgent
          </span>
        );
      case 'priority':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
            Priority
          </span>
        );
      case 'routine':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wide">
            Routine
          </span>
        );
    }
  };

  const getStateBadge = (state: LoopState) => {
    const labels: Record<LoopState, { text: string; bg: string }> = {
      issued: { text: '1. Issued', bg: 'bg-slate-800 text-slate-200' },
      notified: { text: '2. Notified', bg: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50' },
      acknowledged: { text: '3. Acknowledged', bg: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50' },
      referred: { text: '4. Referred', bg: 'bg-purple-900/40 text-purple-300 border-purple-700/50' },
      accepted: { text: '5. Accepted', bg: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
      appointment: { text: '6. Appt Booked', bg: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
      in_care: { text: '7. In Care', bg: 'bg-teal-900/40 text-teal-300 border-teal-700/50' },
      closed: { text: '8. Closed', bg: 'bg-slate-900 text-slate-400 border-slate-700' },
    };
    const s = labels[state];
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${s.bg}`}>
        {s.text}
      </span>
    );
  };

  // Quick Action Handlers
  const handleQuickAdvance = (e: React.MouseEvent, row: BoardRow) => {
    e.stopPropagation();
    try {
      if (row.state === 'issued') {
        batonEngine.advanceLoop(row.id, 'notified', row.owner, row.owner_role, 'system', null, null, 'Automated notification dispatched');
      } else if (row.state === 'notified') {
        batonEngine.advanceLoop(row.id, 'acknowledged', row.owner, row.owner_role, 'patient', null, null, 'Patient confirmed receipt');
      } else if (row.state === 'acknowledged') {
        batonEngine.routeReferral(row.id, 'system');
      } else if (row.state === 'accepted') {
        batonEngine.advanceLoop(row.id, 'appointment', row.owner, row.owner_role, 'clinic', { type: 'booking', ref: 'APT-' + Math.floor(1000 + Math.random() * 9000) });
      } else if (row.state === 'appointment') {
        batonEngine.advanceLoop(row.id, 'in_care', row.owner, row.owner_role, 'clinic', { type: 'attended_appointment' }, null, 'Specialist visit completed, care initiated');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRouteReferral = (e: React.MouseEvent, row: BoardRow) => {
    e.stopPropagation();
    try {
      batonEngine.routeReferral(row.id, 'coordinator');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Loops</span>
            <Lock className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{metrics.total_loops}</p>
          <p className="text-[11px] text-slate-400 mt-1">100% Accountable Custody</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Hand-offs</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{metrics.open_loops}</p>
          <p className="text-[11px] text-slate-400 mt-1">Single Named Owner</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overdue / Escalated</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-400">{metrics.overdue_loops}</p>
          <p className="text-[11px] text-rose-400/80 mt-1">Escalated to Human Coord</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Documented Closed</span>
            <CheckCircle className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-400">{metrics.closed_loops}</p>
          <p className="text-[11px] text-slate-400 mt-1">Clinician Evidence Required</p>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filters */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({board.length})
            </button>
            <button
              onClick={() => setStatusFilter('on_track')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'on_track' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              On Track
            </button>
            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'at_risk' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              At Risk (Amber)
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'overdue' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overdue (Red)
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'closed' ? 'bg-slate-800 text-slate-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Closed
            </button>
          </div>

          {/* Urgency filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Urgencies</option>
            <option value="urgent">Urgent</option>
            <option value="priority">Priority</option>
            <option value="routine">Routine</option>
          </select>

          {/* Search box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient or owner..."
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
          />
        </div>

        {/* Action button */}
        <button
          onClick={onOpenNewLoopModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Ingest New Screening Loop</span>
        </button>
      </div>

      {/* Main Relay Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Status & Health</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Test & Urgency</th>
                <th className="py-3 px-4">Loop Stage</th>
                <th className="py-3 px-4">Current Baton Holder (Owner)</th>
                <th className="py-3 px-4">One Clock (SLA)</th>
                <th className="py-3 px-4 text-right">Quick Relay Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredBoard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No active loops match the current filter.
                  </td>
                </tr>
              ) : (
                filteredBoard.map((row) => {
                  const loop = batonEngine.getLoops().find((l) => l.id === row.id);
                  const isOverdue = row.hours_to_due < 0 || row.escalated;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => onSelectLoop(row.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(row.status, row.barrier_code, row.escalated)}
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{row.patient}</span>
                          {loop && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPatientPortal(loop.access_token);
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                              title="Simulate patient mobile link"
                            >
                              <span>Phone</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Test & Urgency */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-300 uppercase">
                            {row.test_type}
                          </span>
                          {getUrgencyBadge(row.urgency)}
                        </div>
                      </td>

                      {/* State */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStateBadge(row.state)}
                      </td>

                      {/* Baton Holder */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{row.owner}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            role: {row.owner_role}
                          </span>
                        </div>
                      </td>

                      {/* Clock (SLA) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.state === 'closed' ? (
                          <span className="text-slate-500 text-xs font-mono">Completed</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Clock className={`h-3.5 w-3.5 ${isOverdue ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`} />
                            <span className={`font-mono font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                              {row.hours_to_due > 0 ? `${row.hours_to_due}h remaining` : `${Math.abs(row.hours_to_due)}h OVERDUE`}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {row.state === 'issued' && (
                            <button
                              onClick={(e) => handleQuickAdvance(e, row)}
                              className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                              title="Notify patient"
                            >
                              <Send className="h-3 w-3" />
                              <span>Notify</span>
                            </button>
                          )}

                          {row.state === 'notified' && (
                            <button
                              onClick={(e) => handleQuickAdvance(e, row)}
                              className="px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
                              title="Simulate patient acknowledgment"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Ack</span>
                            </button>
                          )}

                          {row.state === 'acknowledged' && (
                            <button
                              onClick={(e) => handleRouteReferral(e, row)}
                              className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/30 flex items-center gap-1"
                              title="Route to highest priority specialist clinic"
                            >
                              <GitPullRequest className="h-3 w-3" />
                              <span>Route</span>
                            </button>
                          )}

                          {row.state === 'referred' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenClinicianAction(row.id);
                              }}
                              className="px-2.5 py-1 rounded bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 border border-purple-500/40 flex items-center gap-1 font-semibold"
                              title="Clinic 1-tap accept or decline"
                            >
                              <Stethoscope className="h-3 w-3" />
                              <span>Clinic Action</span>
                            </button>
                          )}

                          {row.state === 'accepted' && (
                            <button
                              onClick={(e) => handleQuickAdvance(e, row)}
                              className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 flex items-center gap-1"
                              title="Log appointment booking"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Book Appt</span>
                            </button>
                          )}

                          {row.state === 'appointment' && (
                            <button
                              onClick={(e) => handleQuickAdvance(e, row)}
                              className="px-2.5 py-1 rounded bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/30 flex items-center gap-1"
                              title="Confirm attendance and treatment"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>In Care</span>
                            </button>
                          )}

                          {row.state !== 'closed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenClosureModal(row.id);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px]"
                              title="Close loop (requires evidence + clinician sign-off)"
                            >
                              <FileCheck2 className="h-3 w-3" />
                              <span>Close</span>
                            </button>
                          )}

                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
