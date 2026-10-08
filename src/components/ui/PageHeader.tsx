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
    <header className="glass-header sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-xs font-semibold text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {actions}
        {showThemeToggle && <ThemeToggle variant="button" />}
      </div>
    </header>
  );
}