from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import time

class DecisionEnum(str, Enum):
    ALLOW = "ALLOW"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    BLOCK = "BLOCK"

class ExecutionStatus(str, Enum):
    PENDING_EVALUATION = "PENDING_EVALUATION"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    BLOCKED = "BLOCKED"

class ProposedToolAction(BaseModel):
    action: str = Field(..., description="Action name, e.g. send_file, read_data, delete_database")
    tool: str = Field(..., description="Tool name, e.g. email_client, catalog_reader, db_admin")
    resource: str = Field(..., description="Target resource, e.g. customer.csv, product_catalog, production_db")
    destination: Optional[str] = Field(None, description="External destination, e.g. external@gmail.com, internal_s3")
    user: str = Field(default="agent_default_user", description="Authenticated user or agent identity")
    context: Optional[str] = Field(default="", description="Additional context from execution environment")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary tool parameters")

class PolicyItem(BaseModel):
    id: str
    title: str
    description: str
    rule: str
    category: str
    sensitivity_level: str  # PUBLIC, INTERNAL, SENSITIVE, CRITICAL
    relevance_score: float = Field(0.0, description="Semantic relevance calculated by Moss")
    keywords: List[str] = Field(default_factory=list)

class PermissionResult(BaseModel):
    is_permitted: bool
    permission_level: str
    required_level: str
    role: str
    user_id: str
    notes: str

class SecurityCheckRequest(BaseModel):
    user_request: str = Field(..., description="Original user prompt or instruction")
    proposed_action: ProposedToolAction
    caller_ip: Optional[str] = None
    session_id: Optional[str] = None

class SecurityCheckResponse(BaseModel):
    decision: DecisionEnum
    reason: str
    retrieved_policies: List[PolicyItem]
    permission_result: PermissionResult
    moss_latency_ms: float
    evaluation_latency_ms: float
    total_latency_ms: float
    event_id: str
    execution_status: ExecutionStatus

class ChatRequest(BaseModel):
    message: str = Field(..., description="Natural language prompt for AI Agent")
    user_id: Optional[str] = "analyst_agent"
    role: Optional[str] = "developer"
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    agent_thought: str
    proposed_action: ProposedToolAction
    security_evaluation: SecurityCheckResponse

class ApprovalRequest(BaseModel):
    event_id: str
    approver: str = "security_officer"
    approved: bool
    comments: Optional[str] = "Approved after manual review"

class ApprovalResponse(BaseModel):
    event_id: str
    status: ExecutionStatus
    message: str
    execution_result: Optional[str] = None

class SecurityEvent(BaseModel):
    event_id: str
    timestamp: float = Field(default_factory=time.time)
    request: str
    proposed_action: ProposedToolAction
    retrieved_policies: List[PolicyItem]
    decision: DecisionEnum
    reason: str
    permission_result: PermissionResult
    moss_latency_ms: float
    evaluation_latency_ms: float
    total_latency_ms: float
    status: ExecutionStatus
    approved_by: Optional[str] = None
    execution_result: Optional[str] = None
