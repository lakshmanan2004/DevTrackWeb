import React from 'react';

interface ProgressBarProps {
  value?: number;
  progress?: number;
  tone?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  height?: 'sm' | 'md';
  label?: string;
}

const tones = {
  blue: 'bg-brand',
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-rose-500',
  purple: 'bg-purple-500'
};

export function ProgressBar({ value, progress, tone = 'blue', height = 'sm', label }: ProgressBarProps) {
  const numericVal = typeof value === 'number' ? value : typeof progress === 'number' ? progress : 0;
  const pct = Math.min(100, Math.max(0, numericVal));

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10 ${height === 'sm' ? 'h-1.5' : 'h-2.5'}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-out ${tones[tone] || tones.blue}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}