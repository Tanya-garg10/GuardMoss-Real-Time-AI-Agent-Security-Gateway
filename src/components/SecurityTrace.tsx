import React from "react";
import { 
  MessageSquare, 
  Bot, 
  Terminal, 
  Cpu, 
  Scale, 
  ShieldCheck, 
  PlayCircle, 
  ArrowDown, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { Decision, SecurityCheckResponse } from "../types";

interface SecurityTraceProps {
  userPrompt: string;
  evaluation: SecurityCheckResponse | null;
  isLoading: boolean;
}

export const SecurityTrace: React.FC<SecurityTraceProps> = ({
  userPrompt,
  evaluation,
  isLoading
}) => {
  const decision = evaluation?.decision;
  const mossMs = evaluation?.moss_latency_ms || 0;
  const evalMs = evaluation?.evaluation_latency_ms || 0;

  const steps = [
    {
      id: "step-1-request",
      num: "1",
      title: "User Request",
      sub: userPrompt ? `"${userPrompt.slice(0, 32)}${userPrompt.length > 32 ? "..." : ""}"` : "Input Instruction",
      icon: MessageSquare,
      color: "border-slate-700 text-slate-300 bg-slate-950",
      active: true,
      time: null
    },
    {
      id: "step-2-agent",
      num: "2",
      title: "AI Agent",
      sub: "Gemini 3.8",
      icon: Bot,
      color: "border-cyan-800/80 text-cyan-400 bg-slate-950",
      active: true,
      time: null
    },
    {
      id: "step-3-action",
      num: "3",
      title: "Proposed Action",
      sub: "Structured Tool Call",
      icon: Terminal,
      color: "border-amber-800/80 text-amber-400 bg-slate-950",
      active: Boolean(evaluation || isLoading),
      time: null
    },
    {
      id: "step-4-moss",
      num: "4",
      title: "Moss Retrieval",
      sub: "Semantic Policy Search",
      icon: Cpu,
      color: "border-cyan-600 text-cyan-300 bg-slate-950",
      active: Boolean(evaluation || isLoading),
      time: evaluation ? `${mossMs}ms` : (isLoading ? "..." : null)
    },
    {
      id: "step-5-guardrails",
      num: "5",
      title: "Policy Evaluation",
      sub: "Deterministic Predicates",
      icon: Scale,
      color: "border-purple-800/80 text-purple-400 bg-slate-950",
      active: Boolean(evaluation),
      time: evaluation ? `${evalMs}ms` : null
    },
    {
      id: "step-6-decision",
      num: "6",
      title: "Security Decision",
      sub: decision || "Evaluation",
      icon: decision === "ALLOW" ? CheckCircle2 : decision === "REQUIRE_APPROVAL" ? AlertTriangle : decision === "BLOCK" ? XCircle : ShieldCheck,
      color: decision === "ALLOW" 
        ? "border-emerald-500 text-emerald-400 bg-emerald-950/40" 
        : decision === "REQUIRE_APPROVAL" 
        ? "border-amber-500 text-amber-400 bg-amber-950/40" 
        : decision === "BLOCK" 
        ? "border-rose-500 text-rose-400 bg-rose-950/40" 
        : "border-slate-800 text-slate-400 bg-slate-950",
      active: Boolean(evaluation),
      time: null
    },
    {
      id: "step-7-execution",
      num: "7",
      title: "Tool Execution",
      sub: decision === "ALLOW" ? "Executed" : decision === "REQUIRE_APPROVAL" ? "Human Approval" : decision === "BLOCK" ? "Terminated" : "Pending",
      icon: PlayCircle,
      color: decision === "ALLOW" 
        ? "border-emerald-500 text-emerald-400 bg-slate-950" 
        : decision === "REQUIRE_APPROVAL" 
        ? "border-amber-500 text-amber-400 bg-slate-950" 
        : decision === "BLOCK" 
        ? "border-rose-500 text-rose-400 bg-slate-950 opacity-60" 
        : "border-slate-800 text-slate-500 bg-slate-950 opacity-40",
      active: Boolean(evaluation),
      time: null
    }
  ];

  return (
    <div id="security-trace-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <h3 id="security-trace-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Real-Time Security Trace
          </h3>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <span>Total Gateway Overhead:</span>
          <span className="text-emerald-400 font-bold">
            {evaluation ? `${evaluation.total_latency_ms} ms` : "0.0 ms"}
          </span>
        </div>
      </div>

      {/* Horizontal Step Flow for Desktop & Wrap for Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              id={step.id}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${step.color} ${step.active ? "opacity-100 ring-1 ring-white/10" : "opacity-40"}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    0{step.num}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {step.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-sans">
                  {step.sub}
                </div>
              </div>

              {step.time && (
                <div className="mt-2 pt-1 border-t border-slate-800/80 text-[10px] font-mono text-cyan-300 font-semibold flex items-center justify-between">
                  <span>latency:</span>
                  <span>{step.time}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
