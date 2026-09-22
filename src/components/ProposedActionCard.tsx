import React from "react";
import { Wrench, Terminal, Database, Send, UserCheck, HelpCircle } from "lucide-react";
import { ProposedToolAction } from "../types";

interface ProposedActionCardProps {
  action: ProposedToolAction | null;
  isLoading: boolean;
}

export const ProposedActionCard: React.FC<ProposedActionCardProps> = ({
  action,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div id="proposed-action-card-loading" className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-8 bg-slate-800/60 rounded"></div>
          <div className="h-8 bg-slate-800/60 rounded"></div>
        </div>
      </div>
    );
  }

  if (!action) {
    return (
      <div id="proposed-action-card-empty" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-400 text-xs">
        <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
        <p>No tool action intercepted yet. Run an agent prompt above.</p>
      </div>
    );
  }

  return (
    <div id="proposed-action-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h3 id="proposed-action-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Proposed Tool Action
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Intercepted by Gateway
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
        {/* Action */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1 font-sans">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Action Name</span>
          </div>
          <div id="action-field-value" className="text-amber-300 font-semibold truncate">
            {action.action}
          </div>
        </div>

        {/* Tool */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1 font-sans">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Tool</span>
          </div>
          <div id="tool-field-value" className="text-cyan-300 font-semibold truncate">
            {action.tool}
          </div>
        </div>

        {/* Resource */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1 font-sans">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Target Resource</span>
          </div>
          <div id="resource-field-value" className="text-purple-300 font-semibold truncate">
            {action.resource}
          </div>
        </div>

        {/* Destination */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1 font-sans">
            <Send className="w-3.5 h-3.5 text-rose-400" />
            <span>Destination</span>
          </div>
          <div id="destination-field-value" className="text-slate-300 font-semibold truncate">
            {action.destination ? (
              <span className="text-rose-300 font-bold">{action.destination}</span>
            ) : (
              <span className="text-slate-400 italic">None (Local / Internal)</span>
            )}
          </div>
        </div>
      </div>

      {/* User Context Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Caller Identity:</span>
          <span className="font-mono text-slate-300 font-medium">{action.user}</span>
        </div>
        {action.context && (
          <span className="truncate max-w-[200px] text-slate-400 font-mono">
            {action.context}
          </span>
        )}
      </div>
    </div>
  );
};
