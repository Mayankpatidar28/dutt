import React, { useState } from 'react';
import {
  User,
  Shield,
  Volume2,
  CheckCircle2,
  Save,
  Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Settings() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user?.dailyGoalMinutes || 15);
  const [targetLevel, setTargetLevel] = useState(user?.targetLevel || 'C1');
  const [nativeLanguage, setNativeLanguage] = useState(user?.profile?.nativeLanguage || 'Hindi');
  const [learningGoal, setLearningGoal] = useState(user?.profile?.learningGoal || 'Job Interview');
  const [audioStorageAllowed, setAudioStorageAllowed] = useState(false);
  const [preferredAccent, setPreferredAccent] = useState('en-IN');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfile({
        name,
        dailyGoalMinutes,
        targetLevel,
        nativeLanguage,
        learningGoal,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
          Settings & Privacy
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your learning goals, voice preferences, and audio privacy.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Settings */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <User className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Profile & Learning Targets</h3>
          </div>

          <div className="space-y-4">
            <Input
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Daily Speaking Goal
                </label>
                <select
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value, 10))}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value={10}>10 minutes / day</option>
                  <option value={15}>15 minutes / day</option>
                  <option value={20}>20 minutes / day</option>
                  <option value={30}>30 minutes / day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target CEFR Level
                </label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="B1">B1 (Intermediate)</option>
                  <option value="B2">B2 (Upper Intermediate)</option>
                  <option value="C1">C1 (Advanced Professional)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Voice & Synthesis Settings */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Dutt Voice & Audio Engine</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Preferred Voice Accent
            </label>
            <select
              value={preferredAccent}
              onChange={(e) => setPreferredAccent(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="en-IN">Indian English (Natural & Familiar)</option>
              <option value="en-GB">British English (Clear & Standard)</option>
              <option value="en-US">American English (Conversational)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Dutt adapts speech cadence and pronunciation to international intelligibility.
            </p>
          </div>
        </Card>

        {/* Privacy Section */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Audio Privacy & Data Retention</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              We care deeply about your privacy. Raw microphone audio recordings are processed in real-time and are <strong>never permanently retained</strong> on servers without your explicit permission.
            </p>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="font-semibold text-white block">Strict Audio Privacy</span>
                <span className="text-[11px] text-slate-400">
                  Only transcripts and grammar analysis are stored for progress tracking.
                </span>
              </div>
              <span className="text-emerald-400 font-bold text-xs">Active</span>
            </div>
          </div>
        </Card>

        {/* Save CTA */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Preferences saved successfully
            </span>
          )}
          <div className="ml-auto">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={saving}
              icon={Save}
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
