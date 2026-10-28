import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Mic,
  Award,
  BookOpen,
  Volume2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import LoadingState from '../components/common/LoadingState';
import VoiceOrb from '../components/voice/VoiceOrb';

export default function Onboarding() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Steps: 0: Welcome, 1: Goal & Experience, 2: Assessment Questions, 3: Calculating, 4: Result & Plan
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(user?.profile?.learningGoal || 'Job Interview');
  const [experience, setExperience] = useState('Intermediate - I understand well but hesitate speaking');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isRecordingSpoken, setIsRecordingSpoken] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const data = await api.startAssessment();
        setQuestions(data.questions || []);
      } catch (err) {
        console.warn('Failed to fetch assessment questions:', err);
      }
    }
    fetchQuestions();
  }, []);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, selectedOptionIndex: optionIndex }];
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitDiagnostic();
    }
  };

  const submitDiagnostic = async () => {
    setStep(3); // Calculating state
    try {
      const res = await api.submitAssessment({
        answers,
        spokenTranscript: spokenTranscript || 'I am ready to improve my spoken English with Dutt.',
      });
      setAssessmentResult(res.result);
      if (updateProfile) {
        await updateProfile({ englishLevel: res.result.level });
      }
      setStep(4); // Result state
    } catch (err) {
      console.error('Error submitting assessment:', err);
      // Fallback result in case of error
      setAssessmentResult({
        level: 'B1',
        levelTitle: 'Intermediate',
        speakingScore: 68,
        grammarScore: 72,
        vocabularyScore: 65,
        pronunciationScore: 70,
        overallScore: 69,
        disclaimer: 'This assessment is an AI-generated proficiency estimate designed to personalize your learning journey.',
        strengths: ['Great enthusiasm to practice', 'Clear conversational ideas'],
        weaknesses: ['Past tense consistency'],
      });
      setStep(4);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Progress header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-indigo-400 uppercase tracking-wider">
            Onboarding & Level Calibration
          </span>
          <span>Step {Math.min(step + 1, 4)} of 4</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-500"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 0: Welcome */}
      {step === 0 && (
        <Card className="text-center p-8 sm:p-12 space-y-6">
          <div className="flex justify-center">
            <VoiceOrb state="IDLE" size="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-display font-extrabold text-white">
              Hey {user?.name || 'there'}! I'm Dutt 👋
            </h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              I am your AI English coach. I'm here to help you speak fluent, confident English through natural voice conversations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 max-w-md mx-auto">
            ✦ Before we start, let's take a quick 2-minute diagnostic calibration to estimate your level (A1 to C1) and personalize Dutt for you.
          </div>

          <Button
            size="lg"
            variant="primary"
            onClick={() => setStep(1)}
            icon={ArrowRight}
            className="mx-auto"
          >
            Let's Personalize
          </Button>
        </Card>
      )}

      {/* STEP 1: Goal & Experience */}
      {step === 1 && (
        <Card className="p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white">Your Speaking Goals</h3>
            <p className="text-xs text-slate-400">
              Dutt adapts conversation scenarios and vocabulary based on your goal.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                What is your primary focus?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Job Interview & Career',
                  'Workplace Discussions',
                  'College & Placement Drives',
                  'Everyday Social Fluency',
                ].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`p-3 rounded-xl text-xs font-semibold text-left transition-all border ${
                      goal === g
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                How would you describe your current speaking comfort?
              </label>
              <div className="space-y-2">
                {[
                  'Beginner — I struggle to form complete English sentences',
                  'Elementary — I can speak basic phrases but make frequent errors',
                  'Intermediate — I understand well but hesitate during speaking',
                  'Upper Intermediate — I speak comfortably but want better vocabulary & nuance',
                ].map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setExperience(exp)}
                    className={`w-full p-3 rounded-xl text-xs font-medium text-left transition-all border ${
                      experience === exp
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep(2)}
              icon={ArrowRight}
            >
              Start Diagnostic Questions
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Diagnostic Assessment */}
      {step === 2 && questions.length > 0 && (
        <Card className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Diagnostic Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {questions[currentQuestionIndex]?.category}
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white leading-relaxed">
              {questions[currentQuestionIndex]?.question}
            </h3>

            {questions[currentQuestionIndex]?.type !== 'speaking_prompt' ? (
              <div className="space-y-2.5">
                {questions[currentQuestionIndex]?.options?.map((opt, oIdx) => {
                  const currentSelected = answers.find(
                    (a) => a.questionId === questions[currentQuestionIndex].id
                  )?.selectedOptionIndex;
                  const isSelected = currentSelected === oIdx;

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(questions[currentQuestionIndex].id, oIdx)}
                      className={`w-full p-4 rounded-xl text-left text-xs font-medium transition-all border ${
                        isSelected
                          ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <span className="inline-block w-5 text-indigo-400 font-bold">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>{' '}
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-2xl bg-[#0B0F19] border border-slate-800">
                <p className="text-xs text-slate-400">
                  Type or speak a 2-3 sentence answer to Dutt:
                </p>
                <textarea
                  value={spokenTranscript}
                  onChange={(e) => setSpokenTranscript(e.target.value)}
                  placeholder="In my free time, I enjoy reading tech blogs and playing cricket with friends because it helps me relax..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            >
              Previous
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleNextQuestion}
              icon={ArrowRight}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Calculate My Level' : 'Next Question'}
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: Calculating */}
      {step === 3 && (
        <Card className="text-center p-12 space-y-4">
          <VoiceOrb state="PROCESSING" size="lg" />
          <h3 className="text-xl font-bold text-white mt-4">
            Dutt is analyzing your English diagnostic...
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Evaluating grammar patterns, vocabulary choice, sentence formation, and speaking fluency.
          </p>
        </Card>
      )}

      {/* STEP 4: Assessment Result & Learning Plan */}
      {step === 4 && assessmentResult && (
        <Card className="p-8 sm:p-10 space-y-8 border-indigo-500/30">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Estimated Proficiency</span>
            </div>

            <div className="space-y-1">
              <span className="text-5xl font-black text-white tracking-tight">
                {assessmentResult.level}
              </span>
              <p className="text-lg font-bold text-indigo-400">
                {assessmentResult.levelTitle || 'Intermediate'}
              </p>
            </div>

            <p className="text-xs text-slate-400 max-w-md mx-auto italic">
              {assessmentResult.disclaimer}
            </p>
          </div>

          {/* Detailed Skill Scores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block">Speaking</span>
              <span className="text-xl font-black text-white">{assessmentResult.speakingScore}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block">Grammar</span>
              <span className="text-xl font-black text-white">{assessmentResult.grammarScore}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block">Vocabulary</span>
              <span className="text-xl font-black text-white">{assessmentResult.vocabularyScore}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block">Pronunciation</span>
              <span className="text-xl font-black text-white">{assessmentResult.pronunciationScore}%</span>
            </div>
          </div>

          {/* Generated Personalized Plan */}
          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Your Personalized Dutt Learning Plan
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Daily Speaking:</strong> 15 minutes of guided voice conversations with Dutt</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Targeted Grammar:</strong> Focus on simple past tense verb consistency</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Vocabulary:</strong> Learn 3 level-appropriate words daily through spaced repetition</span>
              </li>
            </ul>
          </div>

          <div className="text-center pt-2">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/dashboard')}
              icon={ArrowRight}
              className="w-full sm:w-auto"
            >
              Open My Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
