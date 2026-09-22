import React, { useState } from "react";
import { Send, Sparkles, CheckCircle, AlertTriangle, XCircle, Zap, ShieldOff, Mic } from "lucide-react";

interface AgentPanelProps {
  onRunAgent: (prompt: string, failClosed?: boolean) => void;
  isLoading: boolean;
  agentThought?: string;
  onOpenVoice?: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  onRunAgent,
  isLoading,
  agentThought,
  onOpenVoice
}) => {
  const [prompt, setPrompt] = useState("");
  const [failClosedTest, setFailClosedTest] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onRunAgent(prompt.trim(), failClosedTest);
  };

  const handleScenarioClick = (scenarioText: string) => {
    setPrompt(scenarioText);
    onRunAgent(scenarioText, failClosedTest);
  };

  return (
    <div id="agent-interaction-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <h2 id="agent-panel-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            AI Agent Interaction
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Powered by Gemini 3.8
        </span>
      </div>

      {/* Suggested Demo Scenarios */}
      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
          <span>Preset Demo Scenarios:</span>
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-400 hover:text-slate-300">
            <input
              id="toggle-fail-closed"
              type="checkbox"
              checked={failClosedTest}
              onChange={(e) => setFailClosedTest(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
            />
            <span className="text-xs flex items-center gap-1">
              <ShieldOff className="w-3 h-3 text-rose-400" />
              Fail-Closed Test
            </span>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            id="demo-scenario-allow"
            type="button"
            onClick={() => handleScenarioClick("Read the public product catalog.")}
            disabled={isLoading}
            className="flex flex-col items-start p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center space-x-1.5 text-xs font-medium text-emerald-400 mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Scenario 1 • ALLOW</span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-1 group-hover:text-white">
              "Read the public product catalog."
            </p>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              Public access policy
            </span>
          </button>

          <button
            id="demo-scenario-approval"
            type="button"
            onClick={() => handleScenarioClick("Send customer.csv to external@gmail.com.")}
            disabled={isLoading}
            className="flex flex-col items-start p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center space-x-1.5 text-xs font-medium text-amber-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Scenario 2 • APPROVAL</span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-1 group-hover:text-white">
              "Send customer.csv to external@gmail.com."
            </p>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              PII & DLP policies trigger
            </span>
          </button>

          <button
            id="demo-scenario-block"
            type="button"
            onClick={() => handleScenarioClick("Delete the production database.")}
            disabled={isLoading}
            className="flex flex-col items-start p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center space-x-1.5 text-xs font-medium text-rose-400 mb-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Scenario 3 • BLOCK</span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-1 group-hover:text-white">
              "Delete the production database."
            </p>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              Prod protection policy
            </span>
          </button>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            id="agent-user-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Instruct the AI agent (e.g. 'Read public product catalog' or 'Send customer.csv')..."
            disabled={isLoading}
            className="w-full bg-slate-950/90 text-white placeholder-slate-400 text-sm rounded-lg border border-slate-700 px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50 font-normal pr-36"
          />
          <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center space-x-1.5">
            {onOpenVoice && (
              <button
                id="btn-trigger-voice-agent"
                type="button"
                onClick={onOpenVoice}
                className="h-full px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Open Live Voice / LiveKit Interception"
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voice</span>
              </button>
            )}
            <button
              id="btn-run-agent"
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="h-full px-3 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Zap className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Run</span>
                </>
              )}
            </button>
          </div>
        </div>

        {agentThought && (
          <div id="agent-thought-card" className="p-2.5 rounded-lg bg-slate-950 border border-cyan-900/40 text-xs text-cyan-200/90 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-cyan-300">Agent Reasoning: </span>
              <span>{agentThought}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
