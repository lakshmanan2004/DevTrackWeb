import React, { useState, useMemo } from 'react';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Trash2Icon,
  BriefcaseIcon,
  SparklesIcon,
  InfoIcon,
  CheckCircle2Icon
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface HolidayEntry {
  date: string;
  name: string;
  type: string;
  isWorkingOverride?: boolean;
}

interface AdminHolidayCalendarProps {
  holidays: HolidayEntry[];
  workDays: number[];
  onSaveHolidays: (nextHolidays: HolidayEntry[]) => Promise<void>;
}

export function AdminHolidayCalendar({
  holidays,
  workDays,
  onSaveHolidays,
}: AdminHolidayCalendarProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    now.toISOString().slice(0, 10)
  );

  // Form input state for adding/editing holidays on selected date
  const [holidayNameInput, setHolidayNameInput] = useState('');
  const [holidayTypeInput, setHolidayTypeInput] = useState('org');
  const [isOverrideInput, setIsOverrideInput] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const pad = (n: number) => String(n).padStart(2, '0');

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today.toISOString().slice(0, 10));
  };

  const monthLabel = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Compute 3rd Saturday of the current displayed month
  const thirdSaturdayDateStr = useMemo(() => {
    for (let d = 15; d <= 21; d++) {
      const dt = new Date(currentYear, currentMonth, d);
      if (dt.getDay() === 6) {
        return `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}`;
      }
    }
    return '';
  }, [currentYear, currentMonth]);

  // Calendar cells calculation
  const calendarCells = useMemo(() => {
    const firstDow = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells = [];

    // Empty offset cells
    for (let i = 0; i < firstDow; i++) {
      cells.push({ isOffset: true, key: `offset-${i}` });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const isThirdSaturday = dateStr === thirdSaturdayDateStr;
      const customEntry = holidays.find((h) => h.date === dateStr);
      const isWorkingOverride = !!customEntry?.isWorkingOverride;

      // Determine holiday status
      let isHoliday = false;
      let holidayLabel = '';
      let holidayType = 'work';

      if (customEntry) {
        if (customEntry.isWorkingOverride) {
          isHoliday = false;
          holidayType = 'override';
          holidayLabel = customEntry.name || 'Working Day Override';
        } else {
          isHoliday = true;
          holidayType = customEntry.type || 'org';
          holidayLabel = customEntry.name || 'Organization Holiday';
        }
      } else if (isThirdSaturday) {
        // Automatic 3rd Saturday is holiday by default
        isHoliday = true;
        holidayType = 'third_sat';
        holidayLabel = '3rd Saturday Holiday';
      }

      const isWeekend = !workDays.includes(dayOfWeek);
      const isToday = dateStr === now.toISOString().slice(0, 10);
      const isSelected = dateStr === selectedDate;

      cells.push({
        isOffset: false,
        key: dateStr,
        dateNum: d,
        dateStr,
        dayOfWeek,
        isToday,
        isSelected,
        isHoliday,
        isThirdSaturday,
        isWorkingOverride,
        isWeekend,
        holidayType,
        holidayLabel,
      });
    }

    return cells;
  }, [currentYear, currentMonth, holidays, workDays, thirdSaturdayDateStr, selectedDate]);

  // Selected date info
  const selectedCell = useMemo(() => {
    return calendarCells.find((c) => !c.isOffset && c.dateStr === selectedDate);
  }, [calendarCells, selectedDate]);

  const selectedFormatted = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Actions
  const handleSetHoliday = async (type: string, isOverride: boolean = false) => {
    if (!selectedDate) return;
    setIsBusy(true);
    try {
      const name =
        holidayNameInput.trim() ||
        (isOverride
          ? 'Working Day Override'
          : type === 'govt'
          ? 'Government Holiday'
          : 'Organization Holiday');

      const newEntry: HolidayEntry = {
        date: selectedDate,
        name,
        type,
        isWorkingOverride: isOverride,
      };

      const next = [...holidays.filter((h) => h.date !== selectedDate), newEntry];
      await onSaveHolidays(next);
      setHolidayNameInput('');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemoveHoliday = async () => {
    if (!selectedDate) return;
    setIsBusy(true);
    try {
      const next = holidays.filter((h) => h.date !== selectedDate);
      await onSaveHolidays(next);
      setHolidayNameInput('');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER & MONTH NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 shadow-glass">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy dark:text-white">
              {monthLabel}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Interactive Holiday &amp; Working Days Schedule
            </p>
          </div>
        </div>

        {/* Month Switching Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/80 p-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-navy dark:hover:text-white shadow-glass cursor-pointer transition-colors"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={jumpToToday}
            className="rounded-xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-navy dark:hover:text-white shadow-glass cursor-pointer transition-colors"
          >
            Current Month
          </button>

          <button
            type="button"
            onClick={nextMonth}
            className="rounded-xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/80 p-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-navy dark:hover:text-white shadow-glass cursor-pointer transition-colors"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: CALENDAR GRID + SELECTED DATE ACTION PANEL */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* CALENDAR GRID (7 COLS) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-5 shadow-glass space-y-3">
          {/* Day Headers */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => {
              if (cell.isOffset) {
                return <div key={cell.key} className="h-11 sm:h-12" />;
              }

              // Color styles based on status
              let cellStyle =
                'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 hover:bg-white dark:hover:bg-slate-700';

              if (cell.isWorkingOverride) {
                cellStyle =
                  'bg-emerald-600 text-white border-transparent ring-2 ring-emerald-400/40 shadow-sm hover:bg-emerald-500';
              } else if (cell.isHoliday) {
                if (cell.holidayType === 'third_sat') {
                  cellStyle =
                    'bg-amber-500 text-white border-transparent ring-2 ring-amber-400/40 shadow-sm hover:bg-amber-600';
                } else {
                  cellStyle =
                    'bg-purple-600 text-white border-transparent ring-2 ring-purple-400/40 shadow-sm hover:bg-purple-500';
                }
              } else if (cell.isWeekend) {
                cellStyle =
                  'bg-slate-100/70 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border border-slate-200/40 dark:border-white/5';
              }

              const isSelected = cell.isSelected;

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateStr)}
                  title={`${cell.dateStr} ${
                    cell.holidayLabel ? `— ${cell.holidayLabel}` : ''
                  }`}
                  className={`relative flex flex-col h-11 sm:h-12 w-full items-center justify-center rounded-2xl text-xs font-bold transition-all duration-150 transform cursor-pointer select-none shadow-2xs ${
                    cellStyle
                  } ${
                    isSelected
                      ? 'scale-105 ring-4 ring-brand/60 z-10 !shadow-lg'
                      : 'hover:scale-[1.03]'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-black">
                    {cell.dateNum}
                  </span>

                  {/* Holiday Badge Icon */}
                  {cell.isWorkingOverride ? (
                    <span className="text-[9px] leading-none mt-0.5 font-bold">
                      💼
                    </span>
                  ) : cell.isHoliday ? (
                    <span className="text-[9px] leading-none mt-0.5 font-bold">
                      {cell.holidayType === 'third_sat' ? '⚡' : '🎉'}
                    </span>
                  ) : cell.isToday ? (
                    <span className="h-1 w-1 rounded-full bg-brand dark:bg-sky-400 mt-0.5" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="mt-4 border-t border-slate-200/60 dark:border-white/10 pt-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-purple-600 ring-2 ring-purple-300/40 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  🎉 Holiday
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-amber-500 ring-2 ring-amber-300/40 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  ⚡ 3rd Sat Off
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-emerald-600 ring-2 ring-emerald-300/40 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  💼 Override
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10 shrink-0" />
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Work Day / Off
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SELECTED DATE DETAILS & QUICK ACTION PANEL */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-5 shadow-glass space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Selected Date
              </span>
              <h4 className="text-sm font-bold text-navy dark:text-white">
                {selectedFormatted || selectedDate}
              </h4>
            </div>

            {selectedCell && (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-2xs ${
                  selectedCell.isWorkingOverride
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30'
                    : selectedCell.isHoliday
                    ? 'bg-purple-500/15 text-purple-900 dark:text-purple-200 border border-purple-500/30'
                    : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-white/10'
                }`}
              >
                {selectedCell.isWorkingOverride
                  ? '💼 Working Day'
                  : selectedCell.isHoliday
                  ? '🎉 Holiday'
                  : selectedCell.isWeekend
                  ? 'Weekend Off'
                  : 'Normal Work Day'}
              </span>
            )}
          </div>

          {/* Current Status Info Box */}
          {selectedCell && (
            <div
              className={`rounded-2xl border p-4 text-xs space-y-1.5 ${
                selectedCell.isWorkingOverride
                  ? 'border-emerald-300/80 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100'
                  : selectedCell.isHoliday
                  ? 'border-purple-300/80 bg-purple-50/60 dark:bg-purple-950/30 text-purple-950 dark:text-purple-100'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {selectedCell.isWorkingOverride ? (
                  <>
                    <BriefcaseIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Working Override Active</span>
                  </>
                ) : selectedCell.isHoliday ? (
                  <>
                    <SparklesIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>
                      {selectedCell.holidayLabel || 'Holiday Configured'}
                    </span>
                  </>
                ) : (
                  <>
                    <InfoIcon className="h-4 w-4 text-slate-400" />
                    <span>Standard Business Day</span>
                  </>
                )}
              </div>
              <p className="text-[11px] opacity-85 leading-snug">
                {selectedCell.isWorkingOverride
                  ? 'This date is configured as a required working day regardless of standard weekend rules.'
                  : selectedCell.isHoliday
                  ? 'Hourly check-ins and timer logs are disabled for all developers on this date.'
                  : 'Standard working hours and hourly check-in submission rules apply.'}
              </p>
            </div>
          )}

          {/* Quick Actions & Modify Form */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Set / Update Holiday Description
            </label>
            <input
              type="text"
              value={holidayNameInput}
              onChange={(e) => setHolidayNameInput(e.target.value)}
              placeholder="e.g. Gandhi Jayanti, Diwali Festival, Team Offsite"
              className="glass-input h-10 w-full rounded-2xl px-3.5 text-xs font-semibold text-navy dark:text-white focus:outline-none placeholder:text-slate-400"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                disabled={isBusy}
                onClick={() => handleSetHoliday('org', false)}
                className="w-full !from-purple-600 !to-indigo-600 text-white font-bold"
              >
                🎉 Set as Holiday
              </Button>

              <Button
                variant="success"
                size="sm"
                disabled={isBusy}
                onClick={() => handleSetHoliday('org', true)}
                className="w-full font-bold"
              >
                💼 Set as Working Day
              </Button>
            </div>

            {/* Remove Holiday button if entry exists */}
            {selectedCell && (selectedCell.isHoliday || selectedCell.isWorkingOverride) && (
              <Button
                variant="danger"
                size="sm"
                disabled={isBusy}
                onClick={handleRemoveHoliday}
                icon={<Trash2Icon className="h-3.5 w-3.5" />}
                className="w-full font-bold mt-2"
              >
                Remove Custom Configuration
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
