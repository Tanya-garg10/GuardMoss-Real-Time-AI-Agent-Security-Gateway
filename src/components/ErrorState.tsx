import React from "react";
import { ShieldAlert, AlertOctagon, WifiOff, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  type?: "fail-closed" | "backend-down" | "moss-unavailable";
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = "fail-closed",
  title,
  message,
  onRetry
}) => {
  const isFailClosed = type === "fail-closed" || type === "moss-unavailable";

  return (
    <div className="w-full rounded-2xl border border-rose-900/40 bg-[#140c10] p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400 shrink-0">
          {isFailClosed ? <ShieldAlert className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-rose-200 font-mono tracking-wide uppercase">
            {title || (isFailClosed ? "Moss Retrieval Unavailable" : "Gateway Offline")}
          </h4>
          <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
            {message || (
              isFailClosed
                ? "GuardMoss is operating in fail-closed mode. When semantic retrieval is unavailable, high-risk agent actions are strictly prevented by default to safeguard enterprise assets."
                : "Unable to reach the GuardMoss security gateway backend server. Please verify your connection."
            )}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700/60 text-rose-200 text-xs font-mono transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Gateway Link</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
