import React from "react";
import { Clock, ExternalLink, ArrowRight, ShieldCheck } from "lucide-react";
import { SecurityEvent } from "../types";
import { StatusBadge } from "./StatusBadge";
import { LatencyBadge } from "./LatencyBadge";

interface LiveActivityFeedProps {
  events: SecurityEvent[];
  onSelectEvent: (event: SecurityEvent) => void;
  onViewAll?: () => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  events,
  onSelectEvent,
  onViewAll
}) => {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toTimeString().split(" ")[0]; // e.g. 09:42:18
  };

  const recent = events.slice(0, 6);

  return (
    <div
      id="recent-security-events-feed"
      className="w-full rounded-2xl border border-slate-800/80 bg-[#0c0f17] p-5 md:p-6 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/60 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wide">
              Recent Security Events
            </h3>
            <p className="text-xs text-slate-400">
              Live chronological stream of intercepted agent actions
            </p>
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-mono">
          No security events recorded yet. Run a security check to populate the audit feed.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {recent.map((ev) => (
            <div
              key={ev.event_id}
              onClick={() => onSelectEvent(ev)}
              className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#121622] rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {formatTime(ev.timestamp)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {ev.proposed_action?.user || "Agent"}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs font-mono text-slate-300 truncate">
                      {ev.proposed_action?.tool || ev.proposed_action?.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-sm">
                    {ev.request}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <StatusBadge status={ev.decision} size="sm" />
                <LatencyBadge latencyMs={ev.total_latency_ms} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
