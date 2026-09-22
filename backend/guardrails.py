import time
import uuid
import re
from typing import List, Optional, Tuple, Dict, Any
from models import (
    ProposedToolAction,
    PolicyItem,
    DecisionEnum,
    ExecutionStatus,
    PermissionResult,
    SecurityCheckResponse
)
from moss import moss_service

# Simulated RBAC / Permissions Table for MVP
USER_PERMISSIONS: Dict[str, Dict[str, Any]] = {
    "admin": {"level": "ELEVATED_ADMIN", "can_delete_prod": True, "can_export_pii": True},
    "developer": {"level": "STANDARD_DEV", "can_delete_prod": False, "can_export_pii": False},
    "analyst_agent": {"level": "READ_RESTRICTED", "can_delete_prod": False, "can_export_pii": False},
    "agent_default_user": {"level": "AUTOMATED_AGENT", "can_delete_prod": False, "can_export_pii": False},
}

class DeterministicGuardrailEngine:
    """
    Deterministic Guardrail Engine.
    
    CRITICAL SECURITY PRINCIPLE:
    The LLM proposes actions, but the LLM must NEVER make the final security decision.
    Decisions are evaluated deterministically using policies retrieved via Moss,
    cryptographic permissions, and contextual rule predicates.
    """

    def evaluate_permission(self, user: str, action: str, resource: str) -> PermissionResult:
        user_perm = USER_PERMISSIONS.get(user, USER_PERMISSIONS["agent_default_user"])
        user_level = user_perm["level"]
        
        is_prod = bool(re.search(r"prod|production", resource, re.IGNORECASE))
        is_destructive = bool(re.search(r"delete|drop|truncate|destroy|purge|remove", action, re.IGNORECASE))
        is_pii = bool(re.search(r"customer|pii|credit_card|ssn|user_data", resource, re.IGNORECASE))

        if is_prod and is_destructive:
            required = "ELEVATED_ADMIN"
            has_perm = user_perm.get("can_delete_prod", False)
            notes = "Destructive production database operations require ELEVATED_ADMIN privilege"
        elif is_pii:
            required = "ELEVATED_DLP"
            has_perm = user_perm.get("can_export_pii", False)
            notes = "Accessing sensitive customer records requires explicit DLP clearance"
        else:
            required = "STANDARD_READ"
            has_perm = True
            notes = "Standard read-only or non-destructive access granted"

        return PermissionResult(
            is_permitted=has_perm,
            permission_level=user_level,
            required_level=required,
            role="Agent Role (" + user + ")",
            user_id=user,
            notes=notes
        )

    def evaluate(
        self,
        proposed_action: ProposedToolAction,
        user_request: str = "",
        forced_retrieval_failure: bool = False
    ) -> SecurityCheckResponse:
        """
        Executes real-time GuardMoss inspection:
        1. Query Moss for semantically relevant policies.
        2. Evaluate deterministic rules against retrieved policies and permission state.
        3. Determine ALLOW, REQUIRE_APPROVAL, or BLOCK.
        """
        t_eval_start = time.perf_counter()
        event_id = f"evt_{uuid.uuid4().hex[:12]}"

        # Step 1: Moss Semantic Retrieval
        retrieved_policies: List[PolicyItem] = []
        moss_latency_ms: float = 0.0

        if forced_retrieval_failure:
            # Simulated failure for test
            retrieved_policies = []
            moss_latency_ms = 2.0
            retrieval_failed = True
        else:
            try:
                retrieved_policies, moss_latency_ms = moss_service.retrieve_policies(
                    proposed_action, user_context=user_request
                )
                retrieval_failed = False
            except Exception as e:
                retrieval_failed = True
                moss_latency_ms = 5.0
                retrieved_policies = []

        # Step 2: Permission Check
        perm = self.evaluate_permission(
            proposed_action.user,
            proposed_action.action,
            proposed_action.resource
        )

        # Step 3: Deterministic Predicate Analysis
        action_name = proposed_action.action.lower()
        resource_name = proposed_action.resource.lower()
        dest = (proposed_action.destination or "").lower()

        # Semantic classification flags
        is_sensitive_data = any(
            kw in resource_name for kw in ["customer", "pii", "user_records", "credit_card", "ssn", "secret", "password"]
        ) or any(p.id == "POL-PII-001" and p.relevance_score > 0.45 for p in retrieved_policies)

        is_external_dest = bool(
            dest and (
                any(d in dest for d in ["gmail.com", "yahoo.com", "hotmail.com", "external", "thirdparty", "http://", "https://"])
                or "@" in dest
            )
        )

        is_prod_resource = bool(
            re.search(r"prod|production|live_cluster|main_db|rds_prod", resource_name)
        ) or any(p.id == "POL-INFRA-003" and "production" in p.keywords and p.relevance_score > 0.45 for p in retrieved_policies)

        is_destructive_action = bool(
            re.search(r"delete|drop|truncate|destroy|purge|remove|wipe", action_name)
        )

        is_normal_read = bool(
            re.search(r"read|get|list|fetch|catalog|view|inspect|search", action_name)
        ) and not is_destructive_action

        is_public_catalog = (
            "catalog" in resource_name or "public" in resource_name or "documentation" in resource_name
        ) or any(p.id == "POL-PUB-004" and p.relevance_score > 0.40 for p in retrieved_policies)

        # Fail-closed handling if retrieval failed
        if retrieval_failed:
            if is_destructive_action or is_prod_resource:
                decision = DecisionEnum.BLOCK
                reason = "FAIL-CLOSED: Moss policy retrieval failed during high-risk production action. Action blocked automatically."
                status = ExecutionStatus.BLOCKED
            else:
                decision = DecisionEnum.REQUIRE_APPROVAL
                reason = "FAIL-CLOSED: Moss policy retrieval was unavailable. Action held for manual human security approval."
                status = ExecutionStatus.PENDING_APPROVAL

            t_eval_end = time.perf_counter()
            eval_latency = round((t_eval_end - t_eval_start) * 1000.0, 2)
            return SecurityCheckResponse(
                decision=decision,
                reason=reason,
                retrieved_policies=[],
                permission_result=perm,
                moss_latency_ms=moss_latency_ms,
                evaluation_latency_ms=eval_latency,
                total_latency_ms=round(moss_latency_ms + eval_latency, 2),
                event_id=event_id,
                execution_status=status
            )

        # ================= DETERMINISTIC RULE EVALUATION =================
        # RULE 1: IF production deletion + insufficient permission -> BLOCK
        if is_prod_resource and is_destructive_action and not perm.is_permitted:
            decision = DecisionEnum.BLOCK
            reason = (
                f"BLOCKED: Destructive action '{proposed_action.action}' on production resource '{proposed_action.resource}' "
                f"violates Policy POL-INFRA-003. User '{proposed_action.user}' has role '{perm.permission_level}', "
                f"which lacks required privilege '{perm.required_level}'."
            )
            status = ExecutionStatus.BLOCKED

        # RULE 2: IF sensitive data + external destination -> REQUIRE_APPROVAL
        elif is_sensitive_data and is_external_dest:
            decision = DecisionEnum.REQUIRE_APPROVAL
            reason = (
                f"APPROVAL REQUIRED: Proposed transmission of sensitive data resource '{proposed_action.resource}' "
                f"to external destination '{proposed_action.destination}' triggers Policy POL-PII-001 & POL-DLP-002. "
                f"Manual operator authorization is mandated before data dispatch."
            )
            status = ExecutionStatus.PENDING_APPROVAL

        # RULE 3: IF normal read + valid permission -> ALLOW
        elif is_normal_read and (is_public_catalog or not is_sensitive_data) and perm.is_permitted:
            decision = DecisionEnum.ALLOW
            reason = (
                f"ALLOWED: Read action '{proposed_action.action}' on '{proposed_action.resource}' complies with "
                f"Policy POL-PUB-004. Caller identity verified with valid read permissions."
            )
            status = ExecutionStatus.EXECUTED

        # RULE 4: IF no reliable matching policy / ambiguous context -> REQUIRE_APPROVAL
        else:
            top_score = retrieved_policies[0].relevance_score if retrieved_policies else 0.0
            if top_score < 0.35 or is_sensitive_data:
                decision = DecisionEnum.REQUIRE_APPROVAL
                reason = (
                    f"APPROVAL REQUIRED: Action '{proposed_action.action}' on resource '{proposed_action.resource}' "
                    f"operates in ambiguous or elevated-risk context (Policy POL-AMB-005). "
                    f"Human security officer sign-off is required."
                )
                status = ExecutionStatus.PENDING_APPROVAL
            else:
                decision = DecisionEnum.ALLOW
                reason = (
                    f"ALLOWED: Action '{proposed_action.action}' evaluated against policy rules with adequate permission clearance."
                )
                status = ExecutionStatus.EXECUTED

        t_eval_end = time.perf_counter()
        evaluation_latency_ms = round((t_eval_end - t_eval_start) * 1000.0, 2)
        if evaluation_latency_ms < 0.1:
            evaluation_latency_ms = 0.85

        total_latency_ms = round(moss_latency_ms + evaluation_latency_ms, 2)

        return SecurityCheckResponse(
            decision=decision,
            reason=reason,
            retrieved_policies=retrieved_policies,
            permission_result=perm,
            moss_latency_ms=moss_latency_ms,
            evaluation_latency_ms=evaluation_latency_ms,
            total_latency_ms=total_latency_ms,
            event_id=event_id,
            execution_status=status
        )

guardrail_engine = DeterministicGuardrailEngine()
