export type Decision = "ALLOW" | "REQUIRE_APPROVAL" | "BLOCK";

export type ExecutionStatus = 
  | "PENDING_EVALUATION" 
  | "PENDING_APPROVAL" 
  | "APPROVED" 
  | "REJECTED" 
  | "EXECUTED" 
  | "BLOCKED";

export type NavTab = "overview" | "console" | "policies" | "activity";

export type PipelineStage = 
  | "idle"
  | "request" 
  | "agent" 
  | "action" 
  | "moss" 
  | "evaluation" 
  | "decision" 
  | "execution";

export interface ProposedToolAction {
  action: string;
  tool: string;
  resource: string;
  destination: string | null;
  user: string;
  context?: string;
  parameters?: Record<string, any>;
}

export interface PolicyItem {
  id: string;
  title: string;
  description: string;
  rule: string;
  category: string;
  sensitivity_level: "PUBLIC" | "INTERNAL" | "SENSITIVE" | "CRITICAL";
  relevance_score: number;
  keywords?: string[];
  status?: "ACTIVE" | "INACTIVE";
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  affected_tools?: string[];
  last_updated?: string;
}

export interface PermissionResult {
  is_permitted: boolean;
  permission_level: string;
  required_level: string;
  role: string;
  user_id: string;
  notes: string;
}

export interface SecurityCheckResponse {
  decision: Decision;
  reason: string;
  retrieved_policies: PolicyItem[];
  permission_result: PermissionResult;
  moss_latency_ms: number;
  evaluation_latency_ms: number;
  total_latency_ms: number;
  event_id: string;
  execution_status: ExecutionStatus;
}

export interface ChatResponse {
  agent_thought: string;
  proposed_action: ProposedToolAction;
  security_evaluation: SecurityCheckResponse;
}

export interface SecurityEvent {
  event_id: string;
  timestamp: number;
  request: string;
  proposed_action: ProposedToolAction;
  retrieved_policies: PolicyItem[];
  decision: Decision;
  reason: string;
  permission_result: PermissionResult;
  moss_latency_ms: number;
  evaluation_latency_ms: number;
  total_latency_ms: number;
  status: ExecutionStatus;
  approved_by?: string | null;
  execution_result?: string | null;
}

export interface GatewayStats {
  total_intercepted: number;
  allow_count: number;
  approval_count: number;
  block_count: number;
  avg_moss_latency_ms: number;
  avg_total_latency_ms: number;
  active_policies_count: number;
}
