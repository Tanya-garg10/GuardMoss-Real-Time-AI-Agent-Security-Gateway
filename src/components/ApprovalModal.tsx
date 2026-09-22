import React, { useState } from "react";
import { X, Check, AlertTriangle, ShieldCheck, UserCheck } from "lucide-react";
import { SecurityEvent } from "../types";

interface ApprovalModalProps {
  isOpen: boolean;
  event: SecurityEvent | null;
  onClose: () => void;
  onConfirm: (eventId: string, approved: boolean, comments: string, approver: string) => Promise<void>;
  isActionLoading?: boolean;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  event,
  onClose,
  onConfirm,
  isActionLoading = false
}) => {
  const [approver, setApprover] = useState("sec_lead_tanya");
  const [comments, setComments] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(event.event_id, actionType === "approve", comments, approver);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1017] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white font-mono">
              Human-in-the-Loop Clearance
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3.5 rounded-xl bg-[#111520] border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="text-slate-400">
              Action: <strong className="text-white">{event.proposed_action?.action}</strong>
            </div>
            <div className="text-slate-400">
              Resource: <strong className="text-cyan-400">{event.proposed_action?.resource}</strong>
            </div>
            {event.proposed_action?.destination && (
              <div className="text-slate-400">
                Destination: <strong className="text-amber-300">{event.proposed_action.destination}</strong>
              </div>
            )}
            <div className="text-slate-400 pt-1 border-t border-slate-800/80">
              Reason: <span className="text-slate-300">{event.reason}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Security Officer Sign-off ID
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                placeholder="sec_officer_id"
                className="w-full bg-[#121622] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Audit Note / Clearance Comment
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Verified legitimate quarterly compliance export. Authorized for this session only."
              className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Action Choice */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              onClick={() => setActionType("reject")}
              disabled={isActionLoading}
              className="px-4 py-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800 text-rose-200 text-xs font-semibold transition-all disabled:opacity-50"
            >
              Block &amp; Log Refusal
            </button>
            <button
              type="submit"
              onClick={() => setActionType("approve")}
              disabled={isActionLoading}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              Approve &amp; Release Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
