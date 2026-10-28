import React from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = true,
  color = 'indigo', // 'indigo' | 'emerald' | 'cyan' | 'purple' | 'amber'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorGradients = {
    indigo: 'from-indigo-500 to-purple-600',
    emerald: 'from-emerald-400 to-teal-500',
    cyan: 'from-cyan-400 to-blue-500',
    purple: 'from-purple-500 to-pink-500',
    amber: 'from-amber-400 to-orange-500',
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
          {label && <span className="font-medium text-slate-300">{label}</span>}
          {showValue && <span className="font-semibold text-slate-200">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 ${heightClasses[size] || heightClasses.md}`}>
        <div
          className={`h-full bg-gradient-to-r ${colorGradients[color] || colorGradients.indigo} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
