import React from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle,
  ShieldAlert,
  Users,
  TrendingDown,
  PieChart,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { batonEngine } from '../lib/batonEngine';

export const MetricsView: React.FC = () => {
  const metrics = batonEngine.getMetricsSummary();
  const dropoffs = batonEngine.getDropoffReasons();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase mb-1">
          POPULATION HEALTH LEADERSHIP
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Programme Metrics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Real measures computed directly from the case transition timeline (`v_loop_metrics`), not statistical projections.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Screening Loops</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.total_loops}</p>
          <p className="text-[11px] text-slate-400 mt-1">Single accountable owner</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Closed with Proof</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{metrics.closed_loops}</p>
          <p className="text-[11px] text-emerald-700/80 mt-1">Clinician-signed evidence</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Active in Continuum</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">{metrics.open_loops}</p>
          <p className="text-[11px] text-blue-700/80 mt-1">Zero unowned handoffs</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Overdue / Escalated</p>
          <p className="text-3xl font-extrabold text-rose-600 mt-2">{metrics.overdue_loops}</p>
          <p className="text-[11px] text-rose-700/80 mt-1">SLA alarms dispatched</p>
        </div>
      </div>

      {/* Timeline Milestones Progression */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Average Turnaround by Transition Milestone</h2>
            <p className="text-xs text-slate-500">Measured in hours from the exact moment the screening result was issued</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold">
            v_loop_metrics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Step 1: Result &rarr; Notified</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">
              {metrics.avg_hrs_to_notify} <span className="text-xs font-normal text-slate-500">hrs</span>
            </p>
            <p className="text-[11px] text-slate-500">Target SLA: 4 - 24 hours</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Step 2: Result &rarr; Acknowledged</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">
              {metrics.avg_hrs_to_acknowledge} <span className="text-xs font-normal text-slate-500">hrs</span>
            </p>
            <p className="text-[11px] text-slate-500">Target SLA: 24 - 72 hours</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Step 3: Result &rarr; Appt Booked</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">
              {metrics.avg_hrs_to_appointment} <span className="text-xs font-normal text-slate-500">hrs</span>
            </p>
            <p className="text-[11px] text-slate-500">Target SLA: 168 - 336 hours</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Step 4: Result &rarr; Verified Closed</span>
            <p className="text-2xl font-extrabold text-emerald-900 font-mono">
              {metrics.avg_hrs_to_close} <span className="text-xs font-normal text-emerald-700">hrs</span>
            </p>
            <p className="text-[11px] text-emerald-700">Treatment started / test normal</p>
          </div>
        </div>
      </div>

      {/* Drop-off & Barrier Reasons Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Why Patients Stall or Drop Off</h2>
            <p className="text-xs text-slate-500">Directly recorded reasons from patient feedback & referral declines</p>
          </div>

          {dropoffs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No drop-off events recorded in the current timeline.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {dropoffs.map((d) => {
                const totalEvents = dropoffs.reduce((acc, curr) => acc + curr.events, 0);
                const pct = Math.round((d.events / totalEvents) * 100);

                return (
                  <div key={d.reason_code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 capitalize">
                        {d.reason_code.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-slate-500">
                        {d.events} event(s) ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Relay Protocol Guarantees */}
        <div className="bg-[#063a2f] text-white rounded-2xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Core Protocol Guarantees</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">Zero Patient Leakage</h2>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Unlike traditional CRM notification systems, Baton functions as an atomic state machine:
            </p>

            <ul className="space-y-2 text-xs text-emerald-100/90 pt-1">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong>No Silent Failures:</strong> When a clinic declines or times out, the referral automatically bounces to the next clinic in the priority schedule.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong>No Premature Closure:</strong> Early closure without accepted evidence (biopsy, attendance, treatment) is cryptographically rejected by database rules.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong>Human Decision Guardrails:</strong> Urgency is computed via deterministic rules, never a black-box AI score.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-emerald-800/60 text-[11px] text-emerald-300 font-mono">
            Compliant with ISO 27799 / HIPAA Auditability
          </div>
        </div>
      </div>
    </div>
  );
};
