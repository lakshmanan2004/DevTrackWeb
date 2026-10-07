import React from 'react';

export type BadgeTone = 'blue' | 'green' | 'yellow' | 'amber' | 'red' | 'grey' | 'purple';

const tones: Record<BadgeTone, { bg: string; dot: string }> = {
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/40 shadow-blue-500/5',
    dot: 'bg-blue-500 ring-2 ring-blue-400/40'
  },
  green: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/40 shadow-emerald-500/5',
    dot: 'bg-emerald-500 ring-2 ring-emerald-400/40'
  },
  yellow: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/40 shadow-amber-500/5',
    dot: 'bg-amber-500 ring-2 ring-amber-400/40'
  },
  amber: {
    bg: 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-500/30 dark:border-amber-500/40 shadow-amber-500/10',
    dot: 'bg-amber-600 ring-2 ring-amber-400/50'
  },
  red: {
    bg: 'bg-red-500/10 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/20 dark:border-red-500/40 shadow-red-500/5',
    dot: 'bg-red-500 ring-2 ring-red-400/40'
  },
  grey: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/20 dark:border-slate-500/40 shadow-slate-500/5',
    dot: 'bg-slate-500 ring-2 ring-slate-400/40'
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-500/20 dark:border-purple-500/40 shadow-purple-500/5',
    dot: 'bg-purple-500 ring-2 ring-purple-400/40'
  }
};

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, tone = 'grey', dot = false, className = '' }: BadgeProps) {
  const currentTone = tones[tone] || tones.grey;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold backdrop-blur-md shadow-2xs transition-all ${
        currentTone.bg
      } ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${currentTone.dot}`} aria-hidden="true" />}
      {children}
    </span>
  );
}