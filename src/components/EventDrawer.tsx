import React, { useState } from "react";
import { 
  X, 
  Terminal, 
  Search, 
  ShieldCheck, 
  Clock, 
  Check, 
  AlertTriangle, 
  FileText, 
  User, 
  Copy, 
  CheckCheck,
  Zap,
  ArrowRight
} from "lucide-react";
import { SecurityEvent } from "../types";
import { StatusBadge } from "./StatusBadge";
import { LatencyBadge } from "./LatencyBadge";

interface EventDrawerProps {
  event: SecurityEvent | null;
  onClose: () => void;
  onApprove?: (eventId: string) => void;
  onReject?: (eventId: string) => void;
  isActionLoading?: boolean;
}

export const EventDrawer: React.FC<EventDrawerProps> = ({
  event,
  onClose,
  onApprove,
  onReject,
  isActionLoading = false
}) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  if (!event) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPending = event.status === "PENDING_APPROVAL" || event.decision === "REQUIRE_APPROVAL";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-2xl h-full bg-[#0a0d14] border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between gap-4 bg-[#0d1017]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-mono flex items-center gap-2">
                Security Event
                <span className="text-xs text-slate-400 font-normal">#{event.event_id.slice(0, 8)}</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={event.decision} size="sm" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Request */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Original User Request
            </div>
            <div className="p-3.5 rounded-xl bg-[#111520] border border-slate-800/80 text-sm text-slate-200">
              &ldquo;{event.request}&rdquo;
            </div>
          </div>

          {/* Proposed Tool Action */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Intercepted Tool Invocation
            </div>
            <div className="p-4 rounded-xl bg-[#111520] border border-slate-800/80 space-y-2.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Agent:</span>{" "}
                  <span className="text-white font-semibold">{event.proposed_action?.user || "Agent"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Tool:</span>{" "}
                  <span className="text-cyan-400 font-semibold">{event.proposed_action?.tool}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Action:</span>{" "}
                  <span className="text-slate-200">{event.proposed_action?.action}</span>
                </div>
                <div>
                  <span className="text-slate-400">Resource:</span>{" "}
                  <span className="text-slate-200">{event.proposed_action?.resource}</span>
                </div>
              </div>
              {event.proposed_action?.destination && (
                <div>
                  <span className="text-slate-400">Destination:</span>{" "}
                  <span className="text-amber-300">{event.proposed_action.destination}</span>
                </div>
              )}
            </div>
          </div>

          {/* Decision & Guardrail Reason */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Deterministic Evaluation
            </div>
            <div className="p-4 rounded-xl bg-[#111520] border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Final Gate:</span>
                <StatusBadge status={event.decision} size="sm" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {event.reason}
              </p>
              {event.execution_result && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
                  <span className="text-slate-400">Execution Result:</span>{" "}
                  <span className="text-emerald-400">{event.execution_result}</span>
                </div>
              )}
            </div>
          </div>

          {/* Moss Retrieved Policies */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Retrieved Policies ({event.retrieved_policies?.length || 0})
              </div>
              <LatencyBadge latencyMs={event.moss_latency_ms} label="Moss Search" />
            </div>

            <div className="space-y-2">
              {event.retrieved_policies?.map((pol, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#0e121a] border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200">{pol.title}</span>
                    <span className="font-mono text-[10px] text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/40">
                      Relevance {Math.round(pol.relevance_score * 100)}%
                    </span>
                  </div>
                  <p className="mt-1 text-slate-400 font-mono text-[11px]">{pol.rule}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Latency Breakdown */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Telemetry &amp; Latencies
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#0e121a] border border-slate-800">
                <div className="text-slate-400 text-[10px]">Moss Retrieval</div>
                <div className="text-cyan-400 font-bold mt-1">{event.moss_latency_ms.toFixed(1)} ms</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0e121a] border border-slate-800">
                <div className="text-slate-400 text-[10px]">Guardrail Check</div>
                <div className="text-slate-200 font-bold mt-1">{event.evaluation_latency_ms.toFixed(1)} ms</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0e121a] border border-slate-800">
                <div className="text-slate-400 text-[10px]">Total Gateway</div>
                <div className="text-emerald-400 font-bold mt-1">{event.total_latency_ms.toFixed(1)} ms</div>
              </div>
            </div>
          </div>

          {/* JSON Payload Viewer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <button
                onClick={() => setShowJson(!showJson)}
                className="text-[11px] font-mono text-cyan-400 hover:underline"
              >
                {showJson ? "Hide Raw Audit JSON" : "View Raw Audit JSON"}
              </button>
              {showJson && (
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white"
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>
            {showJson && (
              <pre className="p-3 rounded-lg bg-[#080a0f] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56">
                {JSON.stringify(event, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer Actions if Pending Approval */}
        {isPending && onApprove && onReject && (
          <div className="p-4 border-t border-slate-800/80 bg-[#0d1017] flex items-center justify-end gap-3">
            <button
              onClick={() => onReject(event.event_id)}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold transition-all disabled:opacity-50"
            >
              Reject Action
            </button>
            <button
              onClick={() => onApprove(event.event_id)}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-950/30 disabled:opacity-50"
            >
              Approve &amp; Execute
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
