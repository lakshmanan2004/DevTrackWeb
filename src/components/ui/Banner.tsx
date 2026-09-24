import React from 'react';

type Tone = 'blue' | 'yellow' | 'red' | 'green' | 'grey' | 'orange';

const tones: Record<Tone, string> = {
  blue: 'bg-brand-soft border-blue-100 text-blue-900',
  yellow: 'bg-warn-soft border-amber-200 text-amber-900',
  orange: 'bg-orange-50 border-orange-200 text-orange-900',
  red: 'bg-danger-soft border-red-200 text-red-900',
  green: 'bg-ok-soft border-green-200 text-green-900',
  grey: 'bg-gray-50 border-gray-200 text-gray-700'
};

const iconTones: Record<Tone, string> = {
  blue: 'text-brand',
  yellow: 'text-warn',
  orange: 'text-orange-500',
  red: 'text-danger',
  green: 'text-ok',
  grey: 'text-gray-500'
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
      className={`flex flex-wrap items-center gap-3 rounded-card border px-4 py-3 ${tones[tone]} ${className}`}>
      
      {icon && <span className={`shrink-0 ${iconTones[tone]}`}>{icon}</span>}
      <div className="min-w-[200px] flex-1 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>);

}