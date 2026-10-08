import React, { useRef, useState, useCallback, useEffect } from 'react';
import { SunIcon, MoonIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'pill' | 'button' | 'compact';
  className?: string;
}

export function ThemeToggle({ variant = 'pill', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme, isDark } = useTheme();

  // Tab references & dynamic bubble geometry measurement
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [bubbleStyle, setBubbleStyle] = useState<{ left: number; top: number; width: number; height: number; opacity: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0
  });

  const activeIdx = theme === 'dark' ? 1 : 0;

  const updateBubblePosition = useCallback(() => {
    const activeEl = tabRefs.current[activeIdx];
    if (activeEl) {
      setBubbleStyle({
        left: activeEl.offsetLeft,
        top: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
        opacity: 1
      });
    }
  }, [activeIdx]);

  useEffect(() => {
    updateBubblePosition();
    // Use requestAnimationFrame to guarantee layout computation after render
    const rafId = requestAnimationFrame(updateBubblePosition);
    window.addEventListener('resize', updateBubblePosition);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateBubblePosition);
    };
  }, [updateBubblePosition]);

  // Single Icon Button Mode
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

  // Compact Icon-Only Segmented Control
  if (variant === 'compact') {
    return (
      <div
        className={`segmented-control-track inline-flex items-center gap-1 p-1 ${className}`}
        role="tablist"
        aria-label="Theme selection"
      >
        {/* Sliding Liquid Glass Bubble Indicator */}
        <div
          className="liquid-glass-bubble"
          style={{
            left: `${bubbleStyle.left}px`,
            top: `${bubbleStyle.top}px`,
            width: `${bubbleStyle.width}px`,
            height: `${bubbleStyle.height}px`,
            opacity: bubbleStyle.opacity
          }}
          aria-hidden="true"
        />

        <button
          ref={(el) => (tabRefs.current[0] = el)}
          type="button"
          role="tab"
          aria-selected={!isDark}
          onClick={() => setTheme('light')}
          className={`segmented-tab-btn flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold cursor-pointer select-none transition-all duration-300 ${
            !isDark
              ? 'text-amber-600 dark:text-amber-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Light Theme"
        >
          <SunIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${!isDark ? 'scale-110 text-amber-500' : 'text-slate-400'}`} />
        </button>

        <button
          ref={(el) => (tabRefs.current[1] = el)}
          type="button"
          role="tab"
          aria-selected={isDark}
          onClick={() => setTheme('dark')}
          className={`segmented-tab-btn flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold cursor-pointer select-none transition-all duration-300 ${
            isDark
              ? 'text-sky-300 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Dark Theme"
        >
          <MoonIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${isDark ? 'scale-110 text-blue-300' : 'text-slate-400'}`} />
        </button>
      </div>
    );
  }

  // Full Pill-Style Sliding Animated Segmented Control
  return (
    <div
      className={`segmented-control-track inline-flex items-center gap-1 p-1 ${className}`}
      role="tablist"
      aria-label="Theme selection"
    >
      {/* Sliding Liquid Glass Bubble Indicator with Spring Physics */}
      <div
        className="liquid-glass-bubble"
        style={{
          left: `${bubbleStyle.left}px`,
          top: `${bubbleStyle.top}px`,
          width: `${bubbleStyle.width}px`,
          height: `${bubbleStyle.height}px`,
          opacity: bubbleStyle.opacity
        }}
        aria-hidden="true"
      />

      {/* Light Option Tab */}
      <button
        ref={(el) => (tabRefs.current[0] = el)}
        type="button"
        role="tab"
        aria-selected={!isDark}
        onClick={() => setTheme('light')}
        className={`segmented-tab-btn flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold cursor-pointer select-none transition-all duration-300 ${
          !isDark
            ? 'text-[#0071e3] font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] scale-[1.02]'
            : 'text-slate-500 dark:text-slate-400 font-medium'
        }`}
      >
        <SunIcon
          className={`h-3.5 w-3.5 transition-transform duration-300 ${
            !isDark ? 'text-amber-500 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-slate-400'
          }`}
        />
        <span>Light</span>
      </button>

      {/* Dark Option Tab */}
      <button
        ref={(el) => (tabRefs.current[1] = el)}
        type="button"
        role="tab"
        aria-selected={isDark}
        onClick={() => setTheme('dark')}
        className={`segmented-tab-btn flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold cursor-pointer select-none transition-all duration-300 ${
          isDark
            ? 'text-white font-extrabold drop-shadow-[0_0_10px_rgba(56,189,248,0.7)] scale-[1.02]'
            : 'text-slate-500 dark:text-slate-400 font-medium'
        }`}
      >
        <MoonIcon
          className={`h-3.5 w-3.5 transition-transform duration-300 ${
            isDark ? 'text-sky-300 scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-slate-400'
          }`}
        />
        <span>Dark</span>
      </button>
    </div>
  );
}
