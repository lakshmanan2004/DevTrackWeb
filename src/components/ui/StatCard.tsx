import React from 'react';

type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'grey';

const valueTone: Record<Tone, string> = {
  blue: 'text-brand',
  green: 'text-green-600',
  yellow: 'text-amber-600',
  red: 'text-danger',
  purple: 'text-pm',
  grey: 'text-navy'
};

const iconTone: Record<Tone, string> = {
  blue: 'bg-brand-soft text-brand',
  green: 'bg-ok-soft text-green-600',
  yellow: 'bg-warn-soft text-amber-600',
  red: 'bg-danger-soft text-danger',
  purple: 'bg-pm-soft text-pm',
  grey: 'bg-offline-soft text-gray-500'
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
    <div className="flex h-full flex-col rounded-card border border-hairline bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        {icon &&
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${iconTone[tone]}`}>
            {icon}
          </span>
        }
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueTone[tone]}`}>{value}</p>
      <p className="mt-auto pt-1 text-xs text-gray-500">{hint ?? '\u00a0'}</p>
    </div>);

}