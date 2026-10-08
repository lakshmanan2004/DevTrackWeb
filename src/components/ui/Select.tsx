import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, CheckIcon, SearchIcon } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  tone?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'grey';
}

interface SelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  align?: 'left' | 'right';
  searchable?: boolean;
  minMenuWidth?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  icon,
  disabled = false,
  className = '',
  size = 'md',
  fullWidth = true,
  align = 'left',
  searchable = false,
  minMenuWidth
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Filter options if searchable
  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      setSearchQuery('');
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClickOutside, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (!searchable || !isOpen) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = filteredOptions.findIndex((opt) => String(opt.value) === String(value));
        const nextIndex = (currentIndex + 1) % filteredOptions.length;
        if (filteredOptions[nextIndex]) {
          onChange(filteredOptions[nextIndex].value);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = filteredOptions.findIndex((opt) => String(opt.value) === String(value));
        const prevIndex = (currentIndex - 1 + filteredOptions.length) % filteredOptions.length;
        if (filteredOptions[prevIndex]) {
          onChange(filteredOptions[prevIndex].value);
        }
      }
    }
  };

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-xl',
    md: 'h-9 px-3.5 text-xs rounded-xl',
    lg: 'h-10 px-4 text-sm rounded-2xl'
  };

  const toneDots: Record<string, string> = {
    blue: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
    green: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    yellow: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    red: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    purple: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
    grey: 'bg-slate-400'
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block ${isOpen ? 'z-[70]' : 'z-10'} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {label && (
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`glass-input flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer select-none font-semibold ${
          sizeClasses[size]
        } ${fullWidth ? 'w-full' : ''} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400/50 hover:shadow-glass-sm'
        } ${
          isOpen
            ? 'ring-2 ring-blue-500/40 border-blue-500 bg-white/95 dark:bg-slate-900/95 shadow-md'
            : 'text-slate-800 dark:text-slate-100 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="shrink-0 text-slate-400 dark:text-slate-400">{icon}</span>}
          {selectedOption?.tone && (
            <span className={`h-2 w-2 rounded-full shrink-0 ${toneDots[selectedOption.tone] || 'bg-slate-400'}`} />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 text-blue-500 dark:text-blue-400">{selectedOption.icon}</span>
          )}
          <span className={`truncate text-left ${selectedOption ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-400 font-normal'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {/* FLOATING LIQUID GLASS DROPDOWN MENU */}
      {isOpen && (
        <div
          role="listbox"
          style={minMenuWidth ? { minWidth: minMenuWidth } : undefined}
          className={`glass-modal absolute z-[100] mt-1.5 max-h-64 w-full min-w-[190px] overflow-y-auto rounded-2xl p-1.5 shadow-glass-modal backdrop-blur-3xl bg-white/98 dark:bg-slate-900/98 border border-white/40 dark:border-white/20 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {searchable && (
            <div className="p-1 pb-1.5 border-b border-slate-200/50 dark:border-white/10 mb-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                <SearchIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none font-medium"
                />
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-3 py-3 text-center text-xs text-slate-400 italic">
              No options found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs transition-all duration-150 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold shadow-2xs border border-blue-500/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/10 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {option.tone && (
                      <span className={`h-2 w-2 rounded-full shrink-0 ${toneDots[option.tone] || 'bg-slate-400'}`} />
                    )}
                    {option.icon && (
                      <span
                        className={`shrink-0 ${
                          isSelected ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'
                        }`}
                      >
                        {option.icon}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{option.label}</p>
                      {option.description && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-normal truncate mt-0.5">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {option.badge && (
                      <span className="rounded-md bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CheckIcon className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
