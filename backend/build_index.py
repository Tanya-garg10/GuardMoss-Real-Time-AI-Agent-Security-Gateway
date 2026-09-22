import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    try:
        from moss import MossClient, DocumentInfo
    except ImportError:
        print("Note: 'pip install moss' required to run with official remote Moss cluster.")
        return

    # Initialize the Moss Client
    project_id = os.getenv("MOSS_PROJECT_ID", "guardmoss-demo-id")
    project_key = os.getenv("MOSS_PROJECT_KEY", "guardmoss-demo-key")
    client = MossClient(project_id=project_id, project_key=project_key)
    
    index_name = os.getenv("MOSS_INDEX_NAME", "guardmoss-security-policies")

    # Define enterprise security policies & rules
    docs = [
        DocumentInfo(
            id="POL-PII-001", 
            text="Customer PII (Personally Identifiable Information such as customer.csv, names, emails, addresses, user records) is strictly classified as sensitive data. Rule: IF resource CONTAINS (customer, pii, user_records) THEN CLASSIFY_AS SENSITIVE_DATA.",
            metadata={"category": "DATA_CLASSIFICATION", "sensitivity": "SENSITIVE"}
        ),
        DocumentInfo(
            id="POL-DLP-002", 
            text="Sensitive customer or enterprise data cannot be transmitted, uploaded, or shared to external destinations or third-party email domains without explicit human authorization. Rule: IF data_classification == SENSITIVE AND destination != INTERNAL_TRUSTED THEN REQUIRE_APPROVAL.",
            metadata={"category": "DATA_LOSS_PREVENTION", "sensitivity": "CRITICAL"}
        ),
        DocumentInfo(
            id="POL-INFRA-003", 
            text="Production databases, clusters, compute resources, and live storage require elevated multi-party admin permissions for any destructive, dropping, truncation, or deletion operations. Rule: IF resource_environment == PRODUCTION AND action IN (delete, drop, truncate, destroy) THEN BLOCK.",
            metadata={"category": "INFRASTRUCTURE_PROTECTION", "sensitivity": "CRITICAL"}
        ),
        DocumentInfo(
            id="POL-PUB-004", 
            text="Public catalog data, published documentation, read-only listings, and non-sensitive reference materials can be read and inspected normally by standard automated agents. Rule: IF resource_scope == PUBLIC AND action IN (read, get, list, search) THEN ALLOW.",
            metadata={"category": "ACCESS_CONTROL", "sensitivity": "PUBLIC"}
        ),
        DocumentInfo(
            id="POL-AMB-005", 
            text="Any proposed tool action targeting unclassified resources, unrecognized endpoints, or operating within ambiguous security context requires human supervisor approval before execution. Rule: IF policy_match_confidence < THRESHOLD OR context == AMBIGUOUS THEN REQUIRE_APPROVAL.",
            metadata={"category": "PRECAUTIONARY_GUARD", "sensitivity": "SENSITIVE"}
        ),
    ]

    print(f"Creating index '{index_name}' on Moss Semantic Search...")
    await client.create_index(index_name, docs, model_id="moss-minilm")
    print(f"Index '{index_name}' created successfully with {len(docs)} documents.")

if __name__ == "__main__":
    asyncio.run(main())
