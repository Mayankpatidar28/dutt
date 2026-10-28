import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

/**
 * Robust Voice Hook for English Learning Dutt
 * ─────────────────────────────────────────────
 * Bug-fix history (2026-10-28):
 *  1. FIXED: `hasReceivedFinalTranscriptRef = { current: false }` was
 *     reassigning the ref to a plain object instead of mutating .current.
 *     This broke the ref so MediaRecorder could never detect a Web-Speech
 *     result and always triggered the STT backend fallback.
 *  2. FIXED: SpeechRecognition captured in module closure — moved lookup
 *     inside startListening() to always pick up the current window value.
 *  3. FIXED: `continuous: false` caused auto-stop mid-sentence. Changed to
 *     continuous mode so the recognition keeps going until stopListening().
 *  4. FIXED: Race condition — rapid double-clicks could create two parallel
 *     recognition instances. Added `isStartingRef` guard.
 *  5. FIXED: MediaRecorder cleanup race — `onend` of recognition stopped
 *     the media stream before recorder `onstop` could fire and collect
 *     chunks. Deferred stream cleanup to recorder onstop.
 *  6. ADDED: `audioLevel` populated via Web Audio API AnalyserNode.
 */
export function useVoice({ onTranscript, onError, lang = 'en-US' } = {}) {
  const [isListening, setIsListening]           = useState(false);
  const [isSpeaking, setIsSpeaking]             = useState(false);
  const [transcript, setTranscript]             = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError]             = useState(null);
  const [micPermissionState, setMicPermissionState] = useState('prompt');
  const [audioLevel, setAudioLevel]             = useState(0);

  // Stable callback refs — avoid stale closures on re-renders
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef      = useRef(onError);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Core references
  const recognitionRef              = useRef(null);
  const mediaStreamRef              = useRef(null);
  const mediaRecorderRef            = useRef(null);
  const audioChunksRef              = useRef([]);
  const synthesisRef                = useRef(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );
  const isManuallyStoppedRef        = useRef(false);
  const hasReceivedFinalTranscriptRef = useRef(false); // ← FIXED: never reassign this ref
  const isStartingRef               = useRef(false);   // ← NEW: rapid-click guard

  // Web Audio API for volume meter
  const audioContextRef = useRef(null);
  const analyserRef     = useRef(null);
  const animFrameRef    = useRef(null);

  // ─── Helper: supported MediaRecorder MIME ──────────────────────────────────
  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  // ─── Helper: resolve SpeechRecognition at call-time ─────────────────────────
  const getSpeechRecognition = () =>
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition || null
      : null;

  // ─── Cleanup: stop all microphone tracks ────────────────────────────────────
  const cleanupMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      console.log('[Voice] CLEANUP: stopping mic tracks');
      mediaStreamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch (_) {}
      });
      mediaStreamRef.current = null;
    }
    // Stop volume meter
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // ─── Helper: start volume analyser ──────────────────────────────────────────
  const startVolumeAnalyser = useCallback((stream) => {
    try {
      const ACtx = window.AudioContext || window.webkitAudioContext;
      if (!ACtx) return;
      const ctx = new ACtx();
      audioContextRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setAudioLevel(Math.min(100, Math.round((sum / data.length / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn('[Voice] AudioContext meter error:', e.message);
    }
  }, []);

  // ─── Acquire microphone stream ───────────────────────────────────────────────
  const acquireMicrophoneStream = useCallback(async () => {
    console.log('[Voice] MIC REQUESTED');

    // Secure-context check (localhost is always OK)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (!isLocal) {
        const msg = 'Microphone access requires HTTPS. Please open the app over HTTPS.';
        console.error('[Voice] INSECURE CONTEXT');
        setVoiceError(msg);
        if (onErrorRef.current) onErrorRef.current(msg);
        throw new Error(msg);
      }
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Your browser does not support microphone access (mediaDevices).';
      console.error('[Voice] BROWSER UNSUPPORTED');
      setVoiceError(msg);
      if (onErrorRef.current) onErrorRef.current(msg);
      throw new Error(msg);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log('[Voice] MIC PERMISSION GRANTED — tracks:', stream.getAudioTracks().length);
      setMicPermissionState('granted');
      mediaStreamRef.current = stream;
      startVolumeAnalyser(stream);
      return stream;
    } catch (err) {
      console.error('[Voice] MIC ACQUISITION ERROR:', err.name, err.message);
      let msg = 'Could not access your microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
        setMicPermissionState('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone was detected. Please plug in a microphone and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Your microphone is currently being used by another application.';
      } else if (err.name === 'SecurityError') {
        msg = 'Microphone access is blocked by your browser security settings.';
      }
      setVoiceError(msg);
      if (onErrorRef.current) onErrorRef.current(msg);
      throw err;
    }
  }, [startVolumeAnalyser]);

  // ─── startListening ──────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    // Rapid-click guard: prevent two parallel startListening calls
    if (isStartingRef.current || isListening) {
      console.warn('[Voice] startListening called while already starting or listening — ignored');
      return;
    }
    isStartingRef.current = true;

    setVoiceError(null);
    setTranscript('');
    setInterimTranscript('');
    isManuallyStoppedRef.current = false;
    hasReceivedFinalTranscriptRef.current = false; // ← FIXED: mutate .current, not the ref itself

    // Cancel any ongoing TTS
    if (synthesisRef.current?.speaking) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }

    // Abort any stale recognition instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    // Stop any leftover recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
    mediaRecorderRef.current = null;
    cleanupMediaStream();

    // 1. Acquire microphone
    let stream;
    try {
      stream = await acquireMicrophoneStream();
    } catch (_) {
      isStartingRef.current = false;
      return;
    }

    // 2. Set up MediaRecorder (audio backup / Firefox STT path)
    audioChunksRef.current = [];
    const mimeType = getSupportedMimeType();
    if (typeof MediaRecorder !== 'undefined' && mimeType) {
      try {
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data?.size > 0) {
            audioChunksRef.current.push(e.data);
            console.log(`[Voice] AUDIO CHUNK: ${e.data.size} bytes`);
          }
        };

        recorder.onstart = () => console.log('[Voice] RECORDER STARTED (MIME:', mimeType, ')');

        recorder.onstop = async () => {
          console.log('[Voice] RECORDER STOPPED');
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log(`[Voice] RECORDED BLOB: ${blob.size} bytes`);

          // Fallback: only send to backend STT if Web Speech API produced nothing
          if (!hasReceivedFinalTranscriptRef.current && blob.size > 1000) {
            console.log('[Voice] No Web Speech transcript — trying backend STT fallback');
            try {
              const formData = new FormData();
              formData.append('audio', blob, 'recording.webm');
              const sttRes = await api.transcribeAudio(formData);
              if (sttRes?.transcript?.trim()) {
                const t = sttRes.transcript.trim();
                console.log('[Voice] BACKEND STT TRANSCRIPT:', t);
                setTranscript(t);
                if (onTranscriptRef.current) onTranscriptRef.current(t);
              }
            } catch (sttErr) {
              console.warn('[Voice] Backend STT fallback failed:', sttErr.message);
            }
          }

          // Release mic AFTER recorder finishes collecting chunks
          cleanupMediaStream();
        };

        recorder.start(250);
      } catch (recErr) {
        console.warn('[Voice] MediaRecorder setup failed:', recErr.message);
      }
    }

    // 3. Web Speech API (primary path — Chrome / Edge / Safari)
    const SpeechRecognition = getSpeechRecognition(); // ← FIXED: resolve at call-time
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous      = true;  // ← FIXED: keep going until user stops
        recognition.interimResults  = true;
        recognition.lang            = lang || 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('[Voice] SPEECH RECOGNITION STARTED');
          setIsListening(true);
          setVoiceError(null);
          isStartingRef.current = false;
        };

        recognition.onaudiostart = () => console.log('[Voice] AUDIO CAPTURE STARTED');
        recognition.onsoundstart = () => console.log('[Voice] SOUND DETECTED');
        recognition.onspeechstart = () => console.log('[Voice] SPEECH DETECTED');

        recognition.onresult = (event) => {
          let interim = '';
          let final   = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              final += result[0].transcript;
            } else {
              interim += result[0].transcript;
            }
          }
          if (interim) {
            console.log('[Voice] INTERIM:', interim);
            setInterimTranscript(interim);
          }
          if (final.trim()) {
            const clean = final.trim();
            console.log('[Voice] FINAL TRANSCRIPT:', clean);
            hasReceivedFinalTranscriptRef.current = true;
            setTranscript(clean);
            setInterimTranscript('');
            if (onTranscriptRef.current) onTranscriptRef.current(clean);
          }
        };

        recognition.onspeechend  = () => console.log('[Voice] SPEECH ENDED');
        recognition.onaudioend   = () => console.log('[Voice] AUDIO ENDED');

        recognition.onerror = (event) => {
          console.warn('[Voice] SPEECH RECOGNITION ERROR:', event.error);
          isStartingRef.current = false;
          let msg = null;
          if (event.error === 'not-allowed') {
            msg = 'Please allow microphone permission in your browser.';
            setMicPermissionState('denied');
          } else if (event.error === 'service-not-allowed') {
            msg = 'Speech recognition service is not allowed by your browser or OS.';
          } else if (event.error === 'no-speech') {
            msg = "I didn't hear anything. Please try speaking again.";
          } else if (event.error === 'audio-capture') {
            msg = "Couldn't access your microphone. Please check your mic connection.";
          } else if (event.error === 'network') {
            msg = 'Speech recognition needs a network connection.';
          } else if (event.error === 'aborted') {
            console.log('[Voice] Recognition aborted (manual stop).');
          }
          if (msg) {
            setVoiceError(msg);
            if (onErrorRef.current) onErrorRef.current(msg);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          console.log('[Voice] SPEECH RECOGNITION ENDED');
          isStartingRef.current = false;
          setIsListening(false);
          setInterimTranscript('');

          // Stop recorder (triggers onstop → blob collection → cleanup)
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch (_) {}
          } else {
            // No recorder — clean up mic directly
            cleanupMediaStream();
          }
        };

        recognition.start();
        console.log('[Voice] recognition.start() called');
      } catch (startErr) {
        console.error('[Voice] Failed to start SpeechRecognition:', startErr);
        isStartingRef.current = false;
        setIsListening(false);
        cleanupMediaStream();
      }
    } else {
      // Firefox / no Web Speech API — pure MediaRecorder path
      console.log('[Voice] Web Speech API unavailable — using MediaRecorder-only STT path');
      setIsListening(true);
      isStartingRef.current = false;
    }
  }, [acquireMicrophoneStream, cleanupMediaStream, lang]);

  // ─── stopListening ───────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    console.log('[Voice] USER STOP REQUESTED');
    isManuallyStoppedRef.current = true;
    isStartingRef.current = false;
    setIsListening(false);
    setInterimTranscript('');

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }

    // Stop recorder (onstop will handle cleanup)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    } else {
      cleanupMediaStream();
    }
  }, [cleanupMediaStream]);

  // ─── speak (Text-to-Speech) ──────────────────────────────────────────────────
  const speak = useCallback((text, onEndCallback) => {
    if (!synthesisRef.current || !text) {
      if (onEndCallback) onEndCallback();
      return;
    }
    try {
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate  = 0.96;
      utterance.pitch = 1.0;

      const pickVoice = () => {
        const voices = synthesisRef.current.getVoices();
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith('en-IN') ||
            v.lang.startsWith('en-GB') ||
            v.lang.startsWith('en-US')
        );
        if (preferred) utterance.voice = preferred;
      };
      pickVoice();
      if (synthesisRef.current.onvoiceschanged !== undefined) {
        synthesisRef.current.onvoiceschanged = pickVoice;
      }

      utterance.onstart = () => { console.log('[Voice] TTS STARTED'); setIsSpeaking(true); };
      utterance.onend   = () => {
        console.log('[Voice] TTS ENDED');
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      };
      utterance.onerror = (err) => {
        console.warn('[Voice] TTS ERROR:', err);
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      };

      synthesisRef.current.speak(utterance);
    } catch (e) {
      console.warn('[Voice] TTS execution error:', e);
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // ─── Unmount cleanup ─────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
      if (synthesisRef.current) synthesisRef.current.cancel();
      cleanupMediaStream();
    };
  }, [cleanupMediaStream]);

  return {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    voiceError,
    micPermissionState,
    audioLevel,
    isWebSpeechSupported: !!getSpeechRecognition(),
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setVoiceError,
  };
}
