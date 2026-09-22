import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ShieldAlert, Check, X, Lock, Play } from "lucide-react";
import { Decision, ExecutionStatus, PermissionResult, SecurityCheckResponse } from "../types";

interface SecurityDecisionCardProps {
  evaluation: SecurityCheckResponse | null;
  isLoading: boolean;
  onApprove: (eventId: string, approved: boolean, comments?: string) => Promise<void>;
  isApproving: boolean;
}

export const SecurityDecisionCard: React.FC<SecurityDecisionCardProps> = ({
  evaluation,
  isLoading,
  onApprove,
  isApproving
}) => {
  const [approvalNote, setApprovalNote] = useState("");

  if (isLoading) {
    return (
      <div id="security-decision-card-loading" className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-slate-800/60 rounded"></div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div id="security-decision-card-empty" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-400 text-xs">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
        <p>Awaiting proposed tool action evaluation...</p>
      </div>
    );
  }

  const { decision, reason, permission_result, execution_status, event_id } = evaluation;

  const getDecisionConfig = (d: Decision) => {
    switch (d) {
      case "ALLOW":
        return {
          title: "ALLOW",
          sub: "Permitted by Security Gateway",
          bg: "bg-emerald-950/40 border-emerald-500/50 text-emerald-300",
          badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          icon: CheckCircle2,
          iconColor: "text-emerald-400"
        };
      case "REQUIRE_APPROVAL":
        return {
          title: "REQUIRE APPROVAL",
          sub: "Action Held Pending Human Authorization",
          bg: "bg-amber-950/40 border-amber-500/50 text-amber-300",
          badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
          icon: AlertTriangle,
          iconColor: "text-amber-400"
        };
      case "BLOCK":
      default:
        return {
          title: "BLOCK",
          sub: "Action Terminated by Security Gateway",
          bg: "bg-rose-950/40 border-rose-500/50 text-rose-300",
          badge: "bg-rose-500/20 text-rose-400 border-rose-500/40",
          icon: XCircle,
          iconColor: "text-rose-400"
        };
    }
  };

  const config = getDecisionConfig(decision);
  const IconComponent = config.icon;

  return (
    <div id="security-decision-card" className={`border rounded-xl p-5 shadow-md ${config.bg}`}>
      {/* Header Banner */}
      <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-slate-900 border ${config.badge}`}>
            <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span id="decision-badge" className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase border ${config.badge}`}>
                {config.title}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {event_id}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {config.sub}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
            Status
          </div>
          <div id="execution-status-badge" className="text-xs font-mono font-bold text-white">
            {execution_status}
          </div>
        </div>
      </div>

      {/* Decision Reason */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Gateway Decision Logic
        </h4>
        <div id="decision-reason-text" className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
          {reason}
        </div>
      </div>

      {/* Permission Result Pill */}
      <div className="mb-4 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400">Permission Check:</span>
          <span className={`font-semibold font-mono ${permission_result.is_permitted ? "text-emerald-400" : "text-amber-400"}`}>
            {permission_result.is_permitted ? "CLEARANCE GRANTED" : "CLEARANCE RESTRICTED"}
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          User: <span className="text-slate-300">{permission_result.permission_level}</span> | Required: <span className="text-slate-300">{permission_result.required_level}</span>
        </div>
      </div>

      {/* Action Controls for REQUIRE_APPROVAL */}
      {decision === "REQUIRE_APPROVAL" && execution_status === "PENDING_APPROVAL" && (
        <div id="approval-actions-box" className="p-3.5 rounded-lg bg-slate-950 border border-amber-500/30">
          <div className="text-xs font-semibold text-amber-300 mb-2 flex items-center justify-between">
            <span>Human-In-The-Loop Authorization Required:</span>
            <span className="text-[10px] text-slate-400 font-mono">Operator: SecOps Lead</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              id="approval-comment-input"
              type="text"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Authorization justification / notes (optional)..."
              className="w-full bg-slate-900 text-xs text-white border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
            />
            <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
              <button
                id="btn-approve-action"
                type="button"
                onClick={() => onApprove(event_id, true, approvalNote)}
                disabled={isApproving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Action</span>
              </button>
              <button
                id="btn-reject-action"
                type="button"
                onClick={() => onApprove(event_id, false, approvalNote)}
                disabled={isApproving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Confirmation for APPROVED state */}
      {execution_status === "APPROVED" && (
        <div id="execution-approved-box" className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2">
          <Play className="w-4 h-4 text-emerald-400" />
          <span>Operator approved this action. Cryptographic release token signed and tool execution completed.</span>
        </div>
      )}

      {/* Tool Execution status for ALLOW */}
      {decision === "ALLOW" && (
        <div id="execution-allowed-box" className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          <span>Automatic Execution Completed: Tool action dispatched to runtime environment without manual intervention.</span>
        </div>
      )}

      {/* Blocked Alert for BLOCK */}
      {decision === "BLOCK" && (
        <div id="execution-blocked-box" className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Execution Blocked: Target resource is protected under infrastructure policy. Action was terminated before execution.</span>
        </div>
      )}
    </div>
  );
};
