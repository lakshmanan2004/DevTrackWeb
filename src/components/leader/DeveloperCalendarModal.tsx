import React, { useMemo, useState } from 'react';
import {
  CalendarIcon,
  XIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  TimerIcon,
  HighlighterIcon,
  UserIcon
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TaskStatusBadge } from '../ui/TaskStatusBadge';
import { useCalendar } from '../../hooks/useLive';
import { TaskStatus } from '../../types';

export interface CalendarDayStatus {
  dateNum: number;
  dateStr: string;
  fullLabel: string;
  status: 'approved' | 'pending' | 'absent' | 'off' | 'weekend';
  tasksCount: number;
  approvedCount: number;
  pendingCount: number;
  activeTime: string;
  notes?: string;
  tasks: Array<{
    id: string;
    title: string;
    status: 'done' | 'progress' | 'blocked';
    review: 'approved' | 'pending' | 'changes_requested';
    hourLabel: string;
    tlNote?: string;
  }>;
}

interface DeveloperCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  developer: {
    id: string;
    name: string;
    initials?: string;
    email?: string;
    team?: string;
  } | null;
}

export function DeveloperCalendarModal({ isOpen, onClose, developer }: DeveloperCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const monthStr = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [currentDate]);

  const { data: cal, loading } = useCalendar(monthStr, developer?.id);
  const days: CalendarDayStatus[] = cal?.days || [];
  const [selectedDay, setSelectedDay] = useState<CalendarDayStatus | null>(null);

  if (!isOpen || !developer) return null;

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const dayCellStyles = {
    approved: 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 ring-2 ring-emerald-400/30',
    pending: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 ring-2 ring-amber-400/40 animate-pulse',
    absent: 'bg-rose-500 text-white shadow-sm hover:bg-rose-600',
    off: 'bg-slate-200 text-slate-600 hover:bg-slate-300',
    weekend: 'bg-slate-100 text-slate-400 border border-slate-200'
  };

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const firstDow = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const pendingDaysCount = days.filter((d) => d.status === 'pending' || d.status === 'absent').length;
  const totalTasksInMonth = days.reduce((acc, d) => acc + (d.tasksCount || 0), 0);
  const approvedTasksCount = days.reduce((acc, d) => acc + (d.approvedCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl">
        {/* MODAL HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-gradient-to-r from-brand-soft/40 via-purple-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-sm font-extrabold text-white shadow-md ring-4 ring-brand/20">
              {developer.initials || developer.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-navy">{developer.name}</h2>
                <Badge tone="blue">Developer</Badge>
              </div>
              <p className="text-xs text-gray-500">
                Monthly Task Status &amp; Daily Activity Calendar
              </p>
            </div>
          </div>

          {/* Month Switcher Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-hairline bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-navy transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <span className="px-3 text-xs font-bold text-navy min-w-[120px] text-center">
                {monthLabel}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-navy transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="rounded-xl border border-hairline bg-white px-3 py-2 text-xs font-bold text-brand hover:bg-brand-soft transition-colors cursor-pointer"
            >
              This Month
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-navy transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-hairline bg-canvas p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Month</span>
              <p className="text-sm font-extrabold text-navy">{monthLabel}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Tasks</span>
              <p className="text-sm font-extrabold text-emerald-950">{totalTasksInMonth} Logged</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50/60 p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Approved</span>
              <p className="text-sm font-extrabold text-green-950">{approvedTasksCount} Approved</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Action Needed</span>
              <p className="text-sm font-extrabold text-amber-950">{pendingDaysCount} Days Pending</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* CALENDAR GRID */}
            <div className="lg:col-span-7 rounded-2xl border border-hairline bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <h3 className="text-sm font-extrabold text-navy flex items-center gap-2 uppercase tracking-wider">
                  <CalendarIcon className="h-4 w-4 text-brand" />
                  {monthLabel} Calendar
                </h3>
                <span className="text-xs text-gray-400 font-medium">Click any date to inspect details</span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-gray-500 animate-pulse">
                  Loading developer calendar...
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-7 text-center text-xs font-extrabold text-gray-500 pb-1 border-b border-gray-100">
                    <span>SUN</span>
                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDow }, (_, i) => (
                      <div key={`empty-${i}`} className="h-10" />
                    ))}
                    {days.map((day) => {
                      const isSelected = selectedDay?.dateStr === day.dateStr;
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          title={`${day.fullLabel} — ${day.status.toUpperCase()} (${day.tasksCount} tasks)`}
                          className={`flex h-10 w-full flex-col items-center justify-center rounded-xl text-xs font-extrabold transition-all duration-150 transform hover:scale-105 cursor-pointer ${
                            dayCellStyles[day.status]
                          } ${isSelected ? 'ring-4 ring-brand shadow-lg scale-105' : ''}`}
                        >
                          <span>{day.dateNum}</span>
                          {day.tasksCount > 0 && (
                            <span className="text-[9px] opacity-90 font-medium">{day.tasksCount} logs</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CALENDAR LEGEND */}
              <div className="border-t border-hairline pt-3">
                <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-emerald-500" />
                    <span className="font-semibold text-navy">Approved / Done</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-amber-500 animate-pulse" />
                    <span className="font-bold text-amber-900">Pending / Feedback</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-rose-500" />
                    <span className="font-semibold text-navy">Absent / Missing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-slate-200 border border-slate-300" />
                    <span className="font-semibold text-gray-500">Off / Weekend</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SELECTED DAY DETAILS PANEL */}
            <div className="lg:col-span-5 flex flex-col rounded-2xl border border-hairline bg-canvas p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <h3 className="text-sm font-extrabold text-navy flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-brand" />
                  Day Details
                </h3>
                {selectedDay && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white ${
                      dayCellStyles[selectedDay.status]
                    }`}
                  >
                    {selectedDay.status}
                  </span>
                )}
              </div>

              {selectedDay ? (
                <div className="space-y-4 flex-1">
                  <div className="rounded-xl bg-white p-3.5 border border-hairline shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-navy">{selectedDay.fullLabel}</p>
                    <p className="text-xs text-gray-500">
                      Active: <strong className="text-navy font-semibold">{selectedDay.activeTime}</strong> ·{' '}
                      <strong className="text-navy font-semibold">{selectedDay.tasksCount} Tasks Logged</strong>
                    </p>
                  </div>

                  {selectedDay.notes && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-semibold">
                      💡 {selectedDay.notes}
                    </div>
                  )}

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {selectedDay.tasks && selectedDay.tasks.length > 0 ? (
                      selectedDay.tasks.map((t) => (
                        <div
                          key={t.id}
                          className={`rounded-xl border p-3 transition-all ${
                            t.review === 'changes_requested'
                              ? 'border-amber-300 bg-amber-50/80 shadow-2xs'
                              : 'border-hairline bg-white shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy">
                              {t.hourLabel}
                            </span>
                            <h4 className="text-xs font-bold text-navy flex-1 truncate">{t.title}</h4>
                            <Badge
                              tone={
                                t.review === 'approved'
                                  ? 'green'
                                  : t.review === 'changes_requested'
                                  ? 'amber'
                                  : 'blue'
                              }
                            >
                              {t.review === 'approved'
                                ? 'Approved'
                                : t.review === 'changes_requested'
                                ? 'Changes Req'
                                : 'Pending'}
                            </Badge>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                            <TaskStatusBadge status={t.status as TaskStatus} />
                          </div>

                          {t.tlNote && (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
                              <span className="font-bold text-navy">TL Feedback:</span> &quot;{t.tlNote}&quot;
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-xs text-gray-500">
                        No tasks or logs recorded for this day.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                  <CalendarIcon className="h-8 w-8 text-gray-400" />
                  <p className="text-xs font-bold text-navy">No Day Selected</p>
                  <p className="text-[11px] text-gray-500 max-w-[200px]">
                    Click any day in the calendar to view {developer.name}&apos;s tasks, review status, and feedback notes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-hairline bg-canvas px-6 py-3.5">
          <p className="text-xs text-gray-500">
            Developer: <strong className="text-navy">{developer.name}</strong> ({developer.email || 'developer'})
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close Calendar
          </Button>
        </div>
      </div>
    </div>
  );
}
