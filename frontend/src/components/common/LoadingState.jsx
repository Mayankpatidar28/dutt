import React from 'react';

export default function LoadingState({
  message = 'Dutt is preparing your session...',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center select-none ${className}`}>
      <div className="relative w-14 h-14 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 opacity-80 blur-sm animate-pulse" />
      </div>
      <p className="text-sm font-medium text-slate-300 animate-pulse">{message}</p>
    </div>
  );
}
