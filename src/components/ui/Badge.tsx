import React from 'react';

export type BadgeTone = 'blue' | 'green' | 'yellow' | 'amber' | 'red' | 'grey' | 'purple';

const tones: Record<BadgeTone, string> = {
  blue: 'bg-brand-soft text-brand border-blue-100',
  green: 'bg-ok-soft text-green-700 border-green-100',
  yellow: 'bg-warn-soft text-amber-700 border-amber-100',
  amber: 'bg-amber-100 text-amber-900 border-amber-200',
  red: 'bg-danger-soft text-red-700 border-red-100',
  grey: 'bg-offline-soft text-gray-600 border-gray-200',
  purple: 'bg-pm-soft text-pm border-violet-100'
};

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, tone = 'grey', dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>);

}