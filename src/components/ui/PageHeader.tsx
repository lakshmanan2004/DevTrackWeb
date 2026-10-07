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
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-white/80 bg-white/70 dark:bg-slate-900/75 dark:border-white/10 px-6 py-4 backdrop-blur-2xl shadow-xs transition-colors">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-black tracking-tight text-navy dark:text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {actions}
        {showThemeToggle && <ThemeToggle variant="button" />}
      </div>
    </header>
  );
}