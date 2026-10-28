import React from 'react';
import Card from './Card';

export default function ScoreCard({
  title,
  score = 0,
  icon: Icon,
  color = 'indigo',
  subtitle,
  className = '',
}) {
  const colorMap = {
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      bar: 'bg-indigo-500',
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      bar: 'bg-emerald-500',
    },
    cyan: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      bar: 'bg-cyan-500',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      bar: 'bg-purple-500',
    },
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <Card hover className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl ${currentTheme.bg} ${currentTheme.text} border ${currentTheme.border}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="my-3">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-white">{score}%</span>
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full ${currentTheme.bar} rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </Card>
  );
}
