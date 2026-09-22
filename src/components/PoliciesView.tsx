import React, { useState } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Clock, 
  SlidersHorizontal,
  X,
  Code
} from "lucide-react";
import { PolicyItem } from "../types";

interface PoliciesViewProps {
  initialPolicies: PolicyItem[];
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({ initialPolicies }) => {
  // Enrich base policies with extended attributes
  const [policies, setPolicies] = useState<PolicyItem[]>([
    {
      id: "pol-1",
      title: "Customer PII Protection",
      description: "Requires explicit security officer approval before exporting customer data, emails, or personal identifiers.",
      rule: "IF action IN ['export', 'send', 'dump'] AND resource CONTAINS 'customer' THEN REQUIRE_APPROVAL",
      category: "Data Privacy & Compliance",
      sensitivity_level: "SENSITIVE",
      relevance_score: 0.95,
      status: "ACTIVE",
      priority: "HIGH",
      affected_tools: ["email.send", "file.export", "customer_db.query"],
      last_updated: "2 hours ago"
    },
    {
      id: "pol-2",
      title: "Production Destructive Actions",
      description: "Blocks destructive actions (drop, delete, truncate) targeting production database clusters and infra.",
      rule: "IF action IN ['delete', 'drop', 'truncate', 'terminate'] AND resource CONTAINS 'production' THEN BLOCK",
      category: "Infrastructure Security",
      sensitivity_level: "CRITICAL",
      relevance_score: 0.98,
      status: "ACTIVE",
      priority: "CRITICAL",
      affected_tools: ["database.delete", "k8s.delete_namespace", "aws.terminate_instance"],
      last_updated: "Yesterday"
    },
    {
      id: "pol-3",
      title: "External Data Sharing",
      description: "Prevents dispatching internal files and intellectual property to unauthorized external webhooks or domains.",
      rule: "IF destination NOT ENDSWITH '@internal.corp' AND data_classification != 'PUBLIC' THEN REQUIRE_APPROVAL",
      category: "Egress & Boundary",
      sensitivity_level: "SENSITIVE",
      relevance_score: 0.92,
      status: "ACTIVE",
      priority: "HIGH",
      affected_tools: ["webhook.post", "slack.share", "sftp.upload"],
      last_updated: "3 days ago"
    },
    {
      id: "pol-4",
      title: "Public Data Access",
      description: "Allows read-only access to published public assets such as product catalogs, documentation, and pricing tables.",
      rule: "IF action IN ['read', 'get', 'list', 'search'] AND resource IN ['public_catalog', 'api_docs', 'kb'] THEN ALLOW",
      category: "Access Control",
      sensitivity_level: "PUBLIC",
      relevance_score: 0.88,
      status: "ACTIVE",
      priority: "LOW",
      affected_tools: ["catalog.read", "docs.search", "products.list"],
      last_updated: "1 week ago"
    },
    {
      id: "pol-5",
      title: "Unknown Context Handling",
      description: "Ensures fail-closed security when tool requests lack cryptographic signatures or clear classification.",
      rule: "IF context == 'UNKNOWN' OR semantic_confidence < 0.65 THEN REQUIRE_APPROVAL",
      category: "Anomaly Detection",
      sensitivity_level: "INTERNAL",
      relevance_score: 0.85,
      status: "ACTIVE",
      priority: "MEDIUM",
      affected_tools: ["agent.generic_invoke", "eval.custom_code"],
      last_updated: "2 weeks ago"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New policy state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRule, setNewRule] = useState("");
  const [newPriority, setNewPriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [newCategory, setNewCategory] = useState("Access Control");

  const filtered = policies.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rule.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === "ALL" || p.category.includes(filterCategory);
    return matchesSearch && matchesCat;
  });

  const togglePolicyStatus = (id: string) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
          : p
      )
    );
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPolicy: PolicyItem = {
      id: `pol-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      description: newDesc.trim() || "Custom guardrail policy",
      rule: newRule.trim() || "IF tool == 'custom' THEN REQUIRE_APPROVAL",
      category: newCategory,
      sensitivity_level: newPriority === "CRITICAL" ? "CRITICAL" : newPriority === "HIGH" ? "SENSITIVE" : "INTERNAL",
      relevance_score: 0.9,
      status: "ACTIVE",
      priority: newPriority,
      affected_tools: ["custom.tool"],
      last_updated: "Just now"
    };

    setPolicies([newPolicy, ...policies]);
    setNewTitle("");
    setNewDesc("");
    setNewRule("");
    setIsCreateModalOpen(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-400" />
            Security Policies
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise guardrail rules indexed and matched via Moss semantic search
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create Policy</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies or rules..."
            className="w-full bg-[#0e121a] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 self-end sm:self-auto">
          <span>Active Rules: <strong className="text-white">{policies.filter(p => p.status === "ACTIVE").length}</strong></span>
          <span>•</span>
          <span>Index: <strong className="text-cyan-400">guardmoss-security-policies</strong></span>
        </div>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((policy) => {
          const isActive = policy.status === "ACTIVE";
          const priorityBadge =
            policy.priority === "CRITICAL"
              ? "bg-rose-950/40 text-rose-400 border-rose-800/50"
              : policy.priority === "HIGH"
              ? "bg-amber-950/40 text-amber-400 border-amber-800/50"
              : "bg-emerald-950/40 text-emerald-400 border-emerald-800/50";

          return (
            <div
              key={policy.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isActive
                  ? "border-slate-800 bg-[#0c0f17] hover:border-slate-700/80"
                  : "border-slate-900 bg-[#080a0f] opacity-60"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                      {policy.category}
                    </span>
                    <h3 className="text-base font-semibold text-white mt-0.5">
                      {policy.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${priorityBadge}`}>
                      {policy.priority || policy.sensitivity_level}
                    </span>
                    <button
                      onClick={() => togglePolicyStatus(policy.id)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        isActive
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {isActive ? "ACTIVE" : "PAUSED"}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {policy.description}
                </p>

                {/* Rule Syntax Box */}
                <div className="p-3 rounded-xl bg-[#080b11] border border-slate-800/80 font-mono text-[11px] text-cyan-300 leading-relaxed overflow-x-auto">
                  <code>{policy.rule}</code>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>Tools:</span>
                  {policy.affected_tools?.slice(0, 2).map((t, idx) => (
                    <span key={idx} className="bg-[#121622] px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-slate-800">
                      {t}
                    </span>
                  ))}
                  {(policy.affected_tools?.length || 0) > 2 && (
                    <span className="text-[10px] text-slate-400">+{policy.affected_tools!.length - 2}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Updated {policy.last_updated || "Recently"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Policy Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1017] p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Define New Security Policy
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Policy Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. AWS Production Instance Protection"
                  className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Clear description of the policy purpose and scope"
                  className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Priority / Risk</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Guardrail Rule Statement</label>
                <textarea
                  rows={3}
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="IF action IN ['delete', 'terminate'] AND resource CONTAINS 'prod' THEN BLOCK"
                  className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow"
                >
                  Save &amp; Index to Moss
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
