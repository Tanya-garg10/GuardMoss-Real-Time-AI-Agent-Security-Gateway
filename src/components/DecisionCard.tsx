import React from "react";
import { CheckCircle, AlertTriangle, XCircle, ShieldCheck, ShieldAlert, Terminal, ArrowUpRight, Check, X } from "lucide-react";
import { SecurityCheckResponse, ProposedToolAction } from "../types";
import { LatencyBadge } from "./LatencyBadge";

interface DecisionCardProps {
  evaluation: SecurityCheckResponse | null;
  proposedAction: ProposedToolAction | null;
  agentThought?: string;
  onApprove?: () => void;
  onReject?: () => void;
  isActionLoading?: boolean;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  evaluation,
  proposedAction,
  agentThought,
  onApprove,
  onReject,
  isActionLoading = false
}) => {
  if (!evaluation || !proposedAction) {
    return (
      <div className="w-full rounded-2xl border border-slate-800/80 bg-[#0c0f17] p-8 text-center backdrop-blur-md">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <ShieldCheck className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">Awaiting Agent Action</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Select a quick scenario above or enter a prompt to view the live deterministic security evaluation.
        </p>
      </div>
    );
  }

  const decision = evaluation.decision;
  const isAllow = decision === "ALLOW";
  const isApproval = decision === "REQUIRE_APPROVAL";
  const isBlock = decision === "BLOCK";

  // Derive risk level
  const sensitivity = evaluation.retrieved_policies[0]?.sensitivity_level || "INTERNAL";
  const riskLabel = sensitivity === "CRITICAL" ? "Critical" : sensitivity === "SENSITIVE" ? "High" : sensitivity === "INTERNAL" ? "Medium" : "Low";

  // Decision styling
  const cardTheme = isAllow
    ? {
        border: "border-emerald-500/40",
        glow: "from-emerald-500/10 via-transparent to-transparent",
        badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
        accentText: "text-emerald-400",
        icon: <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />,
        headline: "Action Permitted",
        statusText: "ALLOW"
      }
    : isApproval
    ? {
        border: "border-amber-500/40",
        glow: "from-amber-500/10 via-transparent to-transparent",
        badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
        accentText: "text-amber-400",
        icon: <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />,
        headline: "Approval Required",
        statusText: "REQUIRE APPROVAL"
      }
    : {
        border: "border-rose-500/40",
        glow: "from-rose-500/10 via-transparent to-transparent",
        badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
        accentText: "text-rose-400",
        icon: <XCircle className="w-8 h-8 text-rose-400 shrink-0" />,
        headline: "Execution Prevented",
        statusText: "BLOCK"
      };

  return (
    <div
      id="live-security-decision-card"
      className={`w-full rounded-2xl border ${cardTheme.border} bg-[#0c0f17] p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300`}
    >
      {/* Dynamic ambient glow */}
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-bl ${cardTheme.glow} blur-3xl pointer-events-none rounded-full`}
      />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400 font-semibold">
            Security Decision
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-xs text-slate-400 font-mono">Event #{evaluation.event_id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-2">
          <LatencyBadge latencyMs={evaluation.total_latency_ms} label="Total" />
          <LatencyBadge latencyMs={evaluation.moss_latency_ms} label="Moss" />
        </div>
      </div>

      {/* Massive Decision Banner */}
      <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#131722] border border-slate-800 shrink-0">
            {cardTheme.icon}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl md:text-4xl font-extrabold font-mono tracking-wider ${cardTheme.accentText}`}
              >
                {cardTheme.statusText}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-mono font-medium ${cardTheme.badgeBg}`}>
                {cardTheme.headline}
              </span>
            </div>
            <p className="text-sm md:text-base font-medium text-slate-200 mt-1">
              &ldquo;{proposedAction.action}&rdquo;
            </p>
          </div>
        </div>

        {/* Action buttons for REQUIRE_APPROVAL */}
        {isApproval && (
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <button
              id="btn-approve-action"
              onClick={onApprove}
              disabled={isActionLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Approve Action</span>
            </button>
            <button
              id="btn-block-action"
              onClick={onReject}
              disabled={isActionLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 text-xs md:text-sm font-semibold transition-all disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>Block Action</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-t border-slate-800/60 bg-[#080b11]/50 rounded-xl px-4 my-2">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Agent</div>
          <div className="text-xs md:text-sm font-medium text-slate-200 mt-0.5 truncate">
            {proposedAction.user || "Research Agent"}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Tool</div>
          <div className="text-xs md:text-sm font-mono font-medium text-cyan-400 mt-0.5 truncate">
            {proposedAction.tool}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Resource</div>
          <div className="text-xs md:text-sm font-mono text-slate-200 mt-0.5 truncate">
            {proposedAction.resource}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Risk Level</div>
          <div className="mt-0.5">
            <span
              className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                riskLabel === "Critical"
                  ? "text-rose-400 bg-rose-950/40 border-rose-800/50"
                  : riskLabel === "High"
                  ? "text-amber-400 bg-amber-950/40 border-amber-800/50"
                  : "text-emerald-400 bg-emerald-950/40 border-emerald-800/50"
              }`}
            >
              {riskLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Reason Box */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-start gap-2.5">
        <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider mt-0.5 shrink-0">
          Reason:
        </span>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
          {evaluation.reason}
        </p>
      </div>

      {/* Destination if present */}
      {proposedAction.destination && (
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase text-slate-400">Destination:</span>
          <span className="font-mono text-slate-300">{proposedAction.destination}</span>
        </div>
      )}
    </div>
  );
};
