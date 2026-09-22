import React from "react";
import { X, BookOpen, Shield, Code, Tag } from "lucide-react";
import { PolicyItem } from "../types";

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: PolicyItem[];
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onClose, policies }) => {
  if (!isOpen) return null;

  return (
    <div id="policy-knowledge-base-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Moss Security Knowledge Base
              </h3>
              <p className="text-xs text-slate-400">
                Active policies indexed in Moss for sub-20ms semantic retrieval
              </p>
            </div>
          </div>
          <button
            id="btn-close-policy-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          {policies.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {p.id}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {p.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {p.category}
                </span>
              </div>

              <p className="text-xs text-slate-300">
                {p.description}
              </p>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300">
                <span className="text-slate-400">Deterministic Rule: </span>
                {p.rule}
              </div>

              {p.keywords && p.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {p.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
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
