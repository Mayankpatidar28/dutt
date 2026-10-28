import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Shield,
  Activity,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useVoice } from '../hooks/useVoice';

export default function VoiceTest() {
  const [browserInfo, setBrowserInfo] = useState('');
  const [secureContext, setSecureContext] = useState(false);
  const [mediaDevicesSupported, setMediaDevicesSupported] = useState(false);
  const [permissionState, setPermissionState] = useState('UNKNOWN');
  const [streamActive, setStreamActive] = useState(false);
  const [audioTracksCount, setAudioTracksCount] = useState(0);
  const [trackDetails, setTrackDetails] = useState('');
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);
  const [audioVolume, setAudioVolume] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const testStreamRef = useRef(null);

  const logMessage = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setDiagnosticLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Inspect Environment on Mount
  useEffect(() => {
    // 1. Browser
    const ua = navigator.userAgent;
    let bName = 'Unknown Browser';
    if (ua.includes('Edg/')) bName = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) bName = 'Google Chrome';
    else if (ua.includes('Firefox/')) bName = 'Mozilla Firefox';
    else if (ua.includes('Safari/')) bName = 'Apple Safari';
    setBrowserInfo(`${bName} (${navigator.platform})`);

    // 2. Secure Context
    const isSec = typeof window !== 'undefined' ? !!window.isSecureContext : false;
    setSecureContext(isSec);

    // 3. MediaDevices
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setMediaDevicesSupported(hasMedia);

    // 4. Permissions API
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' })
        .then((perm) => {
          setPermissionState(perm.state.toUpperCase());
          perm.onchange = () => {
            setPermissionState(perm.state.toUpperCase());
            logMessage(`Permission state changed to: ${perm.state}`);
          };
        })
        .catch(() => {
          setPermissionState('NOT QUERYABLE');
        });
    }

    logMessage('Diagnostic initialized.');
  }, []);

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
  } = useVoice({
    onTranscript: (t) => {
      logMessage(`Final transcript received: "${t}"`);
    },
    onError: (err) => {
      logMessage(`Voice Error: ${err}`);
    },
  });

  const testDirectMicrophone = async () => {
    logMessage('Requesting direct microphone stream...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      testStreamRef.current = stream;
      setStreamActive(true);
      const tracks = stream.getAudioTracks();
      setAudioTracksCount(tracks.length);
      setPermissionState('GRANTED');

      if (tracks.length > 0) {
        const details = `Label: ${tracks[0].label} | Enabled: ${tracks[0].enabled} | ReadyState: ${tracks[0].readyState}`;
        setTrackDetails(details);
        logMessage(`Microphone stream acquired successfully. ${details}`);

        // Set up volume meter via Web Audio API
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            audioContextRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateMeter = () => {
              if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
                animFrameRef.current = requestAnimationFrame(updateMeter);
              }
            };
            updateMeter();
          }
        } catch (e) {
          logMessage(`AudioContext meter setup note: ${e.message}`);
        }
      }
    } catch (err) {
      logMessage(`Microphone acquisition failed: ${err.name} - ${err.message}`);
      setPermissionState('DENIED');
      setStreamActive(false);
    }
  };

  const stopDirectMicrophone = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    setStreamActive(false);
    setAudioVolume(0);
    logMessage('Direct microphone stream stopped.');
  };

  const testTTS = () => {
    logMessage('Testing Text-to-Speech synthesis with Dutt voice...');
    speak(
      "Hello! I am Dutt, your personal AI English coach. If you hear my voice clearly, text-to-speech is working flawlessly!"
    );
  };

  const isWebSpeechAvailable =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const isSpeechSynthesisAvailable =
    typeof window !== 'undefined' && !!window.speechSynthesis;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
          Voice Diagnostics & Hardware Inspector
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Development diagnostic utility to inspect browser microphone permissions, stream capture, Web Speech API, and SpeechSynthesis.
        </p>
      </div>

      {/* Diagnostics Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Browser */}
        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Browser
          </span>
          <p className="text-xs font-semibold text-white truncate" title={browserInfo}>
            {browserInfo || 'Checking...'}
          </p>
        </Card>

        {/* Secure Context */}
        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Secure Context (HTTPS)
          </span>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {secureContext ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> YES (Secure)
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> NO (Insecure)
              </span>
            )}
          </div>
        </Card>

        {/* MediaDevices */}
        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            MediaDevices API
          </span>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {mediaDevicesSupported ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> SUPPORTED
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> NOT SUPPORTED
              </span>
            )}
          </div>
        </Card>

        {/* Microphone Permission */}
        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Mic Permission
          </span>
          <div className="text-xs font-bold">
            <span
              className={
                permissionState === 'GRANTED'
                  ? 'text-emerald-400'
                  : permissionState === 'DENIED'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }
            >
              {permissionState}
            </span>
          </div>
        </Card>

        {/* Microphone Stream */}
        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Microphone Stream
          </span>
          <div className="text-xs font-bold">
            {streamActive ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Activity className="w-4 h-4 animate-pulse" /> ACTIVE ({audioTracksCount} tracks)
              </span>
            ) : (
              <span className="text-slate-400">INACTIVE</span>
            )}
          </div>
        </Card>

        {/* Web Speech STT */}
        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SpeechRecognition (STT)
          </span>
          <div className="text-xs font-bold">
            {isWebSpeechAvailable ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> SUPPORTED
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Fallback (MediaRecorder)
              </span>
            )}
          </div>
        </Card>

        {/* SpeechSynthesis TTS */}
        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SpeechSynthesis (TTS)
          </span>
          <div className="text-xs font-bold">
            {isSpeechSynthesisAvailable ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> SUPPORTED
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> NOT SUPPORTED
              </span>
            )}
          </div>
        </Card>

        {/* Recording State */}
        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Recording
          </span>
          <div className="text-xs font-bold">
            {isListening ? (
              <span className="text-rose-400 flex items-center gap-1 animate-pulse">
                <Mic className="w-4 h-4" /> YES (LISTENING)
              </span>
            ) : (
              <span className="text-slate-400">NO</span>
            )}
          </div>
        </Card>
      </div>

      {/* Direct Hardware Test Controls */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Direct Hardware & Speech Controls
        </h2>

        <div className="flex flex-wrap gap-3">
          {!streamActive ? (
            <Button
              size="md"
              variant="primary"
              onClick={testDirectMicrophone}
              icon={Mic}
            >
              Test Microphone Stream
            </Button>
          ) : (
            <Button
              size="md"
              variant="danger"
              onClick={stopDirectMicrophone}
              icon={MicOff}
            >
              Stop Microphone Stream
            </Button>
          )}

          {!isListening ? (
            <Button
              size="md"
              variant="secondary"
              onClick={startListening}
              icon={Play}
            >
              Test Speech Recognition
            </Button>
          ) : (
            <Button
              size="md"
              variant="danger"
              onClick={stopListening}
              icon={MicOff}
            >
              Stop Recognition
            </Button>
          )}

          <Button
            size="md"
            variant="outline"
            onClick={testTTS}
            icon={Volume2}
          >
            Test Dutt Voice (TTS)
          </Button>
        </div>

        {/* Real-time volume meter */}
        {streamActive && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Live Microphone Audio Input Level</span>
              <span className="text-indigo-400 font-bold">{audioVolume}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-75"
                style={{ width: `${audioVolume}%` }}
              />
            </div>
          </div>
        )}

        {trackDetails && (
          <p className="text-xs font-mono text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            {trackDetails}
          </p>
        )}
      </Card>

      {/* Live Transcript Monitor */}
      <Card className="p-6 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Live Recognized Transcript
        </h3>

        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 min-h-[80px] flex items-center justify-center text-center">
          {interimTranscript ? (
            <p className="text-sm text-indigo-300 italic animate-pulse">
              "{interimTranscript}..."
            </p>
          ) : transcript ? (
            <p className="text-sm text-emerald-300 font-medium">
              "{transcript}"
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {isListening
                ? 'Speak into your microphone now...'
                : 'Click "Test Speech Recognition" and speak.'}
            </p>
          )}
        </div>

        {voiceError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {voiceError}
          </div>
        )}
      </Card>

      {/* Diagnostic Event Logs */}
      <Card className="p-6 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Diagnostic Event Stream
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDiagnosticLogs([])}
            icon={RotateCcw}
          >
            Clear Logs
          </Button>
        </div>

        <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto space-y-1">
          {diagnosticLogs.length > 0 ? (
            diagnosticLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))
          ) : (
            <p className="text-slate-600">No events logged yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
