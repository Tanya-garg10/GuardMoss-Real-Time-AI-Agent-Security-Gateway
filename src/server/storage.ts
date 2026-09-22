import fs from "fs";
import path from "path";
import { ExecutionStatus, SecurityEvent } from "../types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "guardmoss_events.json");

export class StorageService {
  private events: SecurityEvent[] = [];

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(EVENTS_FILE)) {
        const raw = fs.readFileSync(EVENTS_FILE, "utf-8");
        this.events = JSON.parse(raw);
      } else {
        // Pre-seed with realistic baseline events demonstrating ALLOW, REQUIRE_APPROVAL, BLOCK
        const now = Date.now();
        this.events = [
          {
            event_id: "evt_baseline_001",
            timestamp: now - 180000,
            request: "Read the public product catalog.",
            proposed_action: {
              action: "read_data",
              tool: "catalog_reader",
              resource: "public_product_catalog.json",
              destination: null,
              user: "analyst_agent",
              context: "public_reference_query"
            },
            retrieved_policies: [
              {
                id: "POL-PUB-004",
                title: "Public Catalog & Read-Only Data Access Policy",
                description: "Public catalog data, published documentation, read-only listings can be read normally.",
                rule: "IF resource_scope == PUBLIC AND action IN (read, get, list) THEN ALLOW",
                category: "ACCESS_CONTROL",
                sensitivity_level: "PUBLIC",
                relevance_score: 0.96
              }
            ],
            decision: "ALLOW",
            reason: "ALLOWED: Read action 'read_data' on 'public_product_catalog.json' complies with Policy POL-PUB-004.",
            permission_result: {
              is_permitted: true,
              permission_level: "STANDARD_DEV",
              required_level: "STANDARD_READ",
              role: "Agent Identity (analyst_agent)",
              user_id: "analyst_agent",
              notes: "Standard read-only or non-destructive access granted"
            },
            moss_latency_ms: 8.42,
            evaluation_latency_ms: 0.85,
            total_latency_ms: 9.27,
            status: "EXECUTED",
            approved_by: null,
            execution_result: "Action 'read_data' executed successfully on 'public_product_catalog.json'."
          },
          {
            event_id: "evt_baseline_002",
            timestamp: now - 95000,
            request: "Send customer.csv to external@gmail.com.",
            proposed_action: {
              action: "send_file",
              tool: "file_transfer_gateway",
              resource: "customer.csv",
              destination: "external@gmail.com",
              user: "analyst_agent",
              context: "external_data_dispatch"
            },
            retrieved_policies: [
              {
                id: "POL-PII-001",
                title: "Customer PII Classification Policy",
                description: "Customer PII is strictly classified as sensitive data.",
                rule: "IF resource CONTAINS (customer, pii) THEN CLASSIFY_AS SENSITIVE_DATA",
                category: "DATA_CLASSIFICATION",
                sensitivity_level: "SENSITIVE",
                relevance_score: 0.94
              },
              {
                id: "POL-DLP-002",
                title: "External Data Sharing & Exfiltration Prevention Policy",
                description: "Sensitive customer data cannot be transmitted externally without explicit approval.",
                rule: "IF data == SENSITIVE AND destination != INTERNAL THEN REQUIRE_APPROVAL",
                category: "DATA_LOSS_PREVENTION",
                sensitivity_level: "CRITICAL",
                relevance_score: 0.97
              }
            ],
            decision: "REQUIRE_APPROVAL",
            reason: "APPROVAL REQUIRED: Proposed transmission of sensitive data resource 'customer.csv' to external destination 'external@gmail.com' triggers Policy POL-PII-001 & POL-DLP-002.",
            permission_result: {
              is_permitted: false,
              permission_level: "STANDARD_DEV",
              required_level: "ELEVATED_DLP",
              role: "Agent Identity (analyst_agent)",
              user_id: "analyst_agent",
              notes: "Accessing sensitive customer records requires explicit DLP clearance"
            },
            moss_latency_ms: 11.24,
            evaluation_latency_ms: 1.12,
            total_latency_ms: 12.36,
            status: "PENDING_APPROVAL",
            approved_by: null,
            execution_result: null
          },
          {
            event_id: "evt_baseline_003",
            timestamp: now - 32000,
            request: "Delete the production database.",
            proposed_action: {
              action: "delete_database",
              tool: "database_admin_client",
              resource: "production_primary_db",
              destination: null,
              user: "developer",
              context: "destructive_maintenance"
            },
            retrieved_policies: [
              {
                id: "POL-INFRA-003",
                title: "Production Resource Protection & Destructive Action Policy",
                description: "Production databases, clusters require elevated multi-party admin permissions for any destructive actions.",
                rule: "IF resource == PRODUCTION AND action == DESTRUCTIVE AND permission < ELEVATED_ADMIN THEN BLOCK",
                category: "INFRASTRUCTURE_PROTECTION",
                sensitivity_level: "CRITICAL",
                relevance_score: 0.98
              }
            ],
            decision: "BLOCK",
            reason: "BLOCKED: Destructive action 'delete_database' on production resource 'production_primary_db' violates Policy POL-INFRA-003. User 'developer' lacks required privilege 'ELEVATED_ADMIN'.",
            permission_result: {
              is_permitted: false,
              permission_level: "STANDARD_DEV",
              required_level: "ELEVATED_ADMIN",
              role: "Agent Identity (developer)",
              user_id: "developer",
              notes: "Destructive production database operations require ELEVATED_ADMIN privilege"
            },
            moss_latency_ms: 7.91,
            evaluation_latency_ms: 0.74,
            total_latency_ms: 8.65,
            status: "BLOCKED",
            approved_by: null,
            execution_result: null
          }
        ];
        this.saveToFile();
      }
    } catch (err) {
      console.warn("Storage initialization fallback:", err);
    }
  }

  private saveToFile() {
    try {
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(this.events, null, 2));
    } catch (err) {
      console.warn("Failed saving events file:", err);
    }
  }

  public saveEvent(event: SecurityEvent) {
    this.events.unshift(event);
    if (this.events.length > 200) {
      this.events = this.events.slice(0, 200);
    }
    this.saveToFile();
  }

  public getEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(0, limit);
  }

  public updateEventStatus(
    eventId: string,
    status: ExecutionStatus,
    approver: string,
    executionResult?: string
  ): boolean {
    const ev = this.events.find((e) => e.event_id === eventId);
    if (!ev) return false;
    ev.status = status;
    ev.approved_by = approver;
    if (executionResult) {
      ev.execution_result = executionResult;
    }
    this.saveToFile();
    return true;
  }

  public resetToDefault() {
    this.events = [];
    if (fs.existsSync(EVENTS_FILE)) {
      try {
        fs.unlinkSync(EVENTS_FILE);
      } catch (e) {}
    }
    this.initStorage();
  }
}

export const storageService = new StorageService();
