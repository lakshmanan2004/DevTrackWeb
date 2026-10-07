import React from 'react';

type Tone = 'blue' | 'yellow' | 'red' | 'green' | 'grey' | 'orange' | 'purple';

const tones: Record<Tone, string> = {
  blue: 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/25 dark:border-blue-500/40 text-blue-950 dark:text-blue-200 shadow-blue-500/5',
  yellow: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 dark:border-amber-500/40 text-amber-950 dark:text-amber-200 shadow-amber-500/5',
  orange: 'bg-orange-500/10 dark:bg-orange-500/15 border-orange-500/25 dark:border-orange-500/40 text-orange-950 dark:text-orange-200 shadow-orange-500/5',
  red: 'bg-red-500/10 dark:bg-red-500/15 border-red-500/25 dark:border-red-500/40 text-red-950 dark:text-red-200 shadow-red-500/5',
  green: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/25 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-200 shadow-emerald-500/5',
  purple: 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/25 dark:border-purple-500/40 text-purple-950 dark:text-purple-200 shadow-purple-500/5',
  grey: 'bg-slate-500/10 dark:bg-slate-500/15 border-slate-500/20 dark:border-slate-500/40 text-slate-800 dark:text-slate-200 shadow-slate-500/5'
};

const iconTones: Record<Tone, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  purple: 'text-purple-600 dark:text-purple-400',
  grey: 'text-slate-500 dark:text-slate-400'
};

interface BannerProps {
  tone?: Tone;
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function Banner({ tone = 'blue', icon, title, children, action, className = '' }: BannerProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3.5 rounded-2xl border p-4 backdrop-blur-xl shadow-xs transition-all ${tones[tone]} ${className}`}
    >
      {icon && <span className={`shrink-0 text-base ${iconTones[tone]}`}>{icon}</span>}
      <div className="min-w-[200px] flex-1 text-xs leading-relaxed">
        {title && <p className="font-extrabold tracking-tight text-navy dark:text-white">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}