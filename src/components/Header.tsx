import React from "react";
import { Shield, ShieldAlert, Cpu, Database, RefreshCw, BookOpen } from "lucide-react";
import { GatewayStats } from "../types";

interface HeaderProps {
  stats: GatewayStats | null;
  onOpenPolicies: () => void;
  onOpenVoice: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onOpenPolicies,
  onOpenVoice,
  onRefresh,
  isRefreshing
}) => {
  return (
    <header id="guardmoss-header" className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div id="guardmoss-logo-icon" className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-slate-800 to-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 id="app-title" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  GuardMoss
                </h1>
                <span id="gateway-status-badge" className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  Protected ● Gateway Active
                </span>
              </div>
              <p id="app-subtitle" className="text-xs text-slate-400 font-normal">
                Real-Time Security Gateway for AI Agents • Moss Semantic Retrieval + Deterministic Guardrails
              </p>
            </div>
          </div>

          {/* Quick Metrics & Controls */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="hidden md:flex items-center space-x-3 text-xs text-slate-400 border-r border-slate-800 pr-3">
              <div className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Moss Avg:</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {stats ? `${stats.avg_moss_latency_ms}ms` : "8.4ms"}
                </span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Latency:</span>
                <span className="font-mono text-emerald-300 font-semibold">
                  {stats ? `${stats.avg_total_latency_ms}ms` : "10.8ms"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="btn-open-voice"
                type="button"
                onClick={onOpenVoice}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 transition-all shadow-xs"
                title="Open LiveKit Voice Agent & Session"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Voice Agent</span>
              </button>

              <button
                id="btn-open-policies"
                type="button"
                onClick={onOpenPolicies}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                title="View Moss Security Knowledge Base"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Policies ({stats?.active_policies_count || 5})</span>
              </button>

              <button
                id="btn-refresh-stats"
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
                title="Refresh Audit Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
