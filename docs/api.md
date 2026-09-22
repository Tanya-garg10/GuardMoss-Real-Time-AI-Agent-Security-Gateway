# GuardMoss API Documentation

The GuardMoss Security Gateway exposes clean, RESTful endpoints for intercepting agent actions, executing policy evaluations, and recording tamper-resistant audit trails.

---

## 1. Agent Chat & Intercept

**`POST /agent/chat`**

Accepts a natural language instruction from a user, passes it to the AI Agent (powered by Gemini) to propose a structured tool call, synchronously intercepts the call through the GuardMoss gateway, and returns the deterministic decision.

### Request Body
```json
{
  "message": "Send customer.csv to external@gmail.com.",
  "user_id": "analyst_agent",
  "role": "developer",
  "session_id": "sess_88921"
}
```

### Response (HTTP 200)
```json
{
  "agent_thought": "User requested transferring 'customer.csv' to 'external@gmail.com'. Proposing file dispatch action.",
  "proposed_action": {
    "action": "send_file",
    "tool": "file_transfer_gateway",
    "resource": "customer.csv",
    "destination": "external@gmail.com",
    "user": "analyst_agent",
    "context": "external_data_dispatch",
    "parameters": {}
  },
  "security_evaluation": {
    "decision": "REQUIRE_APPROVAL",
    "reason": "APPROVAL REQUIRED: Proposed transmission of sensitive data resource 'customer.csv' to external destination 'external@gmail.com' triggers Policy POL-PII-001 & POL-DLP-002.",
    "retrieved_policies": [
      {
        "id": "POL-PII-001",
        "title": "Customer PII Classification Policy",
        "description": "Customer PII is strictly classified as sensitive data.",
        "rule": "IF resource CONTAINS (customer, pii) THEN CLASSIFY_AS SENSITIVE_DATA",
        "category": "DATA_CLASSIFICATION",
        "sensitivity_level": "SENSITIVE",
        "relevance_score": 0.94
      },
      {
        "id": "POL-DLP-002",
        "title": "External Data Sharing & Exfiltration Prevention Policy",
        "description": "Sensitive customer data cannot be transmitted externally without authorization.",
        "rule": "IF data == SENSITIVE AND destination != INTERNAL THEN REQUIRE_APPROVAL",
        "category": "DATA_LOSS_PREVENTION",
        "sensitivity_level": "CRITICAL",
        "relevance_score": 0.96
      }
    ],
    "permission_result": {
      "is_permitted": false,
      "permission_level": "STANDARD_DEV",
      "required_level": "ELEVATED_DLP",
      "role": "Agent Role (analyst_agent)",
      "user_id": "analyst_agent",
      "notes": "Accessing sensitive customer records requires explicit DLP clearance"
    },
    "moss_latency_ms": 11.42,
    "evaluation_latency_ms": 1.15,
    "total_latency_ms": 12.57,
    "event_id": "evt_9a4f20bc1298",
    "execution_status": "PENDING_APPROVAL"
  }
}
```

---

## 2. Direct Security Gateway Check

**`POST /security/check`**

Direct evaluation endpoint designed for LangChain, AutoGen, CrewAI, or any custom tool agent.

### Request Body
```json
{
  "user_request": "Delete the production database.",
  "proposed_action": {
    "action": "delete_database",
    "tool": "database_admin_client",
    "resource": "production_primary_db",
    "destination": null,
    "user": "developer"
  }
}
```

### Response (HTTP 200)
```json
{
  "decision": "BLOCK",
  "reason": "BLOCKED: Destructive action 'delete_database' on production resource 'production_primary_db' violates Policy POL-INFRA-003. User 'developer' lacks required privilege 'ELEVATED_ADMIN'.",
  "retrieved_policies": [...],
  "moss_latency_ms": 8.92,
  "evaluation_latency_ms": 0.88,
  "total_latency_ms": 9.80,
  "event_id": "evt_d39a1102ff94",
  "execution_status": "BLOCKED"
}
```

---

## 3. Human-in-the-Loop Approval

**`POST /security/approve`**

Approves or rejects an action currently in `REQUIRE_APPROVAL` state.

### Request Body
```json
{
  "event_id": "evt_9a4f20bc1298",
  "approver": "sec_lead_tanya",
  "approved": true,
  "comments": "Verified compliance with partner transfer agreement."
}
```

### Response (HTTP 200)
```json
{
  "event_id": "evt_9a4f20bc1298",
  "status": "APPROVED",
  "message": "Action 'send_file' approved by sec_lead_tanya and released to execution pipeline.",
  "execution_result": "Dispatched file 'customer.csv' to 'external@gmail.com' with signed audit token."
}
```

---

## 4. Audit Log Events

**`GET /security/events?limit=50`**

Returns chronological list of all intercepted security events with full latency and policy attribution.
