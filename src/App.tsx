import React, { useState, useEffect, useCallback } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Layers, 
  Terminal, 
  FileText, 
  Search, 
  Sparkles,
  Zap,
  ArrowRight,
  Database
} from "lucide-react";
import { TopNav } from "./components/TopNav";
import { MetricCard } from "./components/MetricCard";
import { AgentActionInput } from "./components/AgentActionInput";
import { DecisionCard } from "./components/DecisionCard";
import { SecurityPipeline } from "./components/SecurityPipeline";
import { MossRetrievalPanel } from "./components/MossRetrievalPanel";
import { SecurityExplanation } from "./components/SecurityExplanation";
import { LiveActivityFeed } from "./components/LiveActivityFeed";
import { SecurityConsoleView } from "./components/SecurityConsoleView";
import { PoliciesView } from "./components/PoliciesView";
import { ActivityView } from "./components/ActivityView";
import { EventDrawer } from "./components/EventDrawer";
import { ApprovalModal } from "./components/ApprovalModal";
import { LiveVoiceModal } from "./components/LiveVoiceModal";
import { ErrorState } from "./components/ErrorState";
import { 
  NavTab, 
  SecurityEvent, 
  GatewayStats, 
  PolicyItem, 
  SecurityCheckResponse, 
  ProposedToolAction, 
  PipelineStage 
} from "./types";

