import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mic,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Volume2,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import VoiceOrb from '../components/voice/VoiceOrb';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orbState, setOrbState] = useState('IDLE');
  const [demoStep, setDemoStep] = useState(0);

  const demoConversation = [
    {
      sender: 'DUTT',
      text: "Hey! I'm Dutt 👋 Let's practice English together. How was your day?",
    },
    {
      sender: 'USER',
      text: "I go to the office yesterday and finished my project.",
    },
    {
      sender: 'DUTT',
      text: "That sounds productive! A quick tip: say 'I went to the office' since it happened yesterday. What was your project about?",
      hasCorrection: true,
      original: "I go to the office",
      corrected: "I went to the office",
    },
  ];

  const toggleOrbDemo = () => {
    const states = ['IDLE', 'LISTENING', 'PROCESSING', 'SPEAKING'];
    const nextIndex = (states.indexOf(orbState) + 1) % states.length;
    setOrbState(states[nextIndex]);
  };

  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between gap-12 pt-8 pb-16">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex-1 text-center lg:text-left space-y-6 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI English Speaking Coach</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white leading-[1.1]">
            Speak English. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Build Confidence.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Meet <strong className="text-white">Dutt</strong> — your friendly, personal AI English speaking and learning coach. Practice real voice conversations, receive gentle real-time grammar explanations, and speak fluently without fear.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate(isAuthenticated ? '/speaking' : '/register')}
              icon={Mic}
              className="w-full sm:w-auto"
            >
              Start Learning Free
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(isAuthenticated ? '/speaking' : '/login')}
              icon={ArrowRight}
              className="w-full sm:w-auto"
            >
              Try a Conversation
            </Button>
          </div>

          <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Free Voice Practice
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> CEFR Levels A1 - C1
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-400" /> Private & Secure
            </span>
          </div>
        </div>

        {/* Hero Interactive Orb Showcase */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="p-8 rounded-3xl bg-[#111827]/70 backdrop-blur-2xl border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 flex flex-col items-center max-w-md w-full">
            <VoiceOrb state={orbState} size="lg" onClick={toggleOrbDemo} />

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                Tap the orb to preview Dutt's reactive states:
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {['IDLE', 'LISTENING', 'PROCESSING', 'SPEAKING'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setOrbState(s)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                      orbState === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Dutt Works Section */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
            The Dutt Learning Philosophy
          </h2>
          <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            Listen → Speak → Correct → Explain → Practice → Remember → Improve
          </h3>
          <p className="text-sm text-slate-400">
            Dutt never interrupts you mid-sentence with red ink. The conversation flows naturally, prioritizing real communicative meaning before gently explaining major grammar patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              1
            </div>
            <h4 className="text-base font-bold text-white">Natural Voice Conversations</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Talk directly through your microphone. Practice casual chit-chat, job interviews, workplace discussions, or real-life roleplays like restaurants and airports.
            </p>
          </Card>

          <Card hover className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
              2
            </div>
            <h4 className="text-base font-bold text-white">Gentle, Meaning-First Feedback</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dutt understands what you mean first, then highlights major grammar patterns and common Indian English idioms with simple, non-judgmental explanations.
            </p>
          </Card>

          <Card hover className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              3
            </div>
            <h4 className="text-base font-bold text-white">Spaced Repetition & Progress</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track repeated mistakes automatically. Build personal vocabulary cards that resurface using scientifically proven spaced-repetition schedules.
            </p>
          </Card>
        </div>
      </section>

      {/* Interactive Conversation Simulator */}
      <section className="p-8 rounded-3xl bg-[#111827]/90 border border-slate-800 shadow-2xl">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Experience the Flow
            </span>
            <h3 className="text-2xl font-bold text-white">
              See How Dutt Converses With You
            </h3>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/80 space-y-4">
            {demoConversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.sender === 'DUTT' ? 'justify-start' : 'justify-end'}`}
              >
                {msg.sender === 'DUTT' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                    ✦
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs ${
                    msg.sender === 'DUTT'
                      ? 'bg-slate-900 border border-slate-800 text-slate-200'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>

                  {msg.hasCorrection && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg">
                      <span className="font-bold">Gentle Tip:</span> Say "{msg.corrected}" instead of "{msg.original}" for past actions.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(isAuthenticated ? '/speaking' : '/register')}
              icon={Mic}
            >
              Start Talking with Dutt
            </Button>
          </div>
        </div>
      </section>

      {/* Conversation Modes Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-2xl font-bold text-white">5 Powerful Practice Modes</h3>
          <p className="text-xs text-slate-400">
            Tailor your practice session to whatever skill you need today.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: 'Free Conversation', desc: 'Unstructured natural speaking about your life and passions' },
            { title: 'Daily Practice', desc: '10-minute targeted daily routine to maintain consistency' },
            { title: 'Job Interview', desc: 'Realistic behavioral and technical interview simulations' },
            { title: 'Roleplay Scenarios', desc: 'Restaurants, airports, hotels, shopping, and office meetings' },
            { title: 'Debate Topics', desc: 'Defend viewpoints and articulate nuanced logical arguments' },
          ].map((mode, i) => (
            <Card key={i} hover className="p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white mb-1.5">{mode.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{mode.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-indigo-400 text-xs font-semibold">
                <span>Practice Mode →</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-2xl font-bold text-white">Learner Experience</h3>
          <p className="text-xs text-slate-400">
            Designed specifically for college students, job seekers, and working professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              role: 'Software Engineer (Job Seeker)',
              target: 'Passed technical interview at product company',
              feedback: 'Talking to Dutt every morning eliminated my nervousness during client calls and interviews.',
            },
            {
              role: 'College Student (B1 Learner)',
              target: 'Improved from A2 to B1 within 4 weeks',
              feedback: 'The real-time corrections without embarrassing interruptions helped me speak without fear.',
            },
            {
              role: 'Working Professional',
              target: 'Executive presentations and emails',
              feedback: 'The roleplay practice for office meetings taught me subtle vocabulary like "nuance" and "articulate".',
            },
          ].map((item, idx) => (
            <Card key={idx} className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wide">
                <span>✦ {item.role}</span>
              </div>
              <p className="text-xs text-slate-300 italic">"{item.feedback}"</p>
              <div className="text-[11px] text-emerald-400 font-medium">
                Goal achieved: {item.target}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="p-10 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-indigo-950/80 border border-indigo-500/30 text-center space-y-6">
        <h3 className="text-3xl font-display font-extrabold text-white">
          Ready to speak English with confidence?
        </h3>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Start your personalized speaking journey with Dutt now. Free initial level calibration and instant conversation.
        </p>
        <Button
          size="lg"
          variant="primary"
          onClick={() => navigate(isAuthenticated ? '/speaking' : '/register')}
          icon={Mic}
        >
          Meet Dutt Today
        </Button>
      </section>
    </div>
  );
}
