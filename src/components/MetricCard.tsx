import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  accentColor?: "default" | "emerald" | "amber" | "rose" | "indigo";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  accentColor = "default"
}) => {
  const accentClasses = {
    default: "text-slate-400 border-slate-800/80 bg-[#0d1017]/80 hover:border-slate-700/80",
    emerald: "text-emerald-400 border-emerald-950/40 bg-[#0d1217]/90 hover:border-emerald-800/50",
    amber: "text-amber-400 border-amber-950/40 bg-[#131114]/90 hover:border-amber-800/50",
    rose: "text-rose-400 border-rose-950/40 bg-[#140e12]/90 hover:border-rose-800/50",
    indigo: "text-indigo-400 border-indigo-950/40 bg-[#0f111d]/90 hover:border-indigo-800/50"
  }[accentColor];

  const iconBgClasses = {
    default: "bg-slate-800/50 text-slate-300",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    rose: "bg-rose-500/10 text-rose-400",
    indigo: "bg-indigo-500/10 text-indigo-400"
  }[accentColor];

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-200 backdrop-blur-sm ${accentClasses}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
          {label}
        </span>
        <div className={`p-2 rounded-lg ${iconBgClasses}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl font-semibold tracking-tight text-white font-mono">
          {value}
        </div>
        {trend && (
          <span
            className={`text-[11px] font-mono font-medium ${
              trend.isPositive ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-400 line-clamp-1">
          {subtext}
        </p>
      )}
    </div>
  );
};