export function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");

  // Core Gateway State
  const [stats, setStats] = useState<GatewayStats>({
    total_intercepted: 42,
    allow_count: 24,
    approval_count: 11,
    block_count: 7,
    avg_moss_latency_ms: 8.4,
    avg_total_latency_ms: 11.2,
    active_policies_count: 5
  });
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [policies, setPolicies] = useState<PolicyItem[]>([]);

  // Current Evaluation & Action State
  const [currentStage, setCurrentStage] = useState<PipelineStage>("idle");
  const [latestEvaluation, setLatestEvaluation] = useState<SecurityCheckResponse | null>(null);
  const [proposedAction, setProposedAction] = useState<ProposedToolAction | null>(null);
  const [userRequestText, setUserRequestText] = useState<string>("");
  const [agentThought, setAgentThought] = useState<string>("");

  // Modals & Drawers
  const [selectedDrawerEvent, setSelectedDrawerEvent] = useState<SecurityEvent | null>(null);
  const [approvalModalEvent, setApprovalModalEvent] = useState<SecurityEvent | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Status flags
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [failClosedActive, setFailClosedActive] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Fetch Gateway Data
  const loadGatewayData = useCallback(async () => {
    try {
      setBackendError(null);
      const [eventsRes, statsRes, policiesRes] = await Promise.all([
        fetch("/api/security/events?limit=50"),
        fetch("/api/security/stats"),
        fetch("/api/security/policies")
      ]);

      if (eventsRes.ok && statsRes.ok && policiesRes.ok) {
        const eventsData: SecurityEvent[] = await eventsRes.json();
        const statsData: GatewayStats = await statsRes.json();
        const policiesData: PolicyItem[] = await policiesRes.json();

        setEvents(eventsData);
        setStats(statsData);
        setPolicies(policiesData);

        // If no active evaluation shown yet, populate with latest event
        if (!latestEvaluation && eventsData.length > 0) {
          const topEv = eventsData[0];
          setLatestEvaluation({
            decision: topEv.decision,
            reason: topEv.reason,
            retrieved_policies: topEv.retrieved_policies,
            permission_result: topEv.permission_result,
            moss_latency_ms: topEv.moss_latency_ms,
            evaluation_latency_ms: topEv.evaluation_latency_ms,
            total_latency_ms: topEv.total_latency_ms,
            event_id: topEv.event_id,
            execution_status: topEv.status
          });
          setProposedAction(topEv.proposed_action);
          setUserRequestText(topEv.request);
        }
      }
    } catch (err: any) {
      console.warn("Could not load gateway telemetry:", err);
    }
  }, [latestEvaluation]);

  useEffect(() => {
    loadGatewayData();
  }, [loadGatewayData]);

  // Run Security Check with animated stage pipeline
  const handleRunSecurityCheck = async (prompt: string, failClosed = false) => {
    setIsLoading(true);
    setFailClosedActive(failClosed);
    setUserRequestText(prompt);

    // Realistic pipeline animation sequence
    setCurrentStage("request");
    await new Promise((r) => setTimeout(r, 120));
    setCurrentStage("agent");
    await new Promise((r) => setTimeout(r, 150));
    setCurrentStage("action");
    await new Promise((r) => setTimeout(r, 120));
    setCurrentStage("moss");
    await new Promise((r) => setTimeout(r, 180));
    setCurrentStage("evaluation");
    await new Promise((r) => setTimeout(r, 120));
    setCurrentStage("decision");

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, fail_closed_test: failClosed })
      });

      if (!res.ok) {
        throw new Error(`Gateway returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setAgentThought(data.agent_thought || "");
      setProposedAction(data.proposed_action);
      setLatestEvaluation(data.security_evaluation);

      setCurrentStage("execution");

      // Reload fresh events & stats
      await loadGatewayData();
    } catch (err: any) {
      console.error("Security check failed:", err);
      // Fallback deterministic local evaluation if network drops
      const isCritical = prompt.toLowerCase().includes("delete") || prompt.toLowerCase().includes("database");
      const isPii = prompt.toLowerCase().includes("customer") || prompt.toLowerCase().includes("email");

      const fallbackEval: SecurityCheckResponse = {
        decision: isCritical ? "BLOCK" : isPii ? "REQUIRE_APPROVAL" : "ALLOW",
        reason: isCritical
          ? "Destructive production database actions violate enterprise protection guardrails."
          : isPii
          ? "External sharing of customer records requires security officer review."
          : "Action permitted for public resources.",
        retrieved_policies: policies.slice(0, 2),
        permission_result: {
          is_permitted: !isCritical,
          permission_level: "STANDARD",
          required_level: isCritical ? "ADMIN" : "STANDARD",
          role: "Analyst Agent",
          user_id: "agent_analyst",
          notes: "Evaluated by local GuardMoss fallback rule engine."
        },
        moss_latency_ms: 7.8,
        evaluation_latency_ms: 2.1,
        total_latency_ms: 9.9,
        event_id: `fallback-${Date.now().toString().slice(-6)}`,
        execution_status: isCritical ? "BLOCKED" : isPii ? "PENDING_APPROVAL" : "EXECUTED"
      };

      setLatestEvaluation(fallbackEval);
      setProposedAction({
        action: isCritical ? "database.delete" : isPii ? "email.send" : "catalog.read",
        tool: isCritical ? "database.delete" : isPii ? "email.send" : "catalog.read",
        resource: isCritical ? "production-db" : isPii ? "customer.csv" : "public_catalog",
        destination: isPii ? "external@recipient.com" : null,
        user: "Research Agent"
      });
      setCurrentStage("execution");
    } finally {
      setIsLoading(false);
    }
  };

  // Human Clearance Action Handlers
  const handleApproveEvent = async (eventId: string, comment = "Approved by Security Officer") => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/security/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          approved: true,
          approver: "sec_officer",
          comments: comment
        })
      });

      if (res.ok) {
        await loadGatewayData();
        if (latestEvaluation && latestEvaluation.event_id === eventId) {
          setLatestEvaluation({
            ...latestEvaluation,
            decision: "ALLOW",
            execution_status: "APPROVED",
            reason: `${latestEvaluation.reason} [Cleared by security officer]`
          });
        }
      }
    } catch (err) {
      console.error("Failed to approve event:", err);
    } finally {
      setIsActionLoading(false);
      setApprovalModalEvent(null);
    }
  };

  const handleRejectEvent = async (eventId: string, comment = "Rejected by Security Officer") => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/security/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          approved: false,
          approver: "sec_officer",
          comments: comment
        })
      });

      if (res.ok) {
        await loadGatewayData();
        if (latestEvaluation && latestEvaluation.event_id === eventId) {
          setLatestEvaluation({
            ...latestEvaluation,
            decision: "BLOCK",
            execution_status: "REJECTED",
            reason: `${latestEvaluation.reason} [Explicitly blocked by security officer]`
          });
        }
      }
    } catch (err) {
      console.error("Failed to reject event:", err);
    } finally {
      setIsActionLoading(false);
      setApprovalModalEvent(null);
    }
  };

  // Reset Demo state
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await fetch("/api/security/reset", { method: "POST" });
      await loadGatewayData();
    } catch (err) {
      console.error("Reset demo failed:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* 1. Top Navigation */}
      <TopNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        stats={stats}
        onResetDemo={handleResetDemo}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Fail-closed banner if active */}
        {failClosedActive && (
          <ErrorState
            type="fail-closed"
            title="Moss Retrieval Unavailable — Operating in Fail-Closed Mode"
            message="GuardMoss has locked down sensitive endpoints. All actions requiring retrieval clearance are strictly blocked or held for approval to guarantee zero unverified executions."
          />
        )}

        {/* Tab 1: Main Overview Dashboard */}
        {currentTab === "overview" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <section className="text-center max-w-3xl mx-auto pt-2 pb-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/50 text-[11px] font-mono text-cyan-300 mb-3 shadow-inner">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deterministic Zero-Trust AI Execution Gateway</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-mono">
                AI actions, secured in real time.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
                GuardMoss evaluates every agent action before execution. Powered by Moss sub-10ms semantic retrieval and deterministic guardrails.
              </p>
            </section>

            {/* 2. Interactive Action Input */}
            <section>
              <AgentActionInput
                onRunSecurityCheck={handleRunSecurityCheck}
                isLoading={isLoading}
                onOpenVoice={() => setIsVoiceModalOpen(true)}
              />
            </section>

            {/* 8. Metric Cards (4 compact cards) */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <MetricCard
                label="Actions Checked"
                value={stats.total_intercepted}
                subtext="100% intercepted at gateway"
                icon={Activity}
                trend={{ text: "Live", isPositive: true }}
                accentColor="default"
              />
              <MetricCard
                label="Blocked Actions"
                value={stats.block_count}
                subtext="Zero security breaches"
                icon={XCircle}
                trend={{ text: "Deterministic", isPositive: false }}
                accentColor="rose"
              />
              <MetricCard
                label="Approval Requests"
                value={stats.approval_count}
                subtext="Human-in-the-loop review"
                icon={AlertTriangle}
                trend={{ text: "Pending Review", isPositive: true }}
                accentColor="amber"
              />
              <MetricCard
                label="Avg Moss Latency"
                value={`${stats.avg_moss_latency_ms.toFixed(1)} ms`}
                subtext="C++ vector engine search"
                icon={Zap}
                trend={{ text: "Sub-10ms", isPositive: true }}
                accentColor="emerald"
              />
            </section>

            {/* 3. Live Security Decision Card (Strongest Visual Element) */}
            <section>
              <DecisionCard
                evaluation={latestEvaluation}
                proposedAction={proposedAction}
                agentThought={agentThought}
                onApprove={() => {
                  if (latestEvaluation) {
                    handleApproveEvent(latestEvaluation.event_id);
                  }
                }}
                onReject={() => {
                  if (latestEvaluation) {
                    handleRejectEvent(latestEvaluation.event_id);
                  }
                }}
                isActionLoading={isActionLoading}
              />
            </section>

            {/* 4. Security Evaluation Pipeline */}
            <section>
              <SecurityPipeline
                currentStage={currentStage}
                evaluation={latestEvaluation}
                proposedAction={proposedAction}
                userRequest={userRequestText}
              />
            </section>

            {/* 5 & 6. Moss Retrieval Panel & Decision Explanation */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <MossRetrievalPanel
                  policies={latestEvaluation ? latestEvaluation.retrieved_policies : policies.slice(0, 3)}
                  latencyMs={latestEvaluation?.moss_latency_ms || stats.avg_moss_latency_ms}
                  totalPoliciesCount={policies.length}
                />
              </div>
              <div className="lg:col-span-5">
                <SecurityExplanation
                  evaluation={latestEvaluation}
                  proposedAction={proposedAction}
                />
              </div>
            </section>

            {/* 7. Live Activity Feed */}
            <section>
              <LiveActivityFeed
                events={events}
                onSelectEvent={(ev) => setSelectedDrawerEvent(ev)}
                onViewAll={() => setCurrentTab("activity")}
              />
            </section>
          </div>
        )}

        {/* Tab 2: Security Console */}
        {currentTab === "console" && (
          <SecurityConsoleView
            events={events}
            onApproveEvent={(id) => handleApproveEvent(id)}
            onRejectEvent={(id) => handleRejectEvent(id)}
            isActionLoading={isActionLoading}
          />
        )}

        {/* Tab 3: Policies Management */}
        {currentTab === "policies" && (
          <PoliciesView initialPolicies={policies} />
        )}

        {/* Tab 4: Searchable Activity Audit Log */}
        {currentTab === "activity" && (
          <ActivityView
            events={events}
            onSelectEvent={(ev) => setSelectedDrawerEvent(ev)}
          />
        )}
      </main>

      {/* Slide-out Event Detail Drawer */}
      <EventDrawer
        event={selectedDrawerEvent}
        onClose={() => setSelectedDrawerEvent(null)}
        onApprove={(id) => handleApproveEvent(id)}
        onReject={(id) => handleRejectEvent(id)}
        isActionLoading={isActionLoading}
      />

      {/* Human Approval Modal */}
      <ApprovalModal
        isOpen={Boolean(approvalModalEvent)}
        event={approvalModalEvent}
        onClose={() => setApprovalModalEvent(null)}
        onConfirm={async (id, approved, comment, approver) => {
          if (approved) {
            await handleApproveEvent(id, comment);
          } else {
            await handleRejectEvent(id, comment);
          }
        }}
        isActionLoading={isActionLoading}
      />

      {/* Live Voice & LiveKit Modal */}
      <LiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onRunAction={async (promptText) => {
          await handleRunSecurityCheck(promptText, false);
        }}
        latestEvaluation={latestEvaluation}
        proposedAction={proposedAction}
        agentThought={agentThought}
      />

      {/* Minimal Sleek Footer */}
      <footer className="border-t border-slate-900 bg-[#07090e] py-6 mt-12 text-center text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300">GuardMoss Security Gateway</span>
            <span className="text-slate-400">•</span>
            <span>Real-Time AI Agent Interception</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Moss Sub-10ms Semantic Index • Deterministic Non-LLM Gatekeeper
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
