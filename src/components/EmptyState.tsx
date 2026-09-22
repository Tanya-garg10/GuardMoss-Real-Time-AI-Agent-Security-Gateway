import React from "react";
import { ShieldCheck, Inbox, SearchX, FileCode2 } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: "shield" | "search" | "inbox";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon = "shield"
}) => {
  const IconComp = icon === "shield" ? ShieldCheck : icon === "search" ? SearchX : Inbox;

  return (
    <div className="w-full rounded-2xl border border-slate-800/80 bg-[#0c0f17] p-8 md:p-12 text-center backdrop-blur-md">
      <div className="w-12 h-12 rounded-2xl bg-[#111522] border border-slate-800 flex items-center justify-center mx-auto mb-3 text-cyan-400 shadow-inner">
        <IconComp className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
