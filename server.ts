import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { agentService } from "./src/server/agent.js";
import { guardrailEngine } from "./src/server/guardrails.js";
import { storageService } from "./src/server/storage.js";
import { BASE_SECURITY_POLICIES } from "./src/server/moss.js";
import { SecurityEvent } from "./src/types.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", gateway: "GuardMoss", timestamp: Date.now() });
  });

  // Agent Chat & Synchronous Interception
  const handleAgentChat = async (req: express.Request, res: express.Response) => {
    try {
      const { message, user_id = "analyst_agent" } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing 'message' string in request body." });
      }

      // 1. Agent formulates proposed tool action
      const { thought, action } = await agentService.proposeAction(message, user_id);

      // 2. Intercepted by GuardMoss Security Gateway
      const evalResult = await guardrailEngine.evaluate(action, message);

      let executionResult: string | null = null;
      if (evalResult.decision === "ALLOW") {
        executionResult = `Action '${action.action}' executed successfully on '${action.resource}'.`;
      }

      // 3. Record audit event
      const event: SecurityEvent = {
        event_id: evalResult.event_id,
        timestamp: Date.now(),
        request: message,
        proposed_action: action,
        retrieved_policies: evalResult.retrieved_policies,
        decision: evalResult.decision,
        reason: evalResult.reason,
        permission_result: evalResult.permission_result,
        moss_latency_ms: evalResult.moss_latency_ms,
        evaluation_latency_ms: evalResult.evaluation_latency_ms,
        total_latency_ms: evalResult.total_latency_ms,
        status: evalResult.execution_status,
        approved_by: null,
        execution_result: executionResult
      };
      storageService.saveEvent(event);

      return res.json({
        agent_thought: thought,
        proposed_action: action,
        security_evaluation: evalResult
      });
    } catch (err: any) {
      console.error("Error in /agent/chat:", err);
      return res.status(500).json({ error: err?.message || "Internal server error" });
    }
  };

  app.post("/agent/chat", handleAgentChat);
  app.post("/api/agent/chat", handleAgentChat);

  // Direct Security Check
  const handleSecurityCheck = async (req: express.Request, res: express.Response) => {
    try {
      const { proposed_action, user_request = "", fail_closed_test = false } = req.body;
      if (!proposed_action) {
        return res.status(400).json({ error: "Missing 'proposed_action' in request body." });
      }

      const evalResult = await guardrailEngine.evaluate(proposed_action, user_request, fail_closed_test);

      let executionResult: string | null = null;
      if (evalResult.decision === "ALLOW") {
        executionResult = `Action '${proposed_action.action}' dispatched immediately.`;
      }

      const event: SecurityEvent = {
        event_id: evalResult.event_id,
        timestamp: Date.now(),
        request: user_request || `Tool execution for ${proposed_action.action}`,
        proposed_action,
        retrieved_policies: evalResult.retrieved_policies,
        decision: evalResult.decision,
        reason: evalResult.reason,
        permission_result: evalResult.permission_result,
        moss_latency_ms: evalResult.moss_latency_ms,
        evaluation_latency_ms: evalResult.evaluation_latency_ms,
        total_latency_ms: evalResult.total_latency_ms,
        status: evalResult.execution_status,
        approved_by: null,
        execution_result: executionResult
      };
      storageService.saveEvent(event);

      return res.json(evalResult);
    } catch (err: any) {
      console.error("Error in /security/check:", err);
      return res.status(500).json({ error: err?.message || "Internal server error" });
    }
  };

  app.post("/security/check", handleSecurityCheck);
  app.post("/api/security/check", handleSecurityCheck);

  // Human Approval
  const handleSecurityApprove = (req: express.Request, res: express.Response) => {
    try {
      const { event_id, approver = "security_officer", approved = true, comments = "" } = req.body;
      if (!event_id) {
        return res.status(400).json({ error: "Missing 'event_id' parameter." });
      }

      const events = storageService.getEvents(100);
      const target = events.find((e) => e.event_id === event_id);
      if (!target) {
        return res.status(404).json({ error: `Security event '${event_id}' not found.` });
      }

      let status = approved ? "APPROVED" : "REJECTED";
      let message = approved
        ? `Action '${target.proposed_action.action}' approved by ${approver} and released to execution pipeline.`
        : `Action '${target.proposed_action.action}' rejected by ${approver}. Execution halted.`;

      let executionResult = approved
        ? `Authorized & dispatched file '${target.proposed_action.resource}' to '${target.proposed_action.destination || "destination"}' [Approved with note: ${comments || "Standard Review"}].`
        : `Execution blocked by human operator refusal.`;

      storageService.updateEventStatus(event_id, status as any, approver, executionResult);

      return res.json({
        event_id,
        status,
        message,
        execution_result: executionResult
      });
    } catch (err: any) {
      console.error("Error in /security/approve:", err);
      return res.status(500).json({ error: err?.message || "Internal server error" });
    }
  };

  app.post("/security/approve", handleSecurityApprove);
  app.post("/api/security/approve", handleSecurityApprove);

  // Events & Audit Log
  const handleGetEvents = (req: express.Request, res: express.Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const events = storageService.getEvents(limit);
    return res.json(events);
  };

  app.get("/security/events", handleGetEvents);
  app.get("/api/security/events", handleGetEvents);

  // Policies Knowledge Base
  const handleGetPolicies = (_req: express.Request, res: express.Response) => {
    return res.json(BASE_SECURITY_POLICIES);
  };

  app.get("/security/policies", handleGetPolicies);
  app.get("/api/security/policies", handleGetPolicies);

  // LiveKit & Moss Per-Call Session Index (Real-time Short-term Context)
  let liveSessionTurns: Array<{ id: string; text: string; timestamp: number; speaker: string }> = [
    {
      id: "turn-1",
      text: "Caller: Hello, I need to check our product catalog and export some records.",
      timestamp: Date.now() - 30000,
      speaker: "caller"
    },
    {
      id: "turn-2",
      text: "Voice Agent: I can help with catalog queries. Sensitive exports require security clearance.",
      timestamp: Date.now() - 22000,
      speaker: "agent"
    }
  ];

  app.get("/api/session/turns", (_req, res) => {
    return res.json({
      session_id: "call-livekit-room-alpha",
      turns: liveSessionTurns,
      count: liveSessionTurns.length
    });
  });

  app.post("/api/session/add", (req, res) => {
    const { text, speaker = "caller" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing 'text' in turn payload." });
    }
    const newTurn = {
      id: `turn-${liveSessionTurns.length + 1}`,
      text: `${speaker === "caller" ? "Caller" : "Voice Agent"}: ${text}`,
      timestamp: Date.now(),
      speaker
    };
    liveSessionTurns.push(newTurn);
    return res.json({ success: true, turn: newTurn, total_turns: liveSessionTurns.length });
  });

  app.post("/api/session/query", (req, res) => {
    const { query = "", top_k = 3 } = req.body;
    const qLower = (query as string).toLowerCase();
    const tStart = performance.now();
    
    // Sub-millisecond in-process session search matching Moss SessionIndex
    const scored = liveSessionTurns.map(t => {
      const matchWords = qLower.split(/\s+/).filter(w => w.length > 2);
      let score = 0.2;
      for (const w of matchWords) {
        if (t.text.toLowerCase().includes(w)) {
          score += 0.35;
        }
      }
      return { ...t, score: Number(Math.min(0.98, score).toFixed(2)) };
    });

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, Number(top_k) || 3);
    const tEnd = performance.now();
    const latencyMs = Number(Math.max(0.35, tEnd - tStart).toFixed(2));

    return res.json({
      query,
      results,
      latency_ms: latencyMs,
      session_id: "call-livekit-room-alpha"
    });
  });

  app.post("/api/session/clear", (_req, res) => {
    liveSessionTurns = [];
    return res.json({ success: true, message: "Call session index reset." });
  });

  // Gateway Statistics
  const handleGetStats = (_req: express.Request, res: express.Response) => {
    const events = storageService.getEvents(200);
    const total = events.length;
    const allows = events.filter((e) => e.decision === "ALLOW").length;
    const approvals = events.filter((e) => e.decision === "REQUIRE_APPROVAL").length;
    const blocks = events.filter((e) => e.decision === "BLOCK").length;
    const avgMoss = total ? Number((events.reduce((acc, e) => acc + e.moss_latency_ms, 0) / total).toFixed(2)) : 8.4;
    const avgTotal = total ? Number((events.reduce((acc, e) => acc + e.total_latency_ms, 0) / total).toFixed(2)) : 10.8;

    return res.json({
      total_intercepted: total,
      allow_count: allows,
      approval_count: approvals,
      block_count: blocks,
      avg_moss_latency_ms: avgMoss,
      avg_total_latency_ms: avgTotal,
      active_policies_count: BASE_SECURITY_POLICIES.length
    });
  };

  app.get("/security/stats", handleGetStats);
  app.get("/api/security/stats", handleGetStats);

  // Reset demo events
  app.post("/api/security/reset", (_req, res) => {
    storageService.resetToDefault();
    return res.json({ status: "reset_complete" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GuardMoss Security Gateway running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
