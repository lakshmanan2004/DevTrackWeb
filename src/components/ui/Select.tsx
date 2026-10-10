import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Compute fixed floating position anchored precisely to the button
  const updatePosition = useCallback(() => {
    const el = buttonRef.current || dropdownRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Only open upwards if space below is too cramped (< 160px) and above has more room
    const openUpwards = spaceBelow < 160 && spaceAbove > spaceBelow;

    // Minimum & calculated menu width
    let targetWidth: number;
    if (minMenuWidth) {
      targetWidth = parseFloat(minMenuWidth) || rect.width;
    } else if (fullWidth) {
      targetWidth = rect.width;
    } else {
      targetWidth = Math.max(rect.width, 220);
    }
    targetWidth = Math.min(targetWidth, window.innerWidth - 24);

    const isRightAligned =
      align === 'right' ||
      (align === 'left' && rect.left + targetWidth > window.innerWidth - 16);

    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 999999,
      width: `${targetWidth}px`,
      maxWidth: 'calc(100vw - 24px)',
    };

    if (isRightAligned) {
      const rightVal = Math.max(12, window.innerWidth - rect.right);
      style.right = `${rightVal}px`;
      style.left = 'auto';
    } else {
      const leftVal = Math.max(12, Math.min(rect.left, window.innerWidth - targetWidth - 12));
      style.left = `${leftVal}px`;
      style.right = 'auto';
    }

    if (openUpwards) {
      style.bottom = `${Math.round(window.innerHeight - rect.top + 4)}px`;
      style.top = 'auto';
      style.maxHeight = `${Math.max(140, Math.min(300, spaceAbove - 16))}px`;
      style.transformOrigin = isRightAligned ? 'bottom right' : 'bottom left';
    } else {
      style.top = `${Math.round(rect.bottom + 4)}px`;
      style.bottom = 'auto';
      style.maxHeight = `${Math.max(140, Math.min(300, spaceBelow - 16))}px`;
      style.transformOrigin = isRightAligned ? 'top right' : 'top left';
    }

    setMenuStyle(style);
  }, [align, fullWidth, minMenuWidth]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      updatePosition();
      if (searchable || options.length > 6) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, searchable, options.length, updatePosition]);

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    const isInsideTrigger = dropdownRef.current && dropdownRef.current.contains(target);
    const isInsideMenu = menuRef.current && menuRef.current.contains(target);
    if (!isInsideTrigger && !isInsideMenu) {
      setIsOpen(false);
    }
  }, []);

  // Event listeners for open state
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, handleClickOutside, updatePosition]);

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

        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {/* PORTALED LIQUID FROSTED GLASS DROPDOWN POPUP MENU */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            className="glass-dropdown overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* SEARCH INPUT BAR */}
            {showSearch && (
              <div className="p-1 pb-1.5 border-b border-white/40 dark:border-white/10 mb-1">
                <div className="relative flex items-center">
                  <SearchIcon className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options…"
                    className="w-full rounded-xl bg-white/60 dark:bg-white/[0.08] backdrop-blur-md pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 outline-none border border-white/60 dark:border-white/10 focus:border-blue-500/60 focus:bg-white/80 dark:focus:bg-white/[0.14] transition-all"
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
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
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
                      className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-150 cursor-pointer select-none border ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-indigo-500/15 dark:from-blue-500/25 dark:to-indigo-500/25 text-blue-700 dark:text-blue-300 font-bold border-blue-500/40 shadow-xs'
                          : 'border-transparent text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-indigo-500/10 hover:border-blue-400/40 dark:hover:bg-white/[0.08] dark:hover:border-white/15 hover:shadow-xs active:scale-[0.99] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {option.tone && (
                          <span className={`h-2 w-2 rounded-full shrink-0 ${toneDots[option.tone] || 'bg-slate-400'}`} />
                        )}
                        {option.icon && (
                          <span
                            className={`shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                              isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-blue-500 dark:group-hover:text-sky-300'
                            }`}
                          >
                            {option.icon}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`truncate leading-snug transition-colors duration-150 ${isSelected ? 'font-bold text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-300 font-semibold'}`}>
                            {option.label}
                          </p>
                          {option.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {option.badge && (
                          <span className="rounded-lg bg-white/70 dark:bg-white/[0.08] group-hover:bg-white/90 group-hover:border-blue-300/50 dark:group-hover:bg-white/[0.12] px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-white/60 dark:border-white/10 shadow-2xs transition-all">
                            {option.badge}
                          </span>
                        )}
                        {isSelected && (
                          <CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 animate-in zoom-in-75 duration-150" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
