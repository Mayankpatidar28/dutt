import React from 'react';
import { motion } from 'framer-motion';

/**
 * Flagship VoiceOrb Component
 * States: IDLE | LISTENING | PROCESSING | SPEAKING | ERROR
 */
export default function VoiceOrb({
  state = 'IDLE', // 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR'
  size = 'md', // 'sm' | 'md' | 'lg'
  onClick,
}) {
  const sizeMap = {
    sm: { container: 'w-24 h-24', orb: 'w-16 h-16', ring: 'w-24 h-24' },
    md: { container: 'w-48 h-48', orb: 'w-32 h-32', ring: 'w-48 h-48' },
    lg: { container: 'w-64 h-64', orb: 'w-44 h-44', ring: 'w-64 h-64' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Background gradient and glow colors based on state
  const stateThemes = {
    IDLE: {
      gradient: 'from-indigo-600 via-purple-600 to-indigo-800',
      ringColor: 'rgba(99, 102, 241, 0.25)',
      glowColor: 'rgba(99, 102, 241, 0.45)',
      label: 'Tap the microphone to speak',
    },
    LISTENING: {
      gradient: 'from-cyan-500 via-indigo-500 to-emerald-500',
      ringColor: 'rgba(6, 182, 212, 0.4)',
      glowColor: 'rgba(6, 182, 212, 0.6)',
      label: 'Listening...',
    },
    PROCESSING: {
      gradient: 'from-purple-600 via-pink-600 to-indigo-700',
      ringColor: 'rgba(236, 72, 153, 0.35)',
      glowColor: 'rgba(168, 85, 247, 0.55)',
      label: 'Dutt is thinking...',
    },
    SPEAKING: {
      gradient: 'from-emerald-400 via-teal-500 to-indigo-600',
      ringColor: 'rgba(16, 185, 129, 0.4)',
      glowColor: 'rgba(16, 185, 129, 0.65)',
      label: 'Dutt is speaking...',
    },
    ERROR: {
      gradient: 'from-rose-600 via-red-500 to-amber-600',
      ringColor: 'rgba(239, 68, 68, 0.35)',
      glowColor: 'rgba(239, 68, 68, 0.55)',
      label: 'Attention needed',
    },
  };

  const theme = stateThemes[state] || stateThemes.IDLE;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center cursor-pointer select-none group ${currentSize.container}`}
    >
      {/* Outer Pulse / Rotating Glow Ring */}
      {state === 'PROCESSING' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className={`absolute rounded-full border-2 border-dashed border-purple-400/50 ${currentSize.ring}`}
        />
      )}

      {state === 'LISTENING' && (
        <>
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute rounded-full bg-cyan-500/20 blur-md ${currentSize.ring}`}
          />
          <motion.div
            animate={{ scale: [1, 1.45, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className={`absolute rounded-full border border-cyan-400/40 ${currentSize.ring}`}
          />
        </>
      )}

      {state === 'SPEAKING' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.3, 0.7] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute rounded-full bg-emerald-500/25 blur-xl ${currentSize.ring}`}
        />
      )}

      {/* Main Glowing Sphere */}
      <motion.div
        animate={
          state === 'IDLE'
            ? { y: [0, -8, 0], scale: [1, 1.02, 1] }
            : state === 'LISTENING'
            ? { scale: [1, 1.12, 1] }
            : state === 'PROCESSING'
            ? { scale: [0.98, 1.03, 0.98] }
            : state === 'SPEAKING'
            ? { scale: [1, 1.08, 0.98, 1.06, 1] }
            : { x: [-3, 3, -3, 3, 0] }
        }
        transition={{
          duration: state === 'IDLE' ? 3.5 : state === 'SPEAKING' ? 1.4 : 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          boxShadow: `0 0 45px 5px ${theme.glowColor}, inset 0 0 25px rgba(255, 255, 255, 0.35)`,
        }}
        className={`relative rounded-full bg-gradient-to-tr ${theme.gradient} flex items-center justify-center overflow-hidden transition-all duration-500 ${currentSize.orb}`}
      >
        {/* Internal light reflection highlights */}
        <div className="absolute top-2 left-3 w-8 h-8 rounded-full bg-white/30 blur-sm pointer-events-none" />
        <div className="absolute -bottom-4 right-2 w-12 h-12 rounded-full bg-black/20 blur-md pointer-events-none" />

        {/* Dynamic Center Visual: Waveform for speaking/listening, dots for processing, or smiling glyph for idle */}
        <div className="relative z-10 flex items-center justify-center text-white">
          {state === 'LISTENING' && (
            <div className="flex items-center gap-1">
              {[0.4, 0.8, 1.2, 0.7, 0.3].map((delay, idx) => (
                <motion.span
                  key={idx}
                  animate={{ height: ['8px', '28px', '8px'] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: delay * 0.2 }}
                  className="w-1 bg-white rounded-full"
                />
              ))}
            </div>
          )}

          {state === 'SPEAKING' && (
            <div className="flex items-center gap-1.5">
              {[0.2, 0.6, 1.0, 0.5].map((delay, idx) => (
                <motion.span
                  key={idx}
                  animate={{ height: ['10px', '32px', '12px'] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: delay * 0.15 }}
                  className="w-1.5 bg-white/95 rounded-full"
                />
              ))}
            </div>
          )}

          {state === 'PROCESSING' && (
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2.5 h-2.5 bg-white rounded-full"
                />
              ))}
            </div>
          )}

          {state === 'IDLE' && (
            <div className="text-white/90 text-2xl font-bold tracking-wider">
              ✦
            </div>
          )}

          {state === 'ERROR' && (
            <div className="text-white text-2xl font-black">
              !
            </div>
          )}
        </div>
      </motion.div>

      {/* State label badge */}
      <span className="mt-3 text-xs font-medium tracking-wide text-slate-400 group-hover:text-slate-200 transition-colors">
        {theme.label}
      </span>
    </div>
  );
}
