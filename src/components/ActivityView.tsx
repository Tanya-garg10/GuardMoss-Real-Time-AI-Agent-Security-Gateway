import React, { useState } from "react";
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck2,
  Lock,
  Layers,
  Sparkles,
  X
} from "lucide-react";
import { SecurityEvent, Decision } from "../types";
import { StatusBadge } from "./StatusBadge";
import { LatencyBadge } from "./LatencyBadge";

interface ActivityViewProps {
  events: SecurityEvent[];
  onSelectEvent: (event: SecurityEvent) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  events,
  onSelectEvent
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<"filtered" | "all">("filtered");
  const [complianceFramework, setComplianceFramework] = useState<string>("SOC2");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Filtering
  const filteredEvents = events.filter((ev) => {
    // Search filter
    const matchesSearch =
      ev.request.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.proposed_action?.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.proposed_action?.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.proposed_action?.user || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Decision filter
    const matchesDecision =
      filterDecision === "ALL" || ev.decision === filterDecision;

    // Risk filter
    const sensitivity = ev.retrieved_policies[0]?.sensitivity_level || "INTERNAL";
    const matchesRisk =
      filterRisk === "ALL" || sensitivity === filterRisk;

    return matchesSearch && matchesDecision && matchesRisk;
  });

  const formatFullDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const escapeCsv = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleExportCsv = (scope: "filtered" | "all" = exportScope) => {
    setIsExporting(true);
    const targetEvents = scope === "filtered" ? filteredEvents : events;

    // Compliance Reporting CSV Headers (SOC2 / ISO 27001 / FedRAMP compliant)
    const headers = [
      "Event_ID",
      "Timestamp_UTC",
      "ISO_8601",
      "Compliance_Framework",
      "Agent_Identity",
      "Agent_Role",
      "Intercepted_Tool",
      "Proposed_Action",
      "Target_Resource",
      "Data_Destination",
      "Classification_Risk",
      "Deterministic_Gate_Decision",
      "Execution_Status",
      "Approved_By",
      "Moss_Search_Latency_MS",
      "Guardrail_Evaluation_Latency_MS",
      "Total_Gateway_Latency_MS",
      "Matched_Policies_Summary",
      "Guardrail_Decision_Reason",
      "User_Original_Request",
      "Execution_Result_Log"
    ];

    const rows = targetEvents.map((e) => {
      const sensitivity = e.retrieved_policies[0]?.sensitivity_level || "INTERNAL";
      const policiesSummary = e.retrieved_policies?.map(p => `[${p.id}] ${p.title} (${Math.round(p.relevance_score * 100)}%)`).join("; ") || "None";
      const dateObj = new Date(e.timestamp);

      return [
        escapeCsv(e.event_id),
        escapeCsv(dateObj.toUTCString()),
        escapeCsv(dateObj.toISOString()),
        escapeCsv(complianceFramework),
        escapeCsv(e.proposed_action?.user || "Agent"),
        escapeCsv(e.permission_result?.role || "Automated Agent"),
        escapeCsv(e.proposed_action?.tool || ""),
        escapeCsv(e.proposed_action?.action || ""),
        escapeCsv(e.proposed_action?.resource || ""),
        escapeCsv(e.proposed_action?.destination || "N/A (Internal)"),
        escapeCsv(sensitivity),
        escapeCsv(e.decision),
        escapeCsv(e.status),
        escapeCsv(e.approved_by || "System/Deterministic"),
        escapeCsv(e.moss_latency_ms.toFixed(2)),
        escapeCsv(e.evaluation_latency_ms.toFixed(2)),
        escapeCsv(e.total_latency_ms.toFixed(2)),
        escapeCsv(policiesSummary),
        escapeCsv(e.reason),
        escapeCsv(e.request),
        escapeCsv(e.execution_result || "N/A")
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `guardmoss_${complianceFramework.toLowerCase()}_compliance_audit_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setIsExportModalOpen(false);
    setExportSuccessMessage(`Exported ${targetEvents.length} audit records for ${complianceFramework} compliance.`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-400" />
            Security Audit Activity
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable, searchable ledger of all agent tool interceptions and decisions
          </p>
        </div>

        {/* Action button triggers the compliance export modal */}
        <div className="flex items-center gap-2 self-start">
          <button
            id="btn-open-export-modal"
            onClick={() => setIsExportModalOpen(true)}
            disabled={events.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-semibold shadow-md shadow-emerald-950/30 transition-all disabled:opacity-50"
            title="Export full CSV event log for SOC2 / ISO 27001 compliance audit"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Compliance CSV</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {exportSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between gap-3 text-xs text-emerald-300 font-mono animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button onClick={() => setExportSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0c0f17] p-3.5 rounded-2xl border border-slate-800/80">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="activity-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, resource, or request..."
            className="w-full bg-[#111520] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Decision Filter */}
          <select
            id="activity-filter-decision"
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">Decision: All</option>
            <option value="ALLOW">Decision: ALLOW</option>
            <option value="REQUIRE_APPROVAL">Decision: APPROVAL</option>
            <option value="BLOCK">Decision: BLOCK</option>
          </select>

          {/* Risk Filter */}
          <select
            id="activity-filter-risk"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">Risk: All</option>
            <option value="CRITICAL">Risk: CRITICAL</option>
            <option value="SENSITIVE">Risk: SENSITIVE</option>
            <option value="INTERNAL">Risk: INTERNAL</option>
            <option value="PUBLIC">Risk: PUBLIC</option>
          </select>

          <span className="text-xs font-mono text-slate-400 ml-2">
            Showing {filteredEvents.length} events
          </span>
        </div>
      </div>

      {/* Searchable Security Event Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0c0f17] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0e121a] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Moss Latency</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    No security events found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const sensitivity = ev.retrieved_policies[0]?.sensitivity_level || "INTERNAL";
                  const riskBadge =
                    sensitivity === "CRITICAL"
                      ? "text-rose-400 bg-rose-950/40 border-rose-800/50"
                      : sensitivity === "SENSITIVE"
                      ? "text-amber-400 bg-amber-950/40 border-amber-800/50"
                      : "text-emerald-400 bg-emerald-950/40 border-emerald-800/50";

                  return (
                    <tr
                      key={ev.event_id}
                      onClick={() => onSelectEvent(ev)}
                      className="hover:bg-[#121622] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {formatFullDate(ev.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200 whitespace-nowrap">
                        {ev.proposed_action?.user || "Agent"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-300 font-medium whitespace-nowrap">
                        {ev.proposed_action?.action}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 max-w-xs truncate" title={ev.proposed_action?.resource}>
                        {ev.proposed_action?.resource}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={ev.decision} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <LatencyBadge latencyMs={ev.moss_latency_ms} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${riskBadge}`}>
                          {sensitivity}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors inline-block" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance CSV Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1017] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white font-mono">
                    Compliance Event Log Export
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generate an audit-grade CSV export for security compliance reporting
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs font-mono">
              {/* Compliance Standard Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 uppercase text-[11px] tracking-wider">
                  Compliance Framework Standard
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "SOC2", label: "SOC 2 Type II" },
                    { id: "ISO27001", label: "ISO 27001" },
                    { id: "HIPAA", label: "HIPAA / FedRAMP" }
                  ].map((fw) => (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => setComplianceFramework(fw.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        complianceFramework === fw.id
                          ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 font-bold"
                          : "border-slate-800 bg-[#121622] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {fw.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 uppercase text-[11px] tracking-wider">
                  Export Dataset Scope
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-[#121622] cursor-pointer hover:border-slate-700">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "filtered"}
                      onChange={() => setExportScope("filtered")}
                      className="text-emerald-500 focus:ring-emerald-500/20"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-slate-200 font-medium">Currently Filtered View</span>
                      <span className="text-emerald-400 font-bold">{filteredEvents.length} records</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-[#121622] cursor-pointer hover:border-slate-700">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "all"}
                      onChange={() => setExportScope("all")}
                      className="text-emerald-500 focus:ring-emerald-500/20"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-slate-200 font-medium">Full Security Audit Ledger</span>
                      <span className="text-cyan-400 font-bold">{events.length} records</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Included Telemetry Fields Note */}
              <div className="p-3 rounded-xl bg-[#090b10] border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-semibold flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Included Audit Fields:
                </span>
                Event ID, UTC Timestamp, Agent ID, Role, Tool, Resource, Decision, Execution Status, Human Sign-off, Moss Latency, Total Latency, Matched Policies &amp; Deterministic Reason.
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-export-csv"
                  onClick={() => handleExportCsv(exportScope)}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compliance CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
