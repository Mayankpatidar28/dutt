import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  Mic,
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export default function Progress() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const [sumRes, weekRes] = await Promise.all([
        api.getProgressSummary(),
        api.getWeeklyProgress(),
      ]);
      setSummary(sumRes);
      setWeeklyData(weekRes || []);
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your progress metrics..." />;
  }

  const hasData = summary?.hasData && summary?.sessionsCompleted > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
          Learning Progress & Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real metrics calculated from your actual speaking sessions and database history.
        </p>
      </div>

      {!hasData ? (
        <EmptyState
          icon={TrendingUp}
          title="No practice data yet."
          description="Your real scores, practice duration, and weekly trends will be plotted here after you complete your first conversation with Dutt."
          actionLabel="Start First Speaking Session"
          onAction={() => navigate('/speaking')}
        />
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card hover className="p-5 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Streak</span>
              <div className="flex items-center justify-center gap-1 my-2 text-3xl font-black text-amber-400">
                <Flame className="w-6 h-6 fill-amber-400" />
                <span>{summary.streak}</span>
              </div>
              <span className="text-[11px] text-slate-500">Consecutive days</span>
            </Card>

            <Card hover className="p-5 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Sessions</span>
              <div className="my-2 text-3xl font-black text-white">
                {summary.sessionsCompleted}
              </div>
              <span className="text-[11px] text-slate-500">Completed conversations</span>
            </Card>

            <Card hover className="p-5 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Time Practiced</span>
              <div className="my-2 text-3xl font-black text-indigo-400">
                {summary.totalMinutesPracticed}
              </div>
              <span className="text-[11px] text-slate-500">Minutes spoken</span>
            </Card>

            <Card hover className="p-5 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Current Level</span>
              <div className="my-2 text-3xl font-black text-emerald-400">
                {summary.englishLevel}
              </div>
              <span className="text-[11px] text-slate-500">Target: {summary.targetLevel}</span>
            </Card>
          </div>

          {/* Current Skill Breakdown */}
          {summary.currentScores && (
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Current CEFR Proficiency Breakdown
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Spoken Fluency', score: summary.currentScores.speaking, color: 'bg-indigo-500' },
                  { label: 'Grammar Accuracy', score: summary.currentScores.grammar, color: 'bg-purple-500' },
                  { label: 'Vocabulary Range', score: summary.currentScores.vocabulary, color: 'bg-cyan-500' },
                  { label: 'Pronunciation Clarity', score: summary.currentScores.pronunciation, color: 'bg-emerald-500' },
                ].map((s) => (
                  <div key={s.label} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">{s.label}</span>
                      <span className="font-bold text-white">{s.score}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Weekly Activity Chart Visual */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Recent Practice History
            </h3>

            {weeklyData.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-2 text-center text-xs pt-4">
                  {weeklyData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-900 rounded-xl p-2.5 border border-slate-800 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-indigo-400 font-bold">{d.overallScore}%</span>
                        <div
                          className="w-full bg-indigo-600 rounded-md"
                          style={{ height: `${Math.max(16, (d.minutesPracticed / 30) * 80)}px` }}
                        />
                        <span className="text-[10px] text-slate-400">{d.minutesPracticed}m</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No weekly entries recorded yet.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
