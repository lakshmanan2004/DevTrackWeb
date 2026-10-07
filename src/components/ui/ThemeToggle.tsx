import React from 'react';
import { SunIcon, MoonIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'pill' | 'button' | 'compact';
  className?: string;
}

export function ThemeToggle({ variant = 'pill', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme, isDark } = useTheme();

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/40 bg-white/60 text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-navy hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white cursor-pointer ${className}`}
        title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      >
        <div className="relative h-4 w-4">
          <SunIcon
            className={`absolute inset-0 h-4 w-4 text-amber-500 transition-all duration-300 ${
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
          <MoonIcon
            className={`absolute inset-0 h-4 w-4 text-blue-400 transition-all duration-300 ${
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </div>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`relative inline-flex items-center rounded-xl bg-slate-900/60 p-0.5 border border-white/15 backdrop-blur-md shadow-inner ${className}`}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            !isDark
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Light Theme"
          aria-pressed={!isDark}
        >
          <SunIcon className="h-3.5 w-3.5 text-amber-500" />
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-white/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Dark Theme"
          aria-pressed={isDark}
        >
          <MoonIcon className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    );
  }

  // Default 'pill' segmented switch
  return (
    <div
      className={`relative inline-flex items-center rounded-2xl bg-slate-200/60 p-1 border border-white/60 dark:bg-slate-900/70 dark:border-white/10 backdrop-blur-xl shadow-xs ${className}`}
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
          !isDark
            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
        aria-pressed={!isDark}
      >
        <SunIcon className={`h-3.5 w-3.5 ${!isDark ? 'text-amber-500' : 'text-slate-400'}`} />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
          isDark
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm ring-1 ring-white/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
        }`}
        aria-pressed={isDark}
      >
        <MoonIcon className={`h-3.5 w-3.5 ${isDark ? 'text-blue-200' : 'text-slate-500'}`} />
        <span>Dark</span>
      </button>
    </div>
  );
}
