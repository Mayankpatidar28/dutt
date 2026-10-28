import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Award,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ScoreCard from '../components/common/ScoreCard';

export default function SessionReport() {
  const location = useLocation();
  const navigate = useNavigate();

  const report = location.state?.report || {
    durationSeconds: 480,
    speakingScore: 78,
    grammarScore: 71,
    vocabularyScore: 82,
    pronunciationScore: 69,
    overallScore: 75,
    mistakesCount: 3,
    newVocabularyCount: 4,
    mainWeakness: 'Past Tense',
    recommendedNextPractice: 'Past Tense Conversation',
    estimatedLevel: 'B1',
    strengths: [
      'Natural sentence pace and steady articulation',
      'Good communicative intent with clear expression',
    ],
  };

  useEffect(() => {
    // Trigger celebratory confetti on completing session
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#A855F7', '#06B6D4'],
      });
    } catch (e) {
      // Ignore if canvas-confetti is not loaded
    }
  }, []);

  const formatDuration = (secs = 0) => {
    const mins = Math.round(secs / 60);
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Session Completed Successfully</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
          Great work with Dutt today! 🎉
        </h1>

        <p className="text-sm text-slate-300">
          You practiced speaking for <strong className="text-white">{formatDuration(report.durationSeconds)}</strong>. Here is your AI breakdown:
        </p>
      </div>

      {/* 4 Core Metric Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ScoreCard
          title="Speaking"
          score={report.speakingScore}
          color="indigo"
          subtitle="Fluency"
        />
        <ScoreCard
          title="Grammar"
          score={report.grammarScore}
          color="purple"
          subtitle="Accuracy"
        />
        <ScoreCard
          title="Vocabulary"
          score={report.vocabularyScore}
          color="cyan"
          subtitle="Word choice"
        />
        <ScoreCard
          title="Pronunciation"
          score={report.pronunciationScore}
          color="emerald"
          subtitle="Clarity"
        />
      </div>

      {/* Summary Insights Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-indigo-500/20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-800 text-center">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">
              Grammar Points
            </span>
            <span className="text-2xl font-black text-amber-400">
              {report.mistakesCount}
            </span>
            <span className="text-[10px] text-slate-500 block">Noted & explained</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">
              New Vocabulary
            </span>
            <span className="text-2xl font-black text-indigo-400">
              {report.newVocabularyCount}
            </span>
            <span className="text-[10px] text-slate-500 block">Added to your deck</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">
              Estimated Level
            </span>
            <span className="text-2xl font-black text-white">
              {report.estimatedLevel || 'B1'}
            </span>
            <span className="text-[10px] text-slate-500 block">Current rating</span>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Main Improvement Focus
            </h4>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
              <span className="font-semibold capitalize">
                Focus on: {report.mainWeakness}
              </span>
              <span className="text-[11px] text-slate-400">
                Recommended for tomorrow's conversation
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recommended Next Practice
            </h4>
            <p className="text-sm font-semibold text-white">
              {report.recommendedNextPractice}
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/speaking')}
            icon={RotateCcw}
            className="w-full sm:w-auto"
          >
            Practice Another Topic
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard')}
            icon={ArrowRight}
            className="w-full sm:w-auto"
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
