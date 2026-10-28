import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import Button from '../common/Button';

export default function CorrectionCard({
  correction,
  onTryAgain,
  className = '',
}) {
  if (!correction || !correction.original) return null;

  const topicName = (correction.topic || 'Grammar')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <div className={`p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg text-slate-100 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Gentle Tip from Dutt
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {topicName}
        </span>
      </div>

      <div className="space-y-2 mb-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px] mb-0.5">You said:</span>
          <p className="line-through text-rose-300 font-mono bg-rose-950/30 px-2.5 py-1.5 rounded-lg border border-rose-900/40">
            "{correction.original}"
          </p>
        </div>

        <div className="flex items-center justify-center my-1 text-slate-500">
          <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
        </div>

        <div>
          <span className="text-emerald-400 block text-[11px] mb-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> A better sentence is:
          </span>
          <p className="text-emerald-200 font-semibold bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-900/40">
            "{correction.corrected}"
          </p>
        </div>
      </div>

      {correction.explanation && (
        <div className="mb-3 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 font-medium block mb-0.5">Why?</span>
          {correction.explanation}
        </div>
      )}

      {onTryAgain && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onTryAgain(correction.corrected)}
            icon={RotateCcw}
            className="text-xs"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
