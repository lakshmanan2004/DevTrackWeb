import React from 'react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}

export function FilterPills({ options, value, onChange, ariaLabel }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              selected
                ? 'btn-glass-primary !text-white border-transparent scale-[1.02]'
                : 'border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-navy dark:hover:text-white shadow-glass'
            }`}
          >
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                  selected
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10'
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