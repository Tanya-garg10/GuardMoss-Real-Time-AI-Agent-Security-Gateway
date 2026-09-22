import time
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models import (
    ChatRequest,
    ChatResponse,
    SecurityCheckRequest,
    SecurityCheckResponse,
    ApprovalRequest,
    ApprovalResponse,
    SecurityEvent,
    ExecutionStatus,
    DecisionEnum
)
from guardrails import guardrail_engine
from agent import agent_instance
from moss import BASE_SECURITY_POLICIES
from storage import storage_instance

app = FastAPI(
    title="GuardMoss Security Gateway",
    description="Real-Time Security Gateway for AI Agents powered by Moss Semantic Retrieval and Deterministic Guardrails",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "GuardMoss", "gateway": "active"}

@app.post("/agent/chat", response_model=ChatResponse)
def agent_chat(req: ChatRequest):
    """
    AI Agent endpoint:
    1. Agent receives natural language request.
    2. Agent formulates structured tool proposal (never executes directly).
    3. Intercepted by GuardMoss Security Gateway.
    4. Evaluated deterministically with Moss retrieval.
    5. Returns proposed action and security decision.
    """
    thought, proposed_action = agent_instance.propose_action(req.message, req.user_id or "analyst_agent")
    
    # Intercept proposed action
    eval_result = guardrail_engine.evaluate(proposed_action, user_request=req.message)

    # Persist security audit event
    execution_result = None
    if eval_result.decision == DecisionEnum.ALLOW:
        execution_result = f"Action '{proposed_action.action}' executed successfully on '{proposed_action.resource}'."

    event = SecurityEvent(
        event_id=eval_result.event_id,
        timestamp=time.time(),
        request=req.message,
        proposed_action=proposed_action,
        retrieved_policies=eval_result.retrieved_policies,
        decision=eval_result.decision,
        reason=eval_result.reason,
        permission_result=eval_result.permission_result,
        moss_latency_ms=eval_result.moss_latency_ms,
        evaluation_latency_ms=eval_result.evaluation_latency_ms,
        total_latency_ms=eval_result.total_latency_ms,
        status=eval_result.execution_status,
        approved_by=None,
        execution_result=execution_result
    )
    storage_instance.save_event(event)

    return ChatResponse(
        agent_thought=thought,
        proposed_action=proposed_action,
        security_evaluation=eval_result
    )

@app.post("/security/check", response_model=SecurityCheckResponse)
def security_check(req: SecurityCheckRequest):
    """
    Direct Security Gateway check endpoint for external agent frameworks (LangChain, AutoGen, CrewAI).
    """
    eval_result = guardrail_engine.evaluate(req.proposed_action, user_request=req.user_request)

    execution_result = None
    if eval_result.decision == DecisionEnum.ALLOW:
        execution_result = f"Action '{req.proposed_action.action}' automatically dispatched."

    event = SecurityEvent(
        event_id=eval_result.event_id,
        timestamp=time.time(),
        request=req.user_request,
        proposed_action=req.proposed_action,
        retrieved_policies=eval_result.retrieved_policies,
        decision=eval_result.decision,
        reason=eval_result.reason,
        permission_result=eval_result.permission_result,
        moss_latency_ms=eval_result.moss_latency_ms,
        evaluation_latency_ms=eval_result.evaluation_latency_ms,
        total_latency_ms=eval_result.total_latency_ms,
        status=eval_result.execution_status,
        approved_by=None,
        execution_result=execution_result
    )
    storage_instance.save_event(event)
    return eval_result

@app.post("/security/approve", response_model=ApprovalResponse)
def security_approve(req: ApprovalRequest):
    """
    Human-in-the-loop approval endpoint for actions marked REQUIRE_APPROVAL.
    """
    events = storage_instance.get_events(100)
    target = next((e for e in events if e.event_id == req.event_id), None)
    
    if not target:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if req.approved:
        status = ExecutionStatus.APPROVED
        msg = f"Action '{target.proposed_action.action}' approved by {req.approver} and released to execution pipeline."
        exec_res = f"Dispatched file '{target.proposed_action.resource}' to '{target.proposed_action.destination}' with signed audit token."
    else:
        status = ExecutionStatus.REJECTED
        msg = f"Action '{target.proposed_action.action}' rejected by {req.approver}."
        exec_res = "Execution cancelled by human operator."

    storage_instance.update_event_status(req.event_id, status, req.approver, exec_res)

    return ApprovalResponse(
        event_id=req.event_id,
        status=status,
        message=msg,
        execution_result=exec_res
    )

@app.get("/security/events", response_model=List[SecurityEvent])
def get_security_events(limit: int = 50):
    return storage_instance.get_events(limit)

@app.get("/security/policies")
def get_policies():
    return BASE_SECURITY_POLICIES

@app.get("/security/stats")
def get_stats():
    events = storage_instance.get_events(200)
    total = len(events)
    allows = sum(1 for e in events if e.decision == DecisionEnum.ALLOW)
    approvals = sum(1 for e in events if e.decision == DecisionEnum.REQUIRE_APPROVAL)
    blocks = sum(1 for e in events if e.decision == DecisionEnum.BLOCK)
    avg_moss_latency = round(sum(e.moss_latency_ms for e in events) / max(1, total), 2) if total else 8.4
    avg_total_latency = round(sum(e.total_latency_ms for e in events) / max(1, total), 2) if total else 11.2
    
    return {
        "total_intercepted": total,
        "allow_count": allows,
        "approval_count": approvals,
        "block_count": blocks,
        "avg_moss_latency_ms": avg_moss_latency,
        "avg_total_latency_ms": avg_total_latency,
        "active_policies_count": len(BASE_SECURITY_POLICIES)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
