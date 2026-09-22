import React from "react";
import { 
  Shield, 
  Layers, 
  Terminal, 
  FileText, 
  Activity, 
  Radio, 
  Settings, 
  User, 
  RotateCcw,
  Sparkles,
  Zap,
  Mic
} from "lucide-react";
import { NavTab, GatewayStats } from "../types";

interface TopNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  stats?: GatewayStats | null;
  onResetDemo?: () => void;
  onOpenVoice?: () => void;
  isResetting?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onTabChange,
  stats,
  onResetDemo,
  onOpenVoice,
  isResetting = false
}) => {
  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "console", label: "Security Console", icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: "policies", label: "Policies", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "activity", label: "Activity", icon: <Activity className="w-3.5 h-3.5" /> }
  ];

  const avgMoss = stats?.avg_moss_latency_ms || 8.4;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080a0f]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: GuardMoss Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-emerald-500/20 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/20">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white font-mono">
                GuardMoss
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 tracking-wider">
                AI Security Gateway
              </span>
            </div>
          </div>
        </div>

        {/* Center: Minimal Tab Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0e121a] p-1 rounded-xl border border-slate-800">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#171d2b] text-white font-semibold border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Status Indicators, Voice, Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Moss Connection Pill */}
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono"
            title={`Connected to Moss Semantic Index. Average search latency: ${avgMoss}ms`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 text-[11px] font-medium hidden sm:inline">
              Moss Connected
            </span>
            <span className="text-emerald-300/80 text-[10px] font-bold">
              {avgMoss.toFixed(1)}ms
            </span>
          </div>

          {/* Voice trigger */}
          {onOpenVoice && (
            <button
              onClick={onOpenVoice}
              title="Open LiveKit Real-Time Voice Gateway"
              className="p-2 rounded-lg bg-[#111622] hover:bg-[#181e2e] border border-slate-800 text-emerald-400 transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}

          {/* Reset Demo Events button */}
          {onResetDemo && (
            <button
              onClick={onResetDemo}
              disabled={isResetting}
              title="Reset Sample Security Events"
              className="p-2 rounded-lg bg-[#111622] hover:bg-[#181e2e] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          )}

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 bg-[#0a0d14] px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded text-[10px] font-medium ${
                isActive ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
