import React from 'react';
import { ThemeToggle } from './ThemeToggle';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showThemeToggle?: boolean;
}

export function PageHeader({ title, subtitle, actions, showThemeToggle = false }: PageHeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: '68px',
        minHeight: '68px',
        maxHeight: '68px',
        width: '100%',
        boxSizing: 'border-box',
        flexShrink: 0
      }}
      className="glass-header sticky top-0 z-40 flex h-[68px] w-full shrink-0 items-center justify-between gap-4 px-6 select-none"
    >
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {actions}
        {showThemeToggle && <ThemeToggle variant="button" />}
      </div>
    </header>
  );
}