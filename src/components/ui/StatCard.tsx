import React from 'react';

type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'grey';

const valueTone: Record<Tone, string> = {
  blue: 'text-blue-600 dark:text-[#5AA9FF]',
  green: 'text-emerald-600 dark:text-emerald-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  red: 'text-rose-600 dark:text-rose-400',
  purple: 'text-purple-600 dark:text-purple-400',
  grey: 'text-navy dark:text-[#F5F5F5]'
};

const iconTone: Record<Tone, string> = {
  blue: 'bg-blue-500/10 dark:bg-[rgba(22,131,255,0.16)] text-blue-600 dark:text-[#5AA9FF] ring-1 ring-blue-500/20 dark:ring-[rgba(22,131,255,0.35)]',
  green: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
  yellow: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20',
  red: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20',
  purple: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20',
  grey: 'bg-slate-500/10 dark:bg-white/[0.08] text-slate-600 dark:text-[#A1A1AA] ring-1 ring-slate-500/20 dark:ring-white/10'
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
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">{label}</p>
        {icon && (
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-md shadow-2xs ${iconTone[tone]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-3 text-2xl font-black tracking-tight tabular-nums ${valueTone[tone]}`}>{value}</p>
      <p className="mt-auto pt-2 text-xs font-medium text-slate-400 dark:text-[#71717A]">{hint ?? '\u00a0'}</p>
    </div>
  );
}