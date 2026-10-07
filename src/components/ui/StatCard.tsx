import React from 'react';

type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'grey';

const valueTone: Record<Tone, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  purple: 'text-purple-600 dark:text-purple-400',
  grey: 'text-navy dark:text-white'
};

const iconTone: Record<Tone, string> = {
  blue: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20',
  green: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
  yellow: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20',
  red: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 ring-1 ring-red-500/20',
  purple: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20',
  grey: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300 ring-1 ring-slate-500/20'
};

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, hint, tone = 'grey', icon }: StatCardProps) {
  return (
    <div className="glass-card-interactive flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        {icon && (
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-md shadow-2xs ${iconTone[tone]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-3 text-2xl font-black tracking-tight tabular-nums ${valueTone[tone]}`}>{value}</p>
      <p className="mt-auto pt-2 text-xs font-medium text-slate-400 dark:text-slate-500">{hint ?? '\u00a0'}</p>
    </div>
  );
}