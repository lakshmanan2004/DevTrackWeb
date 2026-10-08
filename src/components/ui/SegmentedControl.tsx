import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';

export interface SegmentedOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  fullWidth?: boolean;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  ariaLabel = 'Segmented options',
  fullWidth = false,
}: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [bubbleStyle, setBubbleStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const activeIndex = options.findIndex((opt) => opt.id === value);

  const updateBubblePosition = useCallback(() => {
    if (activeIndex === -1) {
      setBubbleStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const activeEl = tabRefs.current[activeIndex];
    const containerEl = containerRef.current;

    if (activeEl && containerEl) {
      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();

      setBubbleStyle({
        left: activeEl.offsetLeft,
        top: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
        opacity: 1,
      });
    }
  }, [activeIndex]);

  useLayoutEffect(() => {
    updateBubblePosition();
  }, [updateBubblePosition, value, options]);

  useEffect(() => {
    updateBubblePosition();
    const raf1 = requestAnimationFrame(updateBubblePosition);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(updateBubblePosition));
    const timer1 = setTimeout(updateBubblePosition, 50);
    const timer2 = setTimeout(updateBubblePosition, 150);
    const timer3 = setTimeout(updateBubblePosition, 300);

    window.addEventListener('resize', updateBubblePosition);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateBubblePosition();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', updateBubblePosition);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [updateBubblePosition]);

  const sizeClasses = {
    sm: 'px-3 py-1 text-[11px]',
    md: 'px-3.5 py-1.5 text-xs',
    lg: 'px-5 py-2 text-sm',
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`segmented-control-track relative inline-flex items-center gap-1 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {/* Sliding Apple Liquid Glass Bubble Indicator */}
      <div
        className="liquid-glass-bubble"
        style={{
          left: `${bubbleStyle.left}px`,
          top: `${bubbleStyle.top}px`,
          width: `${bubbleStyle.width}px`,
          height: `${bubbleStyle.height}px`,
          opacity: bubbleStyle.opacity,
        }}
        aria-hidden="true"
      />

      {options.map((option, idx) => {
        const isSelected = option.id === value;
        return (
          <button
            key={option.id}
            ref={(el) => (tabRefs.current[idx] = el)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.id)}
            className={`segmented-tab-btn relative z-[2] inline-flex items-center justify-center gap-1.5 rounded-full font-bold cursor-pointer select-none transition-all duration-300 ${
              fullWidth ? 'flex-1' : ''
            } ${sizeClasses[size]} ${
              isSelected
                ? 'text-[#0071e3] dark:text-white font-black scale-[1.02] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold'
            }`}
          >
            {option.icon && (
              <span
                className={`shrink-0 transition-transform duration-300 ${
                  isSelected
                    ? 'text-[#0071e3] dark:text-sky-300 scale-110'
                    : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums transition-colors ${
                  isSelected
                    ? 'bg-[#0071e3]/15 text-[#0071e3] dark:bg-sky-400/25 dark:text-sky-200'
                    : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
