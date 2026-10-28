import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export default function Vocabulary() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'NEW' | 'LEARNING' | 'MASTERED' | 'REVIEW_TODAY'
  const [vocabularyData, setVocabularyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Flashcard review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  const fetchVocabulary = async () => {
    setLoading(true);
    try {
      const data = await api.getVocabulary();
      setVocabularyData(data);
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabulary();
  }, []);

  const handleReviewWord = async (userVocabId, remembered) => {
    try {
      await api.reviewVocabulary(userVocabId, remembered);
      // Move to next card in review modal or close if finished
      const reviewList = vocabularyData?.lists?.reviewToday || [];
      if (reviewIndex < reviewList.length - 1) {
        setReviewIndex(reviewIndex + 1);
        setCardFlipped(false);
      } else {
        setReviewModalOpen(false);
        fetchVocabulary();
      }
    } catch (err) {
      console.error('Failed to review word:', err);
    }
  };

  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-IN';
      window.speechSynthesis.speak(u);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your vocabulary deck..." />;
  }

  const counts = vocabularyData?.counts || { total: 0, new: 0, learning: 0, mastered: 0, reviewToday: 0 };
  const lists = vocabularyData?.lists || { new: [], learning: [], mastered: [], reviewToday: [] };

  let displayedWords = vocabularyData?.all || [];
  if (activeTab === 'NEW') displayedWords = lists.new;
  else if (activeTab === 'LEARNING') displayedWords = lists.learning;
  else if (activeTab === 'MASTERED') displayedWords = lists.mastered;
  else if (activeTab === 'REVIEW_TODAY') displayedWords = lists.reviewToday;

  const currentReviewItem = lists.reviewToday[reviewIndex];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            Vocabulary Mastery
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Words extracted naturally from your voice conversations with Dutt.
          </p>
        </div>

        {counts.reviewToday > 0 && (
          <Button
            size="md"
            variant="primary"
            onClick={() => {
              setReviewIndex(0);
              setCardFlipped(false);
              setReviewModalOpen(true);
            }}
            icon={Layers}
          >
            Review Today ({counts.reviewToday})
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { key: 'ALL', label: 'All Words', count: counts.total },
          { key: 'REVIEW_TODAY', label: 'Review Today', count: counts.reviewToday, highlight: counts.reviewToday > 0 },
          { key: 'NEW', label: 'New', count: counts.new },
          { key: 'LEARNING', label: 'Learning', count: counts.learning },
          { key: 'MASTERED', label: 'Mastered', count: counts.mastered },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.key ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Word Cards Grid */}
      {displayedWords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedWords.map((item) => (
            <Card key={item.id} hover className="p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white capitalize">{item.word}</h3>
                    <button
                      onClick={() => speakWord(item.word)}
                      title="Pronounce word"
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'MASTERED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : item.status === 'LEARNING'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{item.meaning}</p>
              </div>

              {item.exampleSentence && (
                <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  "{item.exampleSentence}"
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Mastery: {item.masteryScore}%</span>
                <span>Level {item.difficulty || 'B1'}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No words in this category"
          description="Speak with Dutt in any conversation mode. Dutt will automatically identify and collect high-value vocabulary for you."
          actionLabel="Start Speaking Session"
          onAction={() => navigate('/speaking')}
        />
      )}

      {/* Spaced Repetition Review Flashcard Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Reviewing Spaced Repetition Card ${reviewIndex + 1} of ${lists.reviewToday.length}`}
      >
        {currentReviewItem ? (
          <div className="space-y-6 text-center py-4">
            <div
              onClick={() => setCardFlipped(!cardFlipped)}
              className="p-8 rounded-2xl bg-[#0B0F19] border border-indigo-500/30 cursor-pointer min-h-[180px] flex flex-col items-center justify-center space-y-3 transition-transform hover:scale-[1.01]"
            >
              {!cardFlipped ? (
                <>
                  <span className="text-3xl font-display font-extrabold text-white capitalize">
                    {currentReviewItem.word}
                  </span>
                  <p className="text-xs text-indigo-400 font-semibold">
                    Tap to reveal meaning & example sentence
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-200">
                    {currentReviewItem.meaning}
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    "{currentReviewItem.exampleSentence}"
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="danger"
                size="md"
                onClick={() => handleReviewWord(currentReviewItem.id, false)}
                icon={ThumbsDown}
              >
                Needs Practice
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleReviewWord(currentReviewItem.id, true)}
                icon={ThumbsUp}
              >
                Remembered!
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">All done for today!</p>
        )}
      </Modal>
    </div>
  );
}
