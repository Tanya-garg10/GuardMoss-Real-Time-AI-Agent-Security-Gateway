import React from "react";
import { Search, Database, Shield, Zap, Layers, ExternalLink, CheckCircle } from "lucide-react";
import { PolicyItem } from "../types";
import { LatencyBadge } from "./LatencyBadge";

interface MossRetrievalPanelProps {
  policies: PolicyItem[];
  latencyMs?: number;
  totalPoliciesCount?: number;
  indexName?: string;
}

export const MossRetrievalPanel: React.FC<MossRetrievalPanelProps> = ({
  policies,
  latencyMs = 8.4,
  totalPoliciesCount = 5,
  indexName = "guardmoss-security-policies"
}) => {
  return (
    <div
      id="moss-retrieval-panel"
      className="w-full rounded-2xl border border-slate-800/80 bg-[#0c0f17] p-5 md:p-6 backdrop-blur-md"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              Retrieved Security Context
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                Moss Semantic Index
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Vector &amp; keyword hybrid retrieval over enterprise guardrail policies
            </p>
          </div>
        </div>

        {/* Latency and Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#121622] px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Results:</span>
            <span className="text-white font-semibold">{policies.length}</span>
          </div>
          <LatencyBadge latencyMs={latencyMs} label="Moss Latency" />
        </div>
      </div>

      {/* Index Metadata Bar */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 py-2.5 px-3 rounded-lg bg-[#090c12] border border-slate-800/60 my-3">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Index: <strong className="text-slate-300">{indexName}</strong></span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px]">
          <span>Hybrid Retrieval: <strong className="text-slate-300">BM25 + Dense (alpha=0.8)</strong></span>
          <span>Target Engine: <strong className="text-cyan-400">Moss Minilm C++ Engine</strong></span>
        </div>
      </div>

      {/* Retrieved Policies Cards */}
      {policies.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs font-mono">
          No policies retrieved. Submit an agent action above to perform real-time Moss search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {policies.map((policy, idx) => {
            const scorePercent = Math.round(policy.relevance_score * 100);
            const isTopMatch = idx === 0;

            const sensitivityBadge =
              policy.sensitivity_level === "CRITICAL"
                ? "bg-rose-950/40 text-rose-400 border-rose-800/50"
                : policy.sensitivity_level === "SENSITIVE"
                ? "bg-amber-950/40 text-amber-400 border-amber-800/50"
                : "bg-emerald-950/40 text-emerald-400 border-emerald-800/50";

            return (
              <div
                key={policy.id || idx}
                className={`rounded-xl border p-4 transition-all duration-200 ${
                  isTopMatch
                    ? "border-indigo-500/40 bg-[#101423] shadow-md shadow-indigo-950/20"
                    : "border-slate-800 bg-[#0e121a] hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                      Source: {policy.category || "Security Policy"}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-100 mt-0.5">
                      {policy.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${sensitivityBadge}`}
                    >
                      {policy.sensitivity_level}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-300 font-mono bg-[#080a0f] p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
                  {policy.rule}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                    <span>Relevance:</span>
                    <span className="text-indigo-300 font-semibold">
                      {scorePercent >= 80 ? "High" : scorePercent >= 60 ? "Medium" : "Relevant"} ({scorePercent}%)
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    ID: {policy.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
