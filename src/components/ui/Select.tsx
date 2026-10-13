import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon, CheckIcon, SearchIcon, XIcon } from 'lucide-react';

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
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Determine whether to open upwards based on button position
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpwards(spaceBelow < 220 && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      if (searchable || options.length > 6) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, searchable, options.length]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchDesc = opt.description ? opt.description.toLowerCase().includes(q) : false;
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
      return matchLabel || matchDesc || matchBadge;
    });
  }, [options, searchQuery]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
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

  const showSearch = searchable || options.length > 6;

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {label && (
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {/* TRIGGER BUTTON */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`glass-input flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer select-none font-semibold ${
          sizeClasses[size]
        } ${fullWidth ? 'w-full' : ''} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400/60 hover:shadow-glass-sm'
        } ${
          isOpen
            ? 'ring-2 ring-blue-500/40 border-blue-500/80 shadow-md'
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

        <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-white/60 dark:bg-white/10 shrink-0 text-slate-500 dark:text-slate-300 border border-white/40 dark:border-white/10 shadow-2xs">
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-500' : ''
            }`}
          />
        </span>
      </button>

      {/* SOLIDLY ANCHORED DROPDOWN POPUP MENU */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          style={{
            minWidth: minMenuWidth || (fullWidth ? '100%' : '220px'),
            maxWidth: 'calc(100vw - 24px)',
          }}
          className={`glass-dropdown absolute ${openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-[100] ${fullWidth ? 'w-full' : 'w-auto'} overflow-hidden p-1.5 animate-in fade-in duration-150`}
        >
          {/* SEARCH INPUT BAR */}
          {showSearch && (
            <div className="p-1.5 pb-2 border-b border-slate-200 dark:border-slate-800 mb-1">
              <div className="relative flex items-center">
                <SearchIcon className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options…"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SCROLLABLE OPTIONS LIST */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 p-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-center text-xs font-medium text-slate-400 italic">
                {searchQuery ? `No options matching "${searchQuery}"` : 'No options available'}
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
                    }}
                    className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs transition-colors duration-150 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {option.tone && (
                        <span className={`h-2 w-2 rounded-full shrink-0 ${toneDots[option.tone] || 'bg-slate-400'}`} />
                      )}
                      {option.icon && (
                        <span
                          className={`shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                            isSelected ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 dark:group-hover:text-sky-300'
                          }`}
                        >
                          {option.icon}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`truncate leading-snug transition-colors duration-150 ${
                          isSelected ? 'font-bold text-white' : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-300 font-semibold'
                        }`}>
                          {option.label}
                        </p>
                        {option.description && (
                          <p className={`text-[10px] font-normal truncate mt-0.5 ${
                            isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {option.badge && (
                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                          isSelected
                            ? 'bg-blue-700 text-white border-blue-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}>
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <CheckIcon className="h-4 w-4 text-white shrink-0 animate-in zoom-in-75 duration-150" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
