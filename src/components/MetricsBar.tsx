import React from "react";
import { Zap, Cpu, Scale, CheckCircle2, AlertTriangle, XCircle, Activity } from "lucide-react";
import { GatewayStats, SecurityCheckResponse } from "../types";

interface MetricsBarProps {
  evaluation: SecurityCheckResponse | null;
  stats: GatewayStats | null;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ evaluation, stats }) => {
  const mossMs = evaluation?.moss_latency_ms ?? (stats?.avg_moss_latency_ms || 8.4);
  const evalMs = evaluation?.evaluation_latency_ms ?? 1.1;
  const totalMs = evaluation?.total_latency_ms ?? (stats?.avg_total_latency_ms || 10.8);

  return (
    <div id="metrics-bar" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Metric 1: Moss Retrieval Latency */}
      <div id="metric-moss-latency" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-sans">Moss Retrieval</span>
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="text-xl font-bold font-mono text-cyan-300">
          {mossMs} <span className="text-xs font-normal text-slate-400">ms</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          Semantic vector retrieval
        </div>
      </div>

      {/* Metric 2: Guardrail Evaluation Latency */}
      <div id="metric-guardrail-latency" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-sans">Guardrail Engine</span>
          <Scale className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="text-xl font-bold font-mono text-purple-300">
          {evalMs} <span className="text-xs font-normal text-slate-400">ms</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          Deterministic rules
        </div>
      </div>

      {/* Metric 3: Total Latency */}
      <div id="metric-total-latency" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-sans">Total Overhead</span>
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl font-bold font-mono text-emerald-300">
          {totalMs} <span className="text-xs font-normal text-slate-400">ms</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          Inline execution path
        </div>
      </div>

      {/* Metric 4: Allows */}
      <div id="metric-allowed-count" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-sans">Allowed</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl font-bold font-mono text-emerald-400">
          {stats?.allow_count || 0}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          Direct auto-execution
        </div>
      </div>

      {/* Metric 5: Approvals */}
      <div id="metric-approvals-count" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-sans">Held For Approval</span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-xl font-bold font-mono text-amber-400">
          {stats?.approval_count || 0}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          Sensitive / DLP trigger
        </div>
      </div>

      {/* Metric 6: Blocked */}
      <div id="metric-blocked-count" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-sans">Blocked</span>
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="text-xl font-bold font-mono text-rose-400">
          {stats?.block_count || 0}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          Critical violations
        </div>
      </div>
    </div>
  );
};
