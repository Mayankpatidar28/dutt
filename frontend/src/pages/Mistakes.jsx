import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export default function Mistakes() {
  const navigate = useNavigate();
  const [mistakeGroups, setMistakeGroups] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMistakes = async () => {
    setLoading(true);
    try {
      const data = await api.getMistakes();
      setMistakeGroups(data || []);
      if (data && data.length > 0) {
        setExpandedTopic(data[0].topic);
      }
    } catch (err) {
      console.error('Failed to load mistakes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your mistake patterns..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
          Grammar Mistakes & Patterns
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Dutt tracks your recurring grammatical hesitation patterns so you can systematically eliminate them.
        </p>
      </div>

      {mistakeGroups.length > 0 ? (
        <div className="space-y-4">
          {mistakeGroups.map((group) => {
            const isExpanded = expandedTopic === group.topic;

            return (
              <Card key={group.topic} className="p-6 transition-all duration-300">
                {/* Header Row */}
                <div
                  onClick={() => setExpandedTopic(isExpanded ? null : group.topic)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {group.displayName}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {group.count} {group.count === 1 ? 'occurrence recorded' : 'occurrences recorded'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/speaking?mode=DAILY_PRACTICE&topic=${encodeURIComponent(group.displayName)}`);
                      }}
                      icon={ArrowRight}
                    >
                      Practice {group.displayName}
                    </Button>

                    <button className="text-slate-400 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details & Examples */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Recent Instances in Your Spoken Conversations
                    </h4>

                    <div className="space-y-3">
                      {group.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-2 text-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-slate-500 text-[10px] uppercase font-semibold">You said:</span>
                              <p className="line-through text-rose-300 font-medium">"{ex.original}"</p>
                            </div>
                            <div>
                              <span className="text-emerald-400 text-[10px] uppercase font-semibold">Correct phrasing:</span>
                              <p className="text-emerald-300 font-bold">"{ex.corrected}"</p>
                            </div>
                          </div>

                          {ex.explanation && (
                            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                              <span className="text-slate-300 font-semibold">Dutt's Explanation:</span> {ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No repeated mistakes yet!"
          description="Great job! As you talk with Dutt, any recurring grammar errors will be categorized here with clear explanations and targeted practice drills."
          actionLabel="Start Speaking Session"
          onAction={() => navigate('/speaking')}
        />
      )}
    </div>
  );
}
