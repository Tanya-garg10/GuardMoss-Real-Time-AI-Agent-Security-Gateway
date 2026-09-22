import React, { useState } from "react";
import { Send, ShieldAlert, Sparkles, Mic, Loader2, ArrowRight } from "lucide-react";

interface AgentActionInputProps {
  onRunSecurityCheck: (prompt: string, failClosed?: boolean) => void;
  isLoading: boolean;
  onOpenVoice?: () => void;
}

export const AgentActionInput: React.FC<AgentActionInputProps> = ({
  onRunSecurityCheck,
  isLoading,
  onOpenVoice
}) => {
  const [prompt, setPrompt] = useState("");
  const [failClosed, setFailClosed] = useState(false);

  const sampleActions = [
    {
      label: "Read the public product catalog",
      desc: "Low-risk public query",
      expected: "ALLOW"
    },
    {
      label: "Send customer.csv to an external email",
      desc: "PII data exfiltration attempt",
      expected: "REQUIRE APPROVAL"
    },
    {
      label: "Delete the production database",
      desc: "Destructive cloud infrastructure action",
      expected: "BLOCK"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onRunSecurityCheck(prompt.trim(), failClosed);
  };

  const handleSelectSample = (sample: string) => {
    setPrompt(sample);
    onRunSecurityCheck(sample, failClosed);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-[#0b0e14]/90 p-5 md:p-6 shadow-2xl relative backdrop-blur-md">
      {/* Glow effect */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>

          <input
            id="agent-action-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Ask your agent to perform an action..."
            className="w-full bg-[#10141d] text-white placeholder-slate-400 text-sm md:text-base rounded-xl border border-slate-700/80 pl-12 pr-44 py-3.5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50 transition-all font-normal shadow-inner"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {onOpenVoice && (
              <button
                id="btn-voice-gateway"
                type="button"
                onClick={onOpenVoice}
                title="Open Live Voice Gateway"
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-medium transition-colors"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice</span>
              </button>
            )}

            <button
              id="btn-run-check"
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs md:text-sm font-semibold transition-all shadow-md shadow-emerald-950/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>Run Security Check</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Fail-closed simulation toggle */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Quick Scenarios:</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={failClosed}
              onChange={(e) => setFailClosed(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/20"
            />
            <span className="flex items-center gap-1 text-[11px] font-mono">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              Simulate Moss Offline (Fail-Closed Mode)
            </span>
          </label>
        </div>

        {/* Quick Sample Action Chips */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {sampleActions.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample.label)}
              disabled={isLoading}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#121622]/60 hover:bg-[#181d2c] hover:border-slate-700 text-left text-xs transition-all"
            >
              <span className="text-slate-300 group-hover:text-white font-medium">
                {sample.label}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  sample.expected === "ALLOW"
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                    : sample.expected === "REQUIRE APPROVAL"
                    ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                    : "bg-rose-950/40 text-rose-400 border-rose-800/40"
                }`}
              >
                {sample.expected}
              </span>
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
