import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import { Decision, ExecutionStatus } from "../types";

interface StatusBadgeProps {
  status: Decision | ExecutionStatus | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true
}) => {
  const norm = status.toUpperCase();

  let bg = "bg-slate-800/80 text-slate-300 border-slate-700/60";
  let icon = <Clock className="w-3 h-3" />;
  let label = status;

  if (norm === "ALLOW" || norm === "EXECUTED" || norm === "APPROVED") {
    bg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    icon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    label = norm === "ALLOW" ? "ALLOW" : norm === "APPROVED" ? "APPROVED" : "EXECUTED";
  } else if (norm === "REQUIRE_APPROVAL" || norm === "PENDING_APPROVAL") {
    bg = "bg-amber-500/10 text-amber-400 border-amber-500/25";
    icon = <AlertTriangle className="w-3 h-3 text-amber-400" />;
    label = "REQUIRE APPROVAL";
  } else if (norm === "BLOCK" || norm === "BLOCKED" || norm === "REJECTED") {
    bg = "bg-rose-500/10 text-rose-400 border-rose-500/25";
    icon = <XCircle className="w-3 h-3 text-rose-400" />;
    label = norm === "REJECTED" ? "REJECTED" : "BLOCK";
  } else if (norm === "PENDING_EVALUATION") {
    bg = "bg-indigo-500/10 text-indigo-400 border-indigo-500/25";
    icon = <ShieldCheck className="w-3 h-3 text-indigo-400 animate-pulse" />;
    label = "EVALUATING";
  }

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 space-x-1",
    md: "text-xs px-2.5 py-1 space-x-1.5",
    lg: "text-sm px-3.5 py-1.5 space-x-2 font-semibold tracking-wide"
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono font-medium tracking-tight transition-colors duration-150 ${sizeClasses} ${bg}`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
