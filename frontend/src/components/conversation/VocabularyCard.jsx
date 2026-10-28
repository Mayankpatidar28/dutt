import React from 'react';
import { BookOpen, Volume2 } from 'lucide-react';

export default function VocabularyCard({
  vocab,
  onPronounce,
  className = '',
}) {
  if (!vocab || !vocab.word) return null;

  return (
    <div className={`p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold text-white capitalize">{vocab.word}</h4>
        </div>
        <div className="flex items-center gap-2">
          {vocab.difficulty && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {vocab.difficulty}
            </span>
          )}
          {onPronounce && (
            <button
              onClick={() => onPronounce(vocab.word)}
              title="Listen to pronunciation"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-indigo-500/20 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-2 leading-relaxed">
        {vocab.meaning}
      </p>

      {vocab.exampleSentence && (
        <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          "{vocab.exampleSentence}"
        </div>
      )}
    </div>
  );
}
