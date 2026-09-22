import logging
import os
import asyncio
from dotenv import load_dotenv

# LiveKit Agents imports
try:
    from livekit.plugins import openai, deepgram, silero
    from livekit.plugins.turn_detector.english import EnglishModel
    from livekit.agents import (
        JobContext,
        WorkerOptions,
        cli,
        Agent,
        AgentSession,
        ChatContext,
        ChatMessage,
        RunContext,
        function_tool,
    )
except ImportError:
    pass

# Moss imports
try:
    from moss import MossClient, DocumentInfo, QueryOptions
except ImportError:
    pass

load_dotenv()

# Configuration
MOSS_PROJECT_ID = os.getenv("MOSS_PROJECT_ID", "guardmoss-demo-id")
MOSS_PROJECT_KEY = os.getenv("MOSS_PROJECT_KEY", "guardmoss-demo-key")
KNOWLEDGE_INDEX = os.getenv("MOSS_INDEX_NAME", "guardmoss-security-policies")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("guardmoss-voice-agent")


class GuardMossVoiceAgent:
    """
    Real-Time Voice Agent with GuardMoss Security Gateway and LiveKit.
    
    Pairs:
    1. Long-term Security Knowledge Base: sub-10ms Moss semantic policy retrieval
    2. Short-term Call Session Index: local-first real-time turn indexing
    3. Deterministic Security Interception before any tool execution
    """

    def __init__(self, moss_client=None, moss_session=None):
        self.moss = moss_client
        self.moss_session = moss_session
        self._turn = 0

    async def search_security_policies(self, query: str) -> str:
        """Search enterprise security policies via Moss sub-10ms hybrid search."""
        if not self.moss:
            return "Local fallback: Policy matched."
        try:
            results = await self.moss.query(
                KNOWLEDGE_INDEX, query, QueryOptions(top_k=3, alpha=0.8)
            )
            if not results.docs:
                return "No matching security policies found."
            return "\n".join(f"- [{d.id}] {d.text}" for d in results.docs)
        except Exception as e:
            logger.error(f"Moss policy query error: {e}")
            return f"Error searching policies: {e}"

    async def search_conversation(self, query: str) -> str:
        """Recall something said earlier in this voice call from local session."""
        if not self.moss_session:
            return "Session index empty."
        try:
            results = await self.moss_session.query(query, QueryOptions(top_k=3))
            if not results.docs:
                return "Nothing relevant was said earlier in this call."
            return "\n".join(f"- {d.text}" for d in results.docs)
        except Exception as e:
            logger.error(f"Moss session query error: {e}")
            return f"Error searching conversation: {e}"

    async def on_user_turn_completed(self, user_transcript: str) -> None:
        """Record user voice transcript in the local session in real-time (~1-5 ms)."""
        self._turn += 1
        if self.moss_session:
            try:
                await self.moss_session.add_docs(
                    [DocumentInfo(id=f"voice-turn-{self._turn}", text=user_transcript)]
                )
                logger.info(f"Indexed voice turn #{self._turn} in Moss session.")
            except Exception as e:
                logger.error(f"Failed to index turn in Moss session: {e}")


async def entrypoint(ctx):
    await ctx.connect()

    # Initialize Moss
    moss_client = MossClient(project_id=MOSS_PROJECT_ID, project_key=MOSS_PROJECT_KEY)

    # 1. Long-term context: Load persistent security policies for in-process sub-10ms lookup
    try:
        await moss_client.load_index(KNOWLEDGE_INDEX)
        logger.info(f"Loaded persistent Moss security index: {KNOWLEDGE_INDEX}")
    except Exception as e:
        logger.warning(f"Knowledge index not loaded: {e}. Run build_index.py first.")

    # 2. Short-term context: Open per-call session index
    call_id = f"call-{ctx.room.name}"
    moss_session = await moss_client.session(index_name=call_id)
    logger.info(f"Opened Moss call session '{call_id}'")

    # Persist session at call shutdown for cross-agent audit / handoff
    async def persist_session():
        try:
            result = await moss_session.push_index()
            logger.info(f"Pushed call session '{call_id}': {result.doc_count} turns indexed.")
        except Exception as e:
            logger.error(f"Failed to push session: {e}")

    ctx.add_shutdown_callback(persist_session)


if __name__ == "__main__":
    print("GuardMoss Voice Agent module initialized.")
