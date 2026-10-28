import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Flame,
  Clock,
  Sparkles,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ScoreCard from '../components/common/ScoreCard';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <LoadingState message="Loading your English learning dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const {
    scores = {},
    dailyGoalMinutes = 15,
    minutesPracticedToday = 0,
    streak = 0,
    recentMistakes = [],
    recommendedLesson,
    recentConversations = [],
  } = dashboardData || {};

  const levelDescriptions = {
    A1: 'Beginner — Basic phrases and simple sentences',
    A2: 'Elementary — Routine exchanges and everyday expressions',
    B1: 'Intermediate — Independent speaker on familiar topics',
    B2: 'Upper Intermediate — Clear, detailed speech with fluency',
    C1: 'Advanced — Fluent, flexible, and nuanced communication',
  };

  const currentLevel = user?.englishLevel || 'B1';

  return (
    <div className="space-y-8">
      {/* Top Banner: Personalized Greeting & Start Speaking CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Learner'} 👋
            </h1>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> {streak} day streak
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
            Ready for your daily practice? Talk with Dutt today to boost your confidence and reduce recurring grammar hesitation.
          </p>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={() => navigate('/speaking')}
          icon={Mic}
          className="flex-shrink-0 shadow-xl shadow-indigo-500/20 text-sm font-bold"
        >
          Start Speaking with Dutt
        </Button>
      </div>

      {/* Main Stats Grid: English Level + Skill Scores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Level Overview Card */}
        <Card hover className="md:col-span-4 lg:col-span-1 flex flex-col justify-between border-indigo-500/30 p-6">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <span>Your English Level</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px]">
                AI Calibrated
              </span>
            </div>
            <div className="my-2">
              <span className="text-4xl font-black text-white">{currentLevel}</span>
              <p className="text-xs font-semibold text-indigo-400 mt-0.5">
                {levelDescriptions[currentLevel]?.split('—')[0]}
              </p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              {levelDescriptions[currentLevel]?.split('—')[1] || 'Independent speaking practice'}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-400">Target Goal</span>
              <span className="font-bold text-white">{user?.targetLevel || 'C1'} Advanced</span>
            </div>
          </div>
        </Card>

        {/* 4 Skill Cards */}
        <div className="md:col-span-4 lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ScoreCard
            title="Speaking"
            score={scores.speaking || 72}
            color="indigo"
            subtitle="Fluency & flow"
            icon={Mic}
          />
          <ScoreCard
            title="Grammar"
            score={scores.grammar || 68}
            color="purple"
            subtitle="Accuracy"
            icon={Sparkles}
          />
          <ScoreCard
            title="Vocabulary"
            score={scores.vocabulary || 74}
            color="cyan"
            subtitle="Word choice"
            icon={BookOpen}
          />
          <ScoreCard
            title="Pronunciation"
            score={scores.pronunciation || 69}
            color="emerald"
            subtitle="Clarity & sound"
            icon={Volume2}
          />
        </div>
      </div>

      {/* Daily Goal & Activity Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> Today's Goal
            </span>
            <span className="text-xs font-semibold text-indigo-400">
              {minutesPracticedToday} / {dailyGoalMinutes} mins
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round((minutesPracticedToday / dailyGoalMinutes) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {minutesPracticedToday >= dailyGoalMinutes
                ? "🎉 You achieved today's speaking goal! Great job!"
                : `Just ${dailyGoalMinutes - minutesPracticedToday} more minutes to reach today's goal.`}
            </p>
          </div>
        </Card>

        {/* Recommended Lesson */}
        {recommendedLesson ? (
          <Card hover className="md:col-span-2 p-6 flex flex-col justify-between border-indigo-500/20">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Recommended Lesson
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {recommendedLesson.category || 'Grammar'}
                </span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                {recommendedLesson.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {recommendedLesson.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/speaking')}
                icon={ArrowRight}
              >
                Practice with Dutt
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="md:col-span-2 p-6 flex items-center justify-center">
            <p className="text-xs text-slate-400">No lessons to recommend right now.</p>
          </Card>
        )}
      </div>

      {/* Bottom Grid: Recent Grammar Mistakes & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Mistakes Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Focus Areas & Recent Mistakes</h3>
            </div>
            <button
              onClick={() => navigate('/mistakes')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentMistakes.length > 0 ? (
            <div className="space-y-3">
              {recentMistakes.map((group) => (
                <div
                  key={group.topic}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {group.displayName}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {group.count} {group.count === 1 ? 'mistake' : 'mistakes'}
                    </span>
                  </div>

                  {group.examples && group.examples[0] && (
                    <div className="text-xs space-y-1">
                      <p className="line-through text-rose-300 text-[11px]">
                        "{group.examples[0].original}"
                      </p>
                      <p className="text-emerald-300 font-medium text-[11px]">
                        ✓ "{group.examples[0].corrected}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No repeated mistakes yet!"
              description="Start a speaking session with Dutt. When you make a mistake, Dutt will analyze it gently here."
              actionLabel="Start Practice"
              onAction={() => navigate('/speaking')}
            />
          )}
        </Card>

        {/* Recent Conversations */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Recent Conversations</h3>
            </div>
            <button
              onClick={() => navigate('/speaking')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              New session <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentConversations.length > 0 ? (
            <div className="space-y-3">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate('/speaking')}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{conv.topic}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {conv.mode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {Math.max(1, Math.round(conv.durationSeconds / 60))} mins •{' '}
                      {conv._count?.messages || 0} messages •{' '}
                      {new Date(conv.startedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No conversations yet"
              description="Your conversation history will appear here once you talk with Dutt."
              actionLabel="Start First Conversation"
              onAction={() => navigate('/speaking')}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
