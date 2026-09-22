import React from "react";
import { X, Shield, Terminal, Clock, CheckCircle2, AlertTriangle, XCircle, Cpu, Zap, Scale } from "lucide-react";
import { SecurityEvent } from "../types";

interface EventDetailModalProps {
  event: SecurityEvent | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div id="event-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  Security Event Audit Record
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {event.event_id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Timestamp: {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Decision Pill */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">
                Deterministic Decision
              </div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {event.decision}
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">
                Execution Status
              </div>
              <div className="text-xs font-bold text-cyan-300 mt-0.5">
                {event.status}
              </div>
            </div>
          </div>

          {/* User Request */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Original User Request
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
              "{event.request}"
            </div>
          </div>

          {/* Proposed Tool Action Details */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Proposed Tool Action
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-400">Action:</span>{" "}
                <span className="text-amber-300 font-semibold">{event.proposed_action.action}</span>
              </div>
              <div>
                <span className="text-slate-400">Tool:</span>{" "}
                <span className="text-cyan-300 font-semibold">{event.proposed_action.tool}</span>
              </div>
              <div>
                <span className="text-slate-400">Resource:</span>{" "}
                <span className="text-purple-300 font-semibold">{event.proposed_action.resource}</span>
              </div>
              <div>
                <span className="text-slate-400">Destination:</span>{" "}
                <span className="text-rose-300 font-semibold">{event.proposed_action.destination || "None (Local)"}</span>
              </div>
            </div>
          </div>

          {/* Gateway Decision Reason */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Gateway Evaluation Logic
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
              {event.reason}
            </div>
          </div>

          {/* Latency Breakdown */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Measured Timing Breakdown
            </div>
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Moss Latency</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">{event.moss_latency_ms} ms</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Guardrail Latency</div>
                <div className="text-sm font-bold text-purple-300 mt-0.5">{event.evaluation_latency_ms} ms</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Total Latency</div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">{event.total_latency_ms} ms</div>
              </div>
            </div>
          </div>

          {/* Execution Result */}
          {event.execution_result && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Execution Output / Human Note
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-900/60 font-mono text-[11px] text-emerald-300">
                {event.execution_result}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
