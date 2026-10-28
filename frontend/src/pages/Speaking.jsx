import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Send,
  StopCircle,
  Clock,
  BookOpen,
  Wrench,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useVoice } from '../hooks/useVoice';
import VoiceOrb from '../components/voice/VoiceOrb';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConversationMessage from '../components/conversation/ConversationMessage';
import CorrectionCard from '../components/conversation/CorrectionCard';
import VocabularyCard from '../components/conversation/VocabularyCard';

export default function Speaking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode  = searchParams.get('mode')  || 'FREE';
  const initialTopic = searchParams.get('topic') || 'General Conversation';

  const [mode, setMode]                         = useState(initialMode);
  const [topic, setTopic]                       = useState(initialTopic);
  const [conversation, setConversation]         = useState(null);
  const [messages, setMessages]                 = useState([]);
  const [latestCorrection, setLatestCorrection] = useState(null);
  const [extractedVocabulary, setExtractedVocab] = useState([]);
  const [textInput, setTextInput]               = useState('');
  const [isProcessing, setIsProcessing]         = useState(false);
  const [sessionSeconds, setSessionSeconds]     = useState(0);
  const [orbState, setOrbState]                 = useState('IDLE');
  const [sessionError, setSessionError]         = useState(null);
  const [pendingApproval, setPendingApproval]   = useState(null);

  const messagesEndRef    = useRef(null);
  const timerRef          = useRef(null);
  const conversationIdRef = useRef(null);
  const sessionInitRef    = useRef(false); // prevent double-init

  // ── Voice hook — declared BEFORE handleSendMessage so setVoiceError is available ──
  const {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    voiceError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setVoiceError,
  } = useVoice({
    onTranscript: useCallback((finalText) => {
      console.log('[Speaking] onTranscript:', finalText);
      if (finalText?.trim()) {
        // Use imperative ref so we always have the latest convId without stale closure
        sendMessageImperative(finalText.trim());
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    onError: useCallback((err) => {
      console.warn('[Speaking] Voice error:', err);
      setOrbState('ERROR');
    }, []),
  });

  // ── Imperative send — avoids stale closure captures for voice callback ──────
  const sendMessageImperative = useCallback(async (messageContent) => {
    const convId = conversationIdRef.current;
    if (!messageContent?.trim() || !convId) {
      console.warn('[Speaking] Cannot send — missing content or convId', { messageContent, convId });
      return;
    }

    const userText = messageContent.trim();
    setTextInput('');
    setIsProcessing(true);
    setSessionError(null);

    // Optimistic user message bubble
    const tempId = 'temp_' + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: tempId, sender: 'USER', messageText: userText, createdAt: new Date().toISOString() },
    ]);

    try {
      console.log('[Speaking] POST /conversations/:id/messages', userText);
      const res = await api.sendMessage(convId, { messageText: userText });

      if (res?.duttMessage) {
        setMessages((prev) => [...prev, res.duttMessage]);
        speak(res.duttMessage.messageText);
      }

      if (res?.pendingApproval) {
        setPendingApproval(res.pendingApproval);
      } else {
        setPendingApproval(null);
      }

      try {
        if (res?.correction?.originalText) {
          setLatestCorrection({
            original:    res.correction.originalText,
            corrected:   res.correction.correctedText,
            explanation: res.correction.explanation,
            topic:       res.correction.grammarTopic,
          });
        }
        if (Array.isArray(res?.vocabulary) && res.vocabulary.length > 0) {
          setExtractedVocab((prev) => {
            const map = new Map(prev.map((v) => [v.word, v]));
            res.vocabulary.forEach((item) => map.set(item.word, item));
            return Array.from(map.values()).slice(-6);
          });
        }
      } catch (optErr) {
        console.warn('[Speaking] Optional feedback parsing error:', optErr);
      }
    } catch (err) {
      console.error('[Speaking] sendMessage failed:', err);
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSessionError(err.message || 'Failed to get a response from Dutt');
      setOrbState('ERROR');
    } finally {
      setIsProcessing(false);
    }
  // speak is stable from useVoice, ok to include
  }, [speak]);

  // handleSendMessage — used by the text form
  const handleSendMessage = async (text) => {
    if (!text?.trim() || isProcessing) return;
    await sendMessageImperative(text.trim());
  };

  // handleApprovalDecision — used by Action Approval Card
  const handleApprovalDecision = async (decision) => {
    const convId = conversationIdRef.current;
    if (!pendingApproval || !convId || isProcessing) return;

    setIsProcessing(true);
    setSessionError(null);
    try {
      const res = await api.approveAction(convId, {
        actionId: pendingApproval.actionId,
        decision,
      });

      if (res?.duttMessage) {
        setMessages((prev) => [...prev, res.duttMessage]);
        speak(res.duttMessage.messageText);
      }
      setPendingApproval(null);
    } catch (err) {
      console.error('[Speaking] approveAction error:', err);
      setSessionError(err.message || 'Failed to process action decision.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Orb state sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (voiceError || sessionError) {
      setOrbState('ERROR');
    } else if (isProcessing) {
      setOrbState('PROCESSING');
    } else if (isListening) {
      setOrbState('LISTENING');
    } else if (isSpeaking) {
      setOrbState('SPEAKING');
    } else {
      setOrbState('IDLE');
    }
  }, [isListening, isSpeaking, isProcessing, voiceError, sessionError]);

  // ── Session timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── One-time conversation init (mode/topic only, NOT speak) ─────────────────
  // FIXED: removed `speak` from dependencies — it's stable but caused double-init
  // on some React StrictMode / HMR scenarios. Using sessionInitRef guard instead.
  useEffect(() => {
    if (sessionInitRef.current) return;
    sessionInitRef.current = true;

    async function initSession() {
      setIsProcessing(true);
      setSessionError(null);
      try {
        console.log('[Speaking] Creating conversation:', mode, topic);
        const res = await api.createConversation({ mode, topic });
        setConversation(res.conversation);
        conversationIdRef.current = res.conversation.id;
        console.log('[Speaking] Conversation created:', res.conversation.id);

        if (res.initialMessage) {
          setMessages([res.initialMessage]);
          // Speak initial greeting — speak ref is stable so this is safe
          speak(res.initialMessage.messageText);
        }
      } catch (err) {
        console.error('[Speaking] Failed to start conversation:', err);
        setSessionError('Could not start conversation session. Please refresh.');
      } finally {
        setIsProcessing(false);
      }
    }
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-init when mode/topic change (user switches mid-session)
  const prevModeRef  = useRef(mode);
  const prevTopicRef = useRef(topic);
  useEffect(() => {
    if (prevModeRef.current === mode && prevTopicRef.current === topic) return;
    prevModeRef.current  = mode;
    prevTopicRef.current = topic;
    sessionInitRef.current = false;

    setMessages([]);
    setLatestCorrection(null);
    setExtractedVocab([]);
    setConversation(null);
    conversationIdRef.current = null;

    setIsProcessing(true);
    setSessionError(null);
    api.createConversation({ mode, topic })
      .then((res) => {
        setConversation(res.conversation);
        conversationIdRef.current = res.conversation.id;
        if (res.initialMessage) {
          setMessages([res.initialMessage]);
          speak(res.initialMessage.messageText);
        }
      })
      .catch((err) => {
        console.error('[Speaking] Mode change init failed:', err);
        setSessionError('Could not start new conversation.');
      })
      .finally(() => setIsProcessing(false));
  }, [mode, topic, speak]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  const handleEndSession = async () => {
    stopListening();
    stopSpeaking();
    const convId = conversationIdRef.current || conversation?.id;
    if (!convId) { navigate('/dashboard'); return; }
    try {
      const res = await api.endConversation(convId);
      navigate('/session-report', {
        state: { report: res.sessionReport, conversation: res.conversation },
      });
    } catch (err) {
      console.error('[Speaking] endConversation failed:', err);
      navigate('/dashboard');
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayError = voiceError || sessionError;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="FREE">Free Conversation</option>
            <option value="DAILY_PRACTICE">Daily Practice</option>
            <option value="INTERVIEW">Job Interview</option>
            <option value="ROLEPLAY">Roleplay</option>
            <option value="DEBATE">Debate</option>
          </select>

          {mode === 'ROLEPLAY' && (
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-300 focus:outline-none"
            >
              <option value="Restaurant">Restaurant (Dining &amp; Ordering)</option>
              <option value="Airport">Airport (Check-in &amp; Customs)</option>
              <option value="Hotel">Hotel (Reservation &amp; Check-in)</option>
              <option value="Office">Office (Team Sync &amp; Presentation)</option>
              <option value="Job Interview">Job Interview (Engineering)</option>
              <option value="Shopping">Shopping (Boutique &amp; Mall)</option>
              <option value="College">College (Campus &amp; Professor)</option>
              <option value="Customer Support">Customer Support (Call)</option>
            </select>
          )}

          {mode === 'DEBATE' && (
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-300 focus:outline-none"
            >
              <option value="AI in Daily Life">AI in Daily Life</option>
              <option value="Remote Work vs Office">Remote Work vs Office</option>
              <option value="Social Media Impact">Social Media Impact</option>
              <option value="Formal Education vs Self-Taught">Formal Education vs Self-Taught</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/voice-test"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors"
            title="Inspect microphone hardware"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Voice Diagnostic</span>
          </Link>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTimer(sessionSeconds)}</span>
          </div>

          <Button size="sm" variant="danger" onClick={handleEndSession} icon={StopCircle}>
            End Session
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden py-4">
        {/* Chat Panel */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[#111827]/40 rounded-2xl border border-slate-800/80 p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {messages.map((msg) => (
              <ConversationMessage
                key={msg.id}
                message={msg}
                onSpeak={(t) => speak(t)}
                userName={user?.name || 'You'}
              />
            ))}

            {interimTranscript && (
              <div className="flex justify-end mb-2">
                <div className="max-w-[70%] rounded-2xl px-4 py-2 bg-indigo-600/50 text-white text-xs italic animate-pulse">
                  "{interimTranscript}..."
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Action Approval Card */}
          {pendingApproval && (
            <div className="mt-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>ACTION APPROVAL REQUIRED</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold">
                  {pendingApproval.riskLevel || 'APPROVAL_REQUIRED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                {pendingApproval.proposalMessage || `Dutt is preparing to execute "${pendingApproval.toolName}". Do you confirm?`}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApprovalDecision('ALLOW_ONCE')}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                >
                  Allow Once
                </button>
                <button
                  type="button"
                  onClick={() => handleApprovalDecision('ALWAYS_ALLOW')}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                >
                  Always Allow
                </button>
                <button
                  type="button"
                  onClick={() => handleApprovalDecision('REJECT')}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {displayError && (
            <div className="mt-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{displayError}</span>
              </div>
              <button
                onClick={() => { setVoiceError(null); setSessionError(null); }}
                className="text-[11px] underline ml-2 font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center gap-2">
            <button
              id="mic-toggle-btn"
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`p-3.5 rounded-2xl flex items-center justify-center transition-all select-none disabled:opacity-50 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-lg shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(textInput); }}
              className="flex-1 flex gap-2"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening to your voice...'
                    : 'Speak into your mic or type here...'
                }
                disabled={isProcessing}
                className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!textInput.trim() || isProcessing}
                isLoading={isProcessing}
                icon={Send}
              >
                Send
              </Button>
            </form>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
          <Card className="flex flex-col items-center justify-center p-6 border-indigo-500/20 text-center">
            <VoiceOrb
              state={orbState}
              size="md"
              onClick={isListening ? stopListening : startListening}
            />

            <div className="mt-3 w-full space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                {orbState === 'LISTENING'   && '🎙️ Listening...'}
                {orbState === 'PROCESSING'  && '🤔 Dutt is thinking...'}
                {orbState === 'SPEAKING'    && '🔊 Dutt is speaking...'}
                {orbState === 'ERROR'       && (displayError || 'Microphone error')}
                {orbState === 'IDLE'        && 'Tap the microphone to speak'}
              </span>

              {interimTranscript && (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 italic animate-pulse">
                  "{interimTranscript}..."
                </div>
              )}

              {transcript && !interimTranscript && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-300">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold mb-0.5">
                    Recognized Speech
                  </span>
                  "{transcript}"
                </div>
              )}
            </div>
          </Card>

          {latestCorrection && (
            <CorrectionCard
              correction={latestCorrection}
              onTryAgain={(corrected) => handleSendMessage(corrected)}
            />
          )}

          {extractedVocabulary.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> New Vocabulary Words
              </span>
              <div className="space-y-2">
                {extractedVocabulary.map((v) => (
                  <VocabularyCard key={v.word} vocab={v} onPronounce={(w) => speak(w)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
