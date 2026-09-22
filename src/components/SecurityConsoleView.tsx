import React, { useState } from "react";
import { 
  Filter, 
  Terminal, 
  Search, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  ArrowRight,
  Database,
  Lock,
  User,
  Zap,
  Check,
  X
} from "lucide-react";
import { SecurityEvent, Decision } from "../types";
import { StatusBadge } from "./StatusBadge";
import { LatencyBadge } from "./LatencyBadge";

interface SecurityConsoleViewProps {
  events: SecurityEvent[];
  onApproveEvent: (eventId: string) => Promise<void>;
  onRejectEvent: (eventId: string) => Promise<void>;
  isActionLoading?: boolean;
}

export const SecurityConsoleView: React.FC<SecurityConsoleViewProps> = ({
  events,
  onApproveEvent,
  onRejectEvent,
  isActionLoading = false
}) => {
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    events.length > 0 ? events[0].event_id : null
  );

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (filterDecision === "ALL") return true;
    if (filterDecision === "ALLOW") return e.decision === "ALLOW";
    if (filterDecision === "APPROVAL") return e.decision === "REQUIRE_APPROVAL";
    if (filterDecision === "BLOCK") return e.decision === "BLOCK";
    return true;
  });

  const selectedEvent = events.find((e) => e.event_id === selectedEventId) || filteredEvents[0] || null;

  // Counts
  const counts = {
    ALL: events.length,
    ALLOW: events.filter((e) => e.decision === "ALLOW").length,
    APPROVAL: events.filter((e) => e.decision === "REQUIRE_APPROVAL").length,
    BLOCK: events.filter((e) => e.decision === "BLOCK").length
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Security Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, trace analysis, and human-in-the-loop review
          </p>
        </div>

        {/* Quick Decision Filter Badges */}
        <div className="flex items-center gap-1.5 bg-[#0e121a] p-1 rounded-xl border border-slate-800 self-start">
          {(["ALL", "ALLOW", "APPROVAL", "BLOCK"] as const).map((filter) => {
            const isActive = filterDecision === filter;
            const count = counts[filter];
            return (
              <button
                key={filter}
                onClick={() => setFilterDecision(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isActive
                    ? "bg-[#181e2e] text-white border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <span>{filter}</span>
                <span className="ml-1.5 text-[10px] text-slate-400 font-bold">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Console Interface (Left Filters & Feed, Right Detailed Event Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left & Center: Event Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-400">
            <span>Audit Events Timeline ({filteredEvents.length})</span>
            <span>Sorted by Latest</span>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#0c0f17] text-xs text-slate-400 font-mono">
                No events match filter &ldquo;{filterDecision}&rdquo;.
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const isSelected = selectedEvent?.event_id === ev.event_id;
                const timeStr = new Date(ev.timestamp).toTimeString().split(" ")[0];

                return (
                  <div
                    key={ev.event_id}
                    onClick={() => setSelectedEventId(ev.event_id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-cyan-500/50 bg-[#121826] shadow-lg shadow-cyan-950/20"
                        : "border-slate-800 bg-[#0c0f17] hover:border-slate-700/80 hover:bg-[#10141f]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono text-slate-400">
                        {timeStr}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={ev.decision} size="sm" />
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {ev.proposed_action?.user || "Agent"}: {ev.proposed_action?.action}
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {ev.request}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Tool: {ev.proposed_action?.tool}</span>
                      <span className="text-cyan-400">{ev.total_latency_ms.toFixed(1)} ms</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Selected Event Details & Trace (7 cols) */}
        <div className="lg:col-span-7">
          {selectedEvent ? (
            <div className="rounded-2xl border border-slate-800/80 bg-[#0c0f17] p-6 space-y-6 shadow-xl sticky top-20">
              {/* Event Inspector Header */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white font-mono">
                      Event #{selectedEvent.event_id.slice(0, 10)}
                    </span>
                    <StatusBadge status={selectedEvent.decision} size="sm" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Timestamp: {new Date(selectedEvent.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <LatencyBadge latencyMs={selectedEvent.moss_latency_ms} label="Moss Search" />
                  <LatencyBadge latencyMs={selectedEvent.total_latency_ms} label="Total Gateway" />
                </div>
              </div>

              {/* Approval Controls if Pending */}
              {(selectedEvent.status === "PENDING_APPROVAL" || selectedEvent.decision === "REQUIRE_APPROVAL") && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-amber-300 font-mono">
                      Awaiting Human-In-The-Loop Approval
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      This agent action was held by GuardMoss guardrails and requires clearance.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onApproveEvent(selectedEvent.event_id)}
                      disabled={isActionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => onRejectEvent(selectedEvent.event_id)}
                      disabled={isActionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Block</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Request & Intercepted Tool */}
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    User Request
                  </div>
                  <div className="p-3 rounded-xl bg-[#101420] border border-slate-800 text-xs text-slate-200">
                    &ldquo;{selectedEvent.request}&rdquo;
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Intercepted Tool Call
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#101420] border border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400">Agent:</span>{" "}
                      <span className="text-white font-medium">{selectedEvent.proposed_action?.user}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tool:</span>{" "}
                      <span className="text-cyan-400 font-medium">{selectedEvent.proposed_action?.tool}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Action:</span>{" "}
                      <span className="text-slate-200 font-medium">{selectedEvent.proposed_action?.action}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Resource:</span>{" "}
                      <span className="text-slate-200 font-medium">{selectedEvent.proposed_action?.resource}</span>
                    </div>
                    {selectedEvent.proposed_action?.destination && (
                      <div className="col-span-2">
                        <span className="text-slate-400">Destination:</span>{" "}
                        <span className="text-amber-300 font-medium">{selectedEvent.proposed_action.destination}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Deterministic Decision Reason */}
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Guardrail Evaluation Reason
                </div>
                <div className="p-3.5 rounded-xl bg-[#101420] border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedEvent.reason}
                </div>
              </div>

              {/* Retrieved Policies */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Retrieved Policies ({selectedEvent.retrieved_policies?.length || 0})
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400">
                    Moss Index: guardmoss-security-policies
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedEvent.retrieved_policies?.map((pol, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#0e121a] border border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{pol.title}</span>
                        <span className="text-[10px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/40">
                          Match: {Math.round(pol.relevance_score * 100)}%
                        </span>
                      </div>
                      <p className="mt-1 text-slate-400 font-mono text-[11px]">{pol.rule}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Status / Result */}
              {selectedEvent.execution_result && (
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Execution Log
                  </div>
                  <div className="p-3 rounded-xl bg-[#090b10] border border-slate-800 font-mono text-xs text-emerald-400">
                    {selectedEvent.execution_result}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-[#0c0f17] p-12 text-center text-slate-400 font-mono text-xs">
              Select an event from the timeline to inspect its security trace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
