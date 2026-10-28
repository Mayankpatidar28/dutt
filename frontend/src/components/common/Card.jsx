import React from 'react';

export default function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'p-6',
  ...props
}) {
  return (
    <div
      className={`rounded-2xl bg-[#111827]/80 backdrop-blur-xl border border-slate-800/80 shadow-xl ${
        hover ? 'transition-all duration-300 hover:border-indigo-500/30 hover:shadow-indigo-500/10 hover:-translate-y-0.5' : ''
      } ${glow ? 'shadow-indigo-500/10 border-indigo-500/20' : ''} ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
