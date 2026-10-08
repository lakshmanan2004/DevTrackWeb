import React from 'react';

type Tone = 'blue' | 'yellow' | 'red' | 'green' | 'grey' | 'orange' | 'purple';

const tones: Record<Tone, { container: string; icon: string; title: string; text: string }> = {
  blue: {
    container: 'bg-white/75 dark:bg-[#121d33]/85 border-blue-400/50 dark:border-blue-500/40 shadow-sm ring-1 ring-blue-500/15',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-950 dark:text-white',
    text: 'text-slate-800 dark:text-blue-100'
  },
  yellow: {
    container: 'bg-white/75 dark:bg-[#221c10]/85 border-amber-400/60 dark:border-amber-500/50 shadow-sm ring-1 ring-amber-500/20',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-950 dark:text-white',
    text: 'text-slate-800 dark:text-amber-100'
  },
  orange: {
    container: 'bg-white/75 dark:bg-[#261710]/85 border-orange-400/50 dark:border-orange-500/40 shadow-sm ring-1 ring-orange-500/15',
    icon: 'text-orange-600 dark:text-orange-400',
    title: 'text-orange-950 dark:text-white',
    text: 'text-slate-800 dark:text-orange-100'
  },
  red: {
    container: 'bg-white/75 dark:bg-[#261217]/85 border-rose-400/50 dark:border-rose-500/40 shadow-sm ring-1 ring-rose-500/15',
    icon: 'text-rose-600 dark:text-rose-400',
    title: 'text-rose-950 dark:text-white',
    text: 'text-slate-800 dark:text-rose-100'
  },
  green: {
    container: 'bg-white/75 dark:bg-[#10241b]/85 border-emerald-400/50 dark:border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/15',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-950 dark:text-white',
    text: 'text-slate-800 dark:text-emerald-100'
  },
  purple: {
    container: 'bg-white/75 dark:bg-[#20132f]/85 border-purple-400/50 dark:border-purple-500/40 shadow-sm ring-1 ring-purple-500/15',
    icon: 'text-purple-600 dark:text-purple-400',
    title: 'text-purple-950 dark:text-white',
    text: 'text-slate-800 dark:text-purple-100'
  },
  grey: {
    container: 'bg-white/75 dark:bg-[#131b2e]/85 border-slate-300 dark:border-slate-600/50 shadow-sm ring-1 ring-slate-200 dark:ring-white/5',
    icon: 'text-slate-600 dark:text-slate-300',
    title: 'text-slate-950 dark:text-white',
    text: 'text-slate-700 dark:text-slate-200'
  }
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
  const currentTone = tones[tone] || tones.blue;
  return (
    <div
      className={`flex flex-wrap items-center gap-3.5 rounded-2xl border p-4 backdrop-blur-2xl transition-all ${currentTone.container} ${className}`}
    >
      {icon && <span className={`shrink-0 text-base ${currentTone.icon}`}>{icon}</span>}
      <div className="min-w-[200px] flex-1 text-xs leading-relaxed">
        {title && <p className={`font-black tracking-tight ${currentTone.title}`}>{title}</p>}
        {children && <div className={`font-medium ${title ? 'mt-0.5' : ''} ${currentTone.text}`}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}