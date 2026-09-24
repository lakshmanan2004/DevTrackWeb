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
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out ${
            selected ?
            'border-brand bg-brand text-white' :
            'border-hairline bg-white text-gray-600 hover:bg-gray-50'}`
            }>
            
            {option.label}
            {typeof option.count === 'number' &&
            <span
              className={`rounded px-1 tabular-nums ${
              selected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`
              }>
              
                {option.count}
              </span>
            }
          </button>);

      })}
    </div>);

}