import sqlite3
import json
import time
import os
from typing import List, Optional
from models import SecurityEvent, ExecutionStatus, DecisionEnum, ProposedToolAction, PolicyItem, PermissionResult

DB_PATH = os.getenv("GUARDMOSS_DB_PATH", "guardmoss_events.db")

class SecurityAuditStorage:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS security_events (
                    event_id TEXT PRIMARY KEY,
                    timestamp REAL,
                    request TEXT,
                    action_json TEXT,
                    policies_json TEXT,
                    decision TEXT,
                    reason TEXT,
                    permission_json TEXT,
                    moss_latency_ms REAL,
                    evaluation_latency_ms REAL,
                    total_latency_ms REAL,
                    status TEXT,
                    approved_by TEXT,
                    execution_result TEXT
                )
            """)
            conn.commit()

    def save_event(self, event: SecurityEvent):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO security_events (
                    event_id, timestamp, request, action_json, policies_json,
                    decision, reason, permission_json, moss_latency_ms,
                    evaluation_latency_ms, total_latency_ms, status, approved_by, execution_result
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event.event_id,
                event.timestamp,
                event.request,
                event.proposed_action.model_dump_json(),
                json.dumps([p.model_dump() for p in event.retrieved_policies]),
                event.decision.value,
                event.reason,
                event.permission_result.model_dump_json(),
                event.moss_latency_ms,
                event.evaluation_latency_ms,
                event.total_latency_ms,
                event.status.value,
                event.approved_by,
                event.execution_result
            ))
            conn.commit()

    def get_events(self, limit: int = 50) -> List[SecurityEvent]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM security_events ORDER BY timestamp DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            events = []
            for r in rows:
                action_data = json.loads(r["action_json"])
                policies_data = json.loads(r["policies_json"])
                perm_data = json.loads(r["permission_json"])
                events.append(SecurityEvent(
                    event_id=r["event_id"],
                    timestamp=r["timestamp"],
                    request=r["request"],
                    proposed_action=ProposedToolAction(**action_data),
                    retrieved_policies=[PolicyItem(**p) for p in policies_data],
                    decision=DecisionEnum(r["decision"]),
                    reason=r["reason"],
                    permission_result=PermissionResult(**perm_data),
                    moss_latency_ms=r["moss_latency_ms"],
                    evaluation_latency_ms=r["evaluation_latency_ms"],
                    total_latency_ms=r["total_latency_ms"],
                    status=ExecutionStatus(r["status"]),
                    approved_by=r["approved_by"],
                    execution_result=r["execution_result"]
                ))
            return events

    def update_event_status(self, event_id: str, status: ExecutionStatus, approver: str, result: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE security_events 
                SET status = ?, approved_by = ?, execution_result = ?
                WHERE event_id = ?
            """, (status.value, approver, result, event_id))
            conn.commit()
            return cursor.rowcount > 0

storage_instance = SecurityAuditStorage()
