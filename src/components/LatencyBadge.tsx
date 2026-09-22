import React from "react";
import { Zap, Clock } from "lucide-react";

interface LatencyBadgeProps {
  latencyMs: number;
  label?: string;
  size?: "sm" | "md";
}

export const LatencyBadge: React.FC<LatencyBadgeProps> = ({
  latencyMs,
  label,
  size = "sm"
}) => {
  const isUltraFast = latencyMs <= 15;
  const isFast = latencyMs <= 50;

  const colorClasses = isUltraFast
    ? "text-cyan-400 bg-cyan-950/40 border-cyan-800/40"
    : isFast
    ? "text-slate-300 bg-slate-900/60 border-slate-800"
    : "text-amber-400 bg-amber-950/40 border-amber-800/40";

  const sizeClasses = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded border ${colorClasses} ${sizeClasses}`}
      title={`Measured response time: ${latencyMs}ms`}
    >
      {isUltraFast ? (
        <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
      ) : (
        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
      )}
      {label && <span className="text-slate-400">{label}:</span>}
      <span>{latencyMs.toFixed(1)} ms</span>
    </span>
  );
};
