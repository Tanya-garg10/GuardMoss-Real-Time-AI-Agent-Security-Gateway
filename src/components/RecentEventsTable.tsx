import React, { useState } from "react";
import { History, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Eye } from "lucide-react";
import { Decision, SecurityEvent } from "../types";

interface RecentEventsTableProps {
  events: SecurityEvent[];
  onSelectEvent: (event: SecurityEvent) => void;
  onApprove: (eventId: string, approved: boolean, comments?: string) => Promise<void>;
  isApproving: boolean;
}

export const RecentEventsTable: React.FC<RecentEventsTableProps> = ({
  events,
  onSelectEvent,
  onApprove,
  isApproving
}) => {
  const [filter, setFilter] = useState<"ALL" | Decision>("ALL");

  const filtered = filter === "ALL" 
    ? events 
    : events.filter((e) => e.decision === filter);

  const getDecisionBadge = (decision: Decision) => {
    switch (decision) {
      case "ALLOW":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            ALLOW
          </span>
        );
      case "REQUIRE_APPROVAL":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            APPROVAL
          </span>
        );
      case "BLOCK":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            BLOCK
          </span>
        );
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div id="recent-security-events-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 id="events-panel-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Recent Security Audit Events
          </h3>
          <span className="text-xs font-mono text-slate-400">
            ({events.length})
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 text-xs">
          {(["ALL", "ALLOW", "REQUIRE_APPROVAL", "BLOCK"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFilter(opt)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === opt
                  ? "bg-slate-700 text-white border border-slate-600"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {opt === "ALL" ? "All Events" : opt.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Card Feed */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-lg">
          No security events matching this filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table id="security-events-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-mono text-[11px]">
                <th className="pb-2.5 font-medium">Timestamp</th>
                <th className="pb-2.5 font-medium">Action & Resource</th>
                <th className="pb-2.5 font-medium">Decision</th>
                <th className="pb-2.5 font-medium">Gateway Reason</th>
                <th className="pb-2.5 font-medium text-right">Latency</th>
                <th className="pb-2.5 font-medium text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((event) => (
                <tr
                  key={event.event_id}
                  id={`event-row-${event.event_id}`}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectEvent(event)}
                >
                  <td className="py-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                    {formatTime(event.timestamp)}
                  </td>
                  <td className="py-3">
                    <div className="font-mono text-slate-200 font-semibold">
                      {event.proposed_action.action}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                      {event.proposed_action.resource}
                      {event.proposed_action.destination && (
                        <span className="text-amber-400/90 ml-1">
                          → {event.proposed_action.destination}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    {getDecisionBadge(event.decision)}
                    {event.status === "PENDING_APPROVAL" && (
                      <div className="mt-1">
                        <button
                          id={`quick-approve-${event.event_id}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(event.event_id, true, "Quick Approve");
                          }}
                          disabled={isApproving}
                          className="px-2 py-0.5 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white text-[10px] font-semibold"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3">
                    <p className="text-slate-300 text-xs line-clamp-2 max-w-md">
                      {event.reason}
                    </p>
                  </td>
                  <td className="py-3 text-right font-mono text-[11px] whitespace-nowrap">
                    <span className="text-cyan-300">{event.moss_latency_ms}ms</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-emerald-300 font-semibold">{event.total_latency_ms}ms</span>
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button
                      id={`inspect-event-${event.event_id}`}
                      type="button"
                      className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                      title="Inspect Event Audit Trace"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
