import React from 'react';

export default function Avatar({
  name = 'Learner',
  isDutt = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-lg font-bold',
  };

  if (isDutt) {
    return (
      <div
        className={`relative rounded-full flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40 select-none ${
          sizeClasses[size] || sizeClasses.md
        } ${className}`}
      >
        <span>✦</span>
      </div>
    );
  }

  const initials = (name || 'L')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`rounded-full flex items-center justify-center bg-slate-800 text-slate-200 border border-slate-700 select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
}
