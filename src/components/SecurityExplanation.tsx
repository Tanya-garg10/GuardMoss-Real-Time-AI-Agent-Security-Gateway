import React from "react";
import { ShieldAlert, ShieldCheck, Scale, Lock, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { SecurityCheckResponse, ProposedToolAction } from "../types";

interface SecurityExplanationProps {
  evaluation: SecurityCheckResponse | null;
  proposedAction: ProposedToolAction | null;
}

export const SecurityExplanation: React.FC<SecurityExplanationProps> = ({
  evaluation,
  proposedAction
}) => {
  if (!evaluation || !proposedAction) return null;

  const topPolicy = evaluation.retrieved_policies[0];
  const matchedPolicyTitle = topPolicy ? topPolicy.title : "Default Enterprise Guardrail Policy";
  const sensitivity = topPolicy?.sensitivity_level || "INTERNAL";
  const riskLabel = sensitivity === "CRITICAL" ? "Critical" : sensitivity === "SENSITIVE" ? "High" : sensitivity === "INTERNAL" ? "Medium" : "Low";
  const decision = evaluation.decision;

  const isAllow = decision === "ALLOW";
  const isApproval = decision === "REQUIRE_APPROVAL";
  const isBlock = decision === "BLOCK";

  const decisionBadge = isAllow
    ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
    : isApproval
    ? "bg-amber-950/40 text-amber-400 border-amber-800/50"
    : "bg-rose-950/40 text-rose-400 border-rose-800/50";

  return (
    <div
      id="security-explanation-section"
      className="w-full rounded-2xl border border-slate-800/80 bg-[#0c0f17] p-5 md:p-6 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/60 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wide">
              Why GuardMoss decided this
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic, un-jailbreakable guardrail rule evaluation
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-[#10141e] px-2.5 py-1 rounded-md border border-slate-800">
          <Lock className="w-3 h-3 text-cyan-400" />
          <span>Deterministic Gate (Non-LLM)</span>
        </div>
      </div>

      {/* 5 Distinct Factors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Factor 1: Action */}
        <div className="p-3.5 rounded-xl bg-[#0e121a] border border-slate-800">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            Action
          </div>
          <div className="mt-1 text-sm font-mono font-semibold text-cyan-400 truncate" title={proposedAction.action}>
            {proposedAction.action}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
            {proposedAction.tool}
          </div>
        </div>

        {/* Factor 2: Matched Policy */}
        <div className="p-3.5 rounded-xl bg-[#0e121a] border border-slate-800 lg:col-span-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            Matched Policy
          </div>
          <div className="mt-1 text-sm font-medium text-slate-200 line-clamp-1" title={matchedPolicyTitle}>
            {matchedPolicyTitle}
          </div>
          <div className="text-[11px] font-mono text-indigo-400 mt-0.5">
            {topPolicy?.category || "Access Control"}
          </div>
        </div>

        {/* Factor 3: Permission */}
        <div className="p-3.5 rounded-xl bg-[#0e121a] border border-slate-800">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            Permission
          </div>
          <div className="mt-1 text-sm font-medium text-slate-200 truncate">
            {evaluation.permission_result.role || "Standard Agent"}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            Level: {evaluation.permission_result.permission_level}
          </div>
        </div>

        {/* Factor 4: Risk */}
        <div className="p-3.5 rounded-xl bg-[#0e121a] border border-slate-800">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            Risk Level
          </div>
          <div className="mt-1 text-sm font-semibold font-mono text-slate-200">
            {riskLabel}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {sensitivity} resource
          </div>
        </div>

        {/* Factor 5: Final Decision */}
        <div className="p-3.5 rounded-xl bg-[#0e121a] border border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            Final Decision
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border tracking-wide ${decisionBadge}`}
            >
              {isAllow && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isApproval && <AlertTriangle className="w-3.5 h-3.5" />}
              {isBlock && <XCircle className="w-3.5 h-3.5" />}
              <span>{decision}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-3 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/40 pt-2.5">
        <span className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-cyan-400" />
          The LLM cannot override this rule. Decisions are computed by GuardMoss C++ guardrail logic.
        </span>
        <span className="text-slate-400">
          Audit Reference: {evaluation.event_id.slice(0, 12)}
        </span>
      </div>
    </div>
  );
};
