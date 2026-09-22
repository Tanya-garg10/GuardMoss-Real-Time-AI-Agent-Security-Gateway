import React from "react";
import { 
  User, 
  Bot, 
  Terminal, 
  Search, 
  ShieldCheck, 
  Scale, 
  Zap, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  XCircle,
  Play
} from "lucide-react";
import { SecurityCheckResponse, ProposedToolAction, PipelineStage } from "../types";

interface SecurityPipelineProps {
  currentStage: PipelineStage;
  evaluation: SecurityCheckResponse | null;
  proposedAction: ProposedToolAction | null;
  userRequest?: string;
}

export const SecurityPipeline: React.FC<SecurityPipelineProps> = ({
  currentStage,
  evaluation,
  proposedAction,
  userRequest
}) => {
  const isRunning = currentStage !== "idle" && currentStage !== "execution";

  // Stages definition
  const stages: Array<{
    id: PipelineStage;
    name: string;
    icon: React.ReactNode;
    getDetail: () => {
      headline: string;
      subline: string;
      meta?: string;
      latency?: string;
    };
  }> = [
    {
      id: "request",
      name: "User Request",
      icon: <User className="w-3.5 h-3.5" />,
      getDetail: () => ({
        headline: userRequest ? `"${userRequest.slice(0, 32)}${userRequest.length > 32 ? '...' : ''}"` : "Natural language intent",
        subline: "Submitted to Agent"
      })
    },
    {
      id: "agent",
      name: "AI Agent",
      icon: <Bot className="w-3.5 h-3.5" />,
      getDetail: () => ({
        headline: proposedAction?.user || "Research Agent",
        subline: "Formulates tool invocation"
      })
    },
    {
      id: "action",
      name: "Proposed Action",
      icon: <Terminal className="w-3.5 h-3.5" />,
      getDetail: () => ({
        headline: proposedAction ? proposedAction.action : "Action intercepted",
        subline: proposedAction ? `${proposedAction.tool} → ${proposedAction.resource}` : "Gateway boundary intercept"
      })
    },
    {
      id: "moss",
      name: "Moss Retrieval",
      icon: <Search className="w-3.5 h-3.5" />,
      getDetail: () => ({
        headline: evaluation ? `${evaluation.retrieved_policies.length} policies found` : "Semantic policy lookup",
        subline: "guardmoss-security-policies",
        latency: evaluation ? `${evaluation.moss_latency_ms.toFixed(1)} ms` : undefined
      })
    },
    {
      id: "evaluation",
      name: "Policy Evaluation",
      icon: <Scale className="w-3.5 h-3.5" />,
      getDetail: () => ({
        headline: evaluation ? (evaluation.permission_result.is_permitted ? "Rule match passed" : "Boundary triggered") : "Deterministic guardrails",
        subline: "Zero-LLM security check",
        latency: evaluation ? `${evaluation.evaluation_latency_ms.toFixed(1)} ms` : undefined
      })
    },
    {
      id: "decision",
      name: "Security Decision",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      getDetail: () => ({
        headline: evaluation ? evaluation.decision : "Gate determination",
        subline: evaluation ? (evaluation.decision === "ALLOW" ? "Release to worker" : evaluation.decision === "REQUIRE_APPROVAL" ? "Human review required" : "Halted & logged") : "ALLOW / APPROVAL / BLOCK"
      })
    },
    {
      id: "execution",
      name: "Tool Execution",
      icon: <Play className="w-3.5 h-3.5" />,
      getDetail: () => ({
        headline: evaluation?.decision === "ALLOW" ? "Executed" : evaluation?.decision === "REQUIRE_APPROVAL" ? "Held in queue" : evaluation?.decision === "BLOCK" ? "Blocked" : "Physical execution",
        subline: evaluation?.decision === "ALLOW" ? "Dispatched" : evaluation?.decision === "REQUIRE_APPROVAL" ? "Awaiting human signature" : evaluation?.decision === "BLOCK" ? "Execution prevented" : "Target endpoint"
      })
    }
  ];

  const stageOrder: PipelineStage[] = [
    "request",
    "agent",
    "action",
    "moss",
    "evaluation",
    "decision",
    "execution"
  ];

  const currentIdx = stageOrder.indexOf(currentStage);

  return (
    <div className="w-full rounded-2xl border border-slate-800/80 bg-[#0c0f17] p-5 md:p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/60">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase font-mono">
            Security Evaluation Pipeline
          </h3>
          <p className="text-xs text-slate-400">
            Real-time interception trace from agent intent to deterministic gate
          </p>
        </div>
        {evaluation && (
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>Total Latency:</span>
            <span className="text-cyan-400 font-semibold">{evaluation.total_latency_ms.toFixed(1)} ms</span>
          </div>
        )}
      </div>

      {/* Horizontal Pipeline Trace on Desktop / Scrollable on Mobile */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[780px] grid grid-cols-7 gap-2.5 relative">
          {stages.map((stage, idx) => {
            const detail = stage.getDetail();
            const isCompleted = evaluation !== null || (currentIdx > idx && currentIdx !== -1);
            const isActive = currentStage === stage.id;
            const isPending = !isCompleted && !isActive;

            let cardBorder = "border-slate-800 bg-[#10141d]/70 text-slate-400";
            let iconBg = "bg-slate-800 text-slate-400";

            if (isActive) {
              cardBorder = "border-cyan-400 bg-cyan-950/20 text-white shadow-lg shadow-cyan-950/30";
              iconBg = "bg-cyan-500/20 text-cyan-400 animate-pulse";
            } else if (isCompleted) {
              if (stage.id === "decision") {
                if (evaluation?.decision === "ALLOW") {
                  cardBorder = "border-emerald-500/40 bg-emerald-950/20 text-slate-200";
                  iconBg = "bg-emerald-500/20 text-emerald-400";
                } else if (evaluation?.decision === "REQUIRE_APPROVAL") {
                  cardBorder = "border-amber-500/40 bg-amber-950/20 text-slate-200";
                  iconBg = "bg-amber-500/20 text-amber-400";
                } else {
                  cardBorder = "border-rose-500/40 bg-rose-950/20 text-slate-200";
                  iconBg = "bg-rose-500/20 text-rose-400";
                }
              } else {
                cardBorder = "border-slate-700/60 bg-[#121622] text-slate-200";
                iconBg = "bg-slate-800 text-slate-300";
              }
            }

            return (
              <div key={stage.id} className="relative flex flex-col">
                <div
                  className={`rounded-xl border p-3 flex flex-col justify-between h-full min-h-[118px] transition-all duration-200 ${cardBorder}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className={`p-1.5 rounded-md ${iconBg}`}>
                        {stage.icon}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        0{idx + 1}
                      </span>
                    </div>

                    <div className="text-xs font-semibold tracking-tight text-slate-200">
                      {stage.name}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60">
                    <div className="text-[11px] font-medium text-slate-300 truncate" title={detail.headline}>
                      {detail.headline}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5" title={detail.subline}>
                      {detail.subline}
                    </div>
                    {detail.latency && (
                      <div className="mt-1 text-[10px] font-mono text-cyan-400 font-medium">
                        {detail.latency}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector Arrow for all but last item */}
                {idx < stages.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-6 z-10 text-slate-600">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
