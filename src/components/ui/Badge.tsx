import React from 'react';

export type BadgeTone = 'blue' | 'green' | 'yellow' | 'amber' | 'red' | 'grey' | 'purple';

const tones: Record<BadgeTone, { bg: string; dot: string }> = {
  blue: {
    bg: 'bg-blue-50/90 dark:bg-[rgba(22,131,255,0.16)] text-blue-950 dark:text-[#5AA9FF] border-blue-300 dark:border-[rgba(22,131,255,0.35)] shadow-xs ring-1 ring-blue-500/15',
    dot: 'bg-blue-600 ring-2 ring-blue-400/40'
  },
  green: {
    bg: 'bg-emerald-50/90 dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 shadow-xs ring-1 ring-emerald-500/15',
    dot: 'bg-emerald-600 ring-2 ring-emerald-400/40'
  },
  yellow: {
    bg: 'bg-amber-50/90 dark:bg-amber-500/15 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-500/30 shadow-xs ring-1 ring-amber-500/20',
    dot: 'bg-amber-600 ring-2 ring-amber-400/40'
  },
  amber: {
    bg: 'bg-amber-50/95 dark:bg-amber-500/15 text-amber-950 dark:text-amber-300 border-amber-400 dark:border-amber-500/30 shadow-xs ring-1 ring-amber-500/25',
    dot: 'bg-amber-600 ring-2 ring-amber-400/50'
  },
  red: {
    bg: 'bg-rose-50/90 dark:bg-rose-500/15 text-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-500/30 shadow-xs ring-1 ring-rose-500/15',
    dot: 'bg-rose-600 ring-2 ring-red-400/40'
  },
  grey: {
    bg: 'bg-slate-100/90 dark:bg-white/[0.07] text-slate-800 dark:text-[#A1A1AA] border-slate-300 dark:border-white/10 shadow-xs ring-1 ring-slate-200 dark:ring-white/5',
    dot: 'bg-slate-500 ring-2 ring-slate-400/40'
  },
  purple: {
    bg: 'bg-purple-50/90 dark:bg-purple-500/15 text-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-500/30 shadow-xs ring-1 ring-purple-500/15',
    dot: 'bg-purple-600 ring-2 ring-purple-400/40'
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