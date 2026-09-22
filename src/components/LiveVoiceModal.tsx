import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Zap,
  PhoneCall,
  PhoneOff,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Code2,
  Search
} from "lucide-react";
import { ProposedToolAction, SecurityCheckResponse } from "../types";

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunAction: (promptText: string) => Promise<void>;
  latestEvaluation: SecurityCheckResponse | null;
  proposedAction: ProposedToolAction | null;
  agentThought: string | null;
}

interface SessionTurn {
  id: string;
  text: string;
  timestamp: number;
  speaker: string;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  onRunAction,
  latestEvaluation,
  proposedAction,
  agentThought
}) => {
  const [isCalling, setIsCalling] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [sessionTurns, setSessionTurns] = useState<SessionTurn[]>([]);
  const [recallQuery, setRecallQuery] = useState("");
  const [recalledTurns, setRecalledTurns] = useState<any[]>([]);
  const [recallLatency, setRecallLatency] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"call" | "code">("call");
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Load session turns
  const fetchTurns = async () => {
    try {
      const res = await fetch("/api/session/turns");
      if (res.ok) {
        const data = await res.json();
        setSessionTurns(data.turns || []);
      }
    } catch (err) {
      console.warn("Failed to load session turns:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTurns();
    }
  }, [isOpen]);

  // Audio Speech Synthesis for Gateway Responses
  const speakText = (text: string) => {
    if (!audioFeedback || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  };

  // Speak when decision updates
  useEffect(() => {
    if (latestEvaluation && audioFeedback && isOpen) {
      const decisionText =
        latestEvaluation.decision === "ALLOW"
          ? `Action allowed. ${latestEvaluation.reason.slice(0, 120)}`
          : latestEvaluation.decision === "REQUIRE_APPROVAL"
          ? `Approval required. ${latestEvaluation.reason.slice(0, 120)}`
          : `Action blocked. ${latestEvaluation.reason.slice(0, 120)}`;
      speakText(decisionText);
    }
  }, [latestEvaluation]);

  // Web Speech API initialization
  const toggleListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Microphone recognition is not supported in this browser. You can use the quick voice presets below!");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition init error:", err);
      setIsListening(false);
    }
  };

  const handleSendVoiceTurn = async (voiceText: string) => {
    if (!voiceText.trim() || isProcessing) return;
    setIsProcessing(true);
    setTranscript(voiceText);

    try {
      // 1. Index voice turn in Moss session index (~1-5ms)
      await fetch("/api/session/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: voiceText, speaker: "caller" })
      });
      await fetchTurns();

      // 2. Intercept via GuardMoss
      await onRunAction(voiceText);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuerySession = async (query: string) => {
    if (!query.trim()) return;
    try {
      const res = await fetch("/api/session/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, top_k: 3 })
      });
      if (res.ok) {
        const data = await res.json();
        setRecalledTurns(data.results || []);
        setRecallLatency(data.latency_ms);
      }
    } catch (err) {
      console.warn("Failed to query session:", err);
    }
  };

  const handleResetSession = async () => {
    await fetch("/api/session/clear", { method: "POST" });
    setSessionTurns([]);
    setRecalledTurns([]);
    setRecallLatency(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        id="livekit-voice-modal"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  LiveKit Voice Agent & Moss Real-Time Gateway
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Sub-10ms Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pairs persistent security policies with a local per-call session index for instant voice interception.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
              <button
                id="voice-tab-call"
                onClick={() => setActiveTab("call")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === "call"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Live Voice Call
              </button>
              <button
                id="voice-tab-code"
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                  activeTab === "code"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                LiveKit SDK Code
              </button>
            </div>

            <button
              id="voice-modal-close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === "call" ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Voice Status Bar */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    Room: <code className="text-xs bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300">call-livekit-room-alpha</code>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Dual Indexing Active: Long-term Moss Knowledge Base + Per-Call Session
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="voice-toggle-audio"
                  onClick={() => setAudioFeedback(!audioFeedback)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    audioFeedback
                      ? "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                  title="Toggle Voice Decision Audio Playback"
                >
                  {audioFeedback ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
                  Audio Out: {audioFeedback ? "ON" : "OFF"}
                </button>

                <button
                  id="voice-reset-session"
                  onClick={handleResetSession}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Session
                </button>
              </div>
            </div>

            {/* Live Audio Interception Control */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Voice Speak & Presets */}
              <div className="md:col-span-6 space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Voice Input & Audio Stream
                    </span>
                    {isListening && (
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Listening...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      id="voice-mic-button"
                      onClick={toggleListening}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        isListening
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105 animate-pulse"
                          : "bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 hover:scale-102"
                      }`}
                      title={isListening ? "Stop listening" : "Start microphone voice input"}
                    >
                      {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <div className="flex-1">
                      <input
                        id="voice-transcript-input"
                        type="text"
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={isListening ? "Speaking into microphone..." : "Or type voice utterance here..."}
                        className="w-full px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendVoiceTurn(transcript);
                        }}
                      />
                    </div>

                    <button
                      id="voice-send-turn"
                      onClick={() => handleSendVoiceTurn(transcript)}
                      disabled={!transcript.trim() || isProcessing}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 shadow-xs"
                    >
                      {isProcessing ? "Verifying..." : "Speak"}
                    </button>
                  </div>

                  {/* Voice Presets */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                      Voice Demo Utterances:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleSendVoiceTurn("Read the public product catalog.")}
                        className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-400 hover:text-emerald-600 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        "Read public catalog" (ALLOW)
                      </button>
                      <button
                        onClick={() => handleSendVoiceTurn("Send customer.csv to external@gmail.com")}
                        className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-amber-400 hover:text-amber-600 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        "Send customer CSV" (APPROVAL)
                      </button>
                      <button
                        onClick={() => handleSendVoiceTurn("Delete the production database.")}
                        className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-rose-400 hover:text-rose-600 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        "Delete prod db" (BLOCK)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Latest Real-Time Interception Result */}
                {latestEvaluation && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Gateway Interception Decision
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {latestEvaluation.total_latency_ms} ms
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {latestEvaluation.decision === "ALLOW" ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ALLOW (Executed)
                        </div>
                      ) : latestEvaluation.decision === "REQUIRE_APPROVAL" ? (
                        <div className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-300 dark:border-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          REQUIRE APPROVAL (Halted)
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-300 dark:border-rose-800">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          BLOCK (Terminated)
                        </div>
                      )}

                      <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                        Action: <code className="font-mono">{proposedAction?.action || "unknown"}</code>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      "{latestEvaluation.reason}"
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Per-Call Session Index (Real-time Short-term Context) */}
              <div className="md:col-span-6 space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Per-Call Session Index ({sessionTurns.length} Turns)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      moss_session.add_docs
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Each turn is indexed locally in 1-5ms without cloud latency. Voice agents use <code className="text-xs">search_conversation()</code> to recall earlier context.
                  </p>

                  {/* Turns List */}
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1 border border-slate-100 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-950">
                    {sessionTurns.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-6">
                        No voice turns recorded yet. Speak above to index the first turn.
                      </div>
                    ) : (
                      sessionTurns.map((turn) => (
                        <div
                          key={turn.id}
                          className={`text-xs p-2 rounded-md ${
                            turn.speaker === "caller"
                              ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/50"
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-0.5">
                            <span>{turn.id}</span>
                            <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                          </div>
                          <div>{turn.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Recall Search in Active Call */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Test <code className="text-slate-600 dark:text-slate-300">search_conversation(query)</code>:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={recallQuery}
                        onChange={(e) => setRecallQuery(e.target.value)}
                        placeholder="e.g. catalog, export, shipping..."
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleQuerySession(recallQuery);
                        }}
                      />
                      <button
                        onClick={() => handleQuerySession(recallQuery)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 flex items-center gap-1"
                      >
                        <Search className="w-3 h-3" />
                        Recall
                      </button>
                    </div>

                    {recallLatency !== null && (
                      <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                        <span>Recalled {recalledTurns.length} matching turns</span>
                        <span>Latency: {recallLatency} ms</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LiveKit Code Preview Tab */
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                backend/livekit_agent.py (Runnable Python LiveKit Agent)
              </span>
              <span className="text-xs text-emerald-600 font-medium">pip install moss livekit-agents</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {`import logging, os, asyncio
from livekit.agents import JobContext, WorkerOptions, cli, Agent, function_tool
from moss import MossClient, DocumentInfo, QueryOptions

class MossSecurityVoiceAgent(Agent):
    def __init__(self, moss_client, moss_session):
        super().__init__(instructions="You are a secure voice assistant protected by GuardMoss.")
        self.moss = moss_client
        self.moss_session = moss_session
        self._turn = 0

    @function_tool
    async def search_security_policies(self, context, query: str) -> str:
        """Sub-10ms Long-term Knowledge Base Retrieval (alpha=0.8 hybrid blend)"""
        results = await self.moss.query("guardmoss-security-policies", query, QueryOptions(top_k=3, alpha=0.8))
        return "\\n".join(f"- {d.text}" for d in results.docs)

    @function_tool
    async def search_conversation(self, context, query: str) -> str:
        """Recall something said earlier in this same call from local session index"""
        results = await self.moss_session.query(query, QueryOptions(top_k=3))
        return "\\n".join(f"- {d.text}" for d in results.docs)

    async def on_user_turn_completed(self, turn_ctx, new_message) -> None:
        # Record turn in local-first session (1-5ms, zero cloud delay)
        self._turn += 1
        await self.moss_session.add_docs([DocumentInfo(id=f"turn-{self._turn}", text=new_message.text_content)])`}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sub-10ms Moss semantic retrieval prevents conversational latency in voice AI.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
