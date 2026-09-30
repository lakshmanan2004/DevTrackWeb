import React, { useMemo, useState } from 'react';
import {
  CalendarIcon,
  XIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  OctagonAlertIcon,
  HighlighterIcon,
  ListChecksIcon,
  AlertCircleIcon
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TaskStatusBadge } from '../ui/TaskStatusBadge';
import { useCalendar } from '../../hooks/useLive';
import { TaskStatus } from '../../types';

export interface MissedSlot {
  slot: number;
  hourLabel: string;
  timeRange: string;
  status: string;
  reason?: string;
}

export interface DayTask {
  id: string;
  task?: string;
  title: string;
  description?: string;
  status: 'done' | 'progress' | 'blocked';
  review: 'approved' | 'pending' | 'changes_requested';
  hourLabel: string;
  activeMinutes?: number;
  wordCount?: number;
  isPendingWorkSubmission?: boolean;
  originalPendingDate?: string;
  blocker?: string;
  tlNote?: string;
  targetedFeedback?: Array<{
    id: string;
    highlightedText: string;
    comment: string;
    screenshotUrl?: string;
    screenshotName?: string;
  }>;
}

export interface CalendarDayStatus {
  dateNum: number;
  dateStr: string;
  fullLabel: string;
  status: 'approved' | 'pending' | 'absent' | 'off' | 'weekend';
  tasksCount: number;
  approvedCount: number;
  pendingCount: number;
  missedCount?: number;
  missedSlots?: MissedSlot[];
  pendingTasks?: DayTask[];
  pendingTasksCount?: number;
  allTasks?: DayTask[];
  activeTime: string;
  notes?: string;
  tasks: DayTask[];
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
  const [dayDetailTab, setDayDetailTab] = useState<'missed' | 'pending' | 'all'>('missed');

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
  const totalMissedSlotsInMonth = days.reduce((acc, d) => acc + (d.missedCount || d.missedSlots?.length || 0), 0);
  const approvedTasksCount = days.reduce((acc, d) => acc + (d.approvedCount || 0), 0);

  const activeMissedSlots = selectedDay?.missedSlots || [];
  const activePendingTasks = selectedDay?.pendingTasks || selectedDay?.tasks?.filter(t => t.review !== 'approved' || t.status !== 'done' || t.isPendingWorkSubmission) || [];
  const activeAllTasks = selectedDay?.allTasks || selectedDay?.tasks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl">
        {/* MODAL HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-gradient-to-r from-brand-soft/40 via-purple-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-sm font-extrabold text-white shadow-md ring-4 ring-brand/20">
              {developer.initials || developer.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-navy">{developer.name}</h2>
                <Badge tone="blue">Developer Calendar</Badge>
              </div>
              <p className="text-xs text-gray-500">
                Inspect non-submitted check-in slots &amp; pending tasks per date
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* MONTH STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-hairline bg-canvas p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Month</span>
              <p className="text-sm font-extrabold text-navy">{monthLabel}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Submitted Tasks</span>
              <p className="text-sm font-extrabold text-emerald-950">{totalTasksInMonth} Logs</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Non-Submitted Slots</span>
              <p className="text-sm font-extrabold text-rose-950">{totalMissedSlotsInMonth} Missed</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending / Flagged Days</span>
              <p className="text-sm font-extrabold text-amber-950">{pendingDaysCount} Days</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            {/* LEFT: CALENDAR GRID */}
            <div className="lg:col-span-6 rounded-2xl border border-hairline bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <h3 className="text-sm font-extrabold text-navy flex items-center gap-2 uppercase tracking-wider">
                  <CalendarIcon className="h-4 w-4 text-brand" />
                  {monthLabel} Calendar
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Click any date to inspect details</span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-gray-500 animate-pulse">
                  Loading developer calendar...
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-gray-500 pb-1 border-b border-gray-100">
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
                      const hasMissed = (day.missedCount || 0) > 0;
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDay(day);
                            if ((day.missedCount || 0) > 0) {
                              setDayDetailTab('missed');
                            } else if ((day.pendingTasksCount || 0) > 0) {
                              setDayDetailTab('pending');
                            } else {
                              setDayDetailTab('all');
                            }
                          }}
                          title={`${day.fullLabel} — ${day.status.toUpperCase()} (${day.tasksCount} logs, ${day.missedCount || 0} non-submitted)`}
                          className={`flex h-10 w-full items-center justify-center rounded-xl text-xs font-extrabold transition-all duration-150 transform hover:scale-105 cursor-pointer relative ${
                            dayCellStyles[day.status]
                          } ${isSelected ? 'ring-4 ring-brand shadow-lg scale-105 z-10' : ''}`}
                        >
                          <span>{day.dateNum}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CALENDAR LEGEND */}
              <div className="border-t border-hairline pt-3">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
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
                    <span className="font-semibold text-navy">Absent / Missed Check-ins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-slate-200 border border-slate-300" />
                    <span className="font-semibold text-gray-500">Off / Weekend</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: SELECTED DAY DETAILS PANEL WITH HORIZONTAL TABS */}
            <div className="lg:col-span-6 flex flex-col rounded-2xl border border-hairline bg-canvas p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <h3 className="text-sm font-extrabold text-navy flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-brand" />
                  Day Details {selectedDay ? `— ${selectedDay.dateStr}` : ''}
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
                <div className="space-y-4 flex-1 flex flex-col">
                  {/* Summary Banner */}
                  <div className="rounded-xl bg-white p-3.5 border border-hairline shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-navy">{selectedDay.fullLabel}</p>
                      <span className="text-xs font-bold text-brand">{selectedDay.activeTime} Active</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-600 border-t border-gray-100">
                      <span>Submitted: <strong className="text-navy">{selectedDay.tasksCount}</strong></span>
                      <span>·</span>
                      <span>Non-Submitted: <strong className={activeMissedSlots.length > 0 ? 'text-rose-600 font-bold' : 'text-green-600'}>{activeMissedSlots.length}</strong></span>
                      <span>·</span>
                      <span>Pending/Action: <strong className={activePendingTasks.length > 0 ? 'text-amber-700 font-bold' : 'text-navy'}>{activePendingTasks.length}</strong></span>
                    </div>
                  </div>

                  {/* HORIZONTAL TABS (Non-Submitted Logs & Pending Tasks) */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-white p-1 shadow-2xs">
                    {/* 1. NON-SUBMITTED LOGS TAB */}
                    <button
                      type="button"
                      onClick={() => setDayDetailTab('missed')}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        dayDetailTab === 'missed'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-gray-600 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                    >
                      <OctagonAlertIcon className="h-3.5 w-3.5" />
                      <span>Non-Submitted ({activeMissedSlots.length})</span>
                    </button>

                    {/* 2. PENDING TASKS TAB */}
                    <button
                      type="button"
                      onClick={() => setDayDetailTab('pending')}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        dayDetailTab === 'pending'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-gray-600 hover:bg-amber-50 hover:text-amber-800'
                      }`}
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>Pending Tasks ({activePendingTasks.length})</span>
                    </button>

                    {/* 3. ALL LOGS TAB */}
                    <button
                      type="button"
                      onClick={() => setDayDetailTab('all')}
                      className={`flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        dayDetailTab === 'all'
                          ? 'bg-navy text-white shadow-xs'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-navy'
                      }`}
                    >
                      <ListChecksIcon className="h-3.5 w-3.5" />
                      <span>All Logs ({activeAllTasks.length})</span>
                    </button>
                  </div>

                  {/* TAB CONTENT DISPLAY */}
                  <div className="flex-1 space-y-3 max-h-72 overflow-y-auto pr-1">
                    {/* --- TAB 1: NON-SUBMITTED LOGS --- */}
                    {dayDetailTab === 'missed' && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-950 font-bold">
                          <span className="flex items-center gap-1.5">
                            <OctagonAlertIcon className="h-4 w-4 text-rose-600" />
                            {activeMissedSlots.length > 0
                              ? `${activeMissedSlots.length} Check-in Slot(s) Not Submitted on ${selectedDay.dateStr}`
                              : `0 Missed Check-ins on ${selectedDay.dateStr}`}
                          </span>
                          <span className="rounded-full bg-rose-200 text-rose-900 px-2 py-0.5 text-[10px]">
                            Required Slots
                          </span>
                        </div>

                        {activeMissedSlots.length > 0 ? (
                          <div className="space-y-2.5">
                            {activeMissedSlots.map((ms, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-rose-200 bg-white p-3 shadow-2xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-rose-100 text-rose-900 px-2.5 py-1 text-xs font-extrabold border border-rose-200">
                                      {ms.hourLabel} Slot
                                    </span>
                                    <span className="text-xs font-bold text-navy">{ms.timeRange}</span>
                                  </div>
                                  <span className="rounded-full bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wide">
                                    Not Submitted
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 pl-1">
                                  {ms.reason || 'Check-in was required but no hourly work log was submitted for this slot.'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-green-200 bg-white p-6 text-center space-y-1.5">
                            <CheckCircle2Icon className="h-7 w-7 text-emerald-600 mx-auto" />
                            <p className="text-xs font-bold text-navy">All Required Check-ins Submitted</p>
                            <p className="text-[11px] text-gray-500">
                              {developer.name} completed all required hourly check-in slots for this working day.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- TAB 2: PENDING TASKS --- */}
                    {dayDetailTab === 'pending' && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-950 font-bold">
                          <span className="flex items-center gap-1.5">
                            <ClockIcon className="h-4 w-4 text-amber-600" />
                            {activePendingTasks.length > 0
                              ? `${activePendingTasks.length} Pending / Kept Pending Task(s) on ${selectedDay.dateStr}`
                              : `0 Pending Tasks on ${selectedDay.dateStr}`}
                          </span>
                          <span className="rounded-full bg-amber-200 text-amber-900 px-2 py-0.5 text-[10px]">
                            Action Items
                          </span>
                        </div>

                        {activePendingTasks.length > 0 ? (
                          <div className="space-y-2.5">
                            {activePendingTasks.map((t) => (
                              <div
                                key={t.id}
                                className="rounded-xl border border-amber-300 bg-white p-3.5 shadow-2xs space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy">
                                    {t.hourLabel}
                                  </span>
                                  <h4 className="text-xs font-bold text-navy flex-1 truncate">{t.title || t.task}</h4>
                                  <Badge
                                    tone={
                                      t.review === 'changes_requested'
                                        ? 'amber'
                                        : t.status === 'blocked'
                                        ? 'red'
                                        : 'yellow'
                                    }
                                  >
                                    {t.review === 'changes_requested'
                                      ? 'Changes Requested'
                                      : t.status === 'blocked'
                                      ? 'Blocked'
                                      : 'In Progress'}
                                  </Badge>
                                </div>

                                {t.description && (
                                  <p className="text-xs text-gray-700 leading-relaxed bg-canvas p-2.5 rounded-lg border border-hairline">
                                    {t.description}
                                  </p>
                                )}

                                {t.isPendingWorkSubmission && (
                                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                                    <ClockIcon className="h-3 w-3 text-amber-700" />
                                    <span>Kept Pending from: <strong>{t.originalPendingDate || selectedDay.dateStr}</strong></span>
                                  </div>
                                )}

                                {t.tlNote && (
                                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
                                    <span className="font-bold text-navy">TL Feedback:</span> &quot;{t.tlNote}&quot;
                                  </div>
                                )}

                                {t.blocker && (
                                  <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-900">
                                    <span className="font-bold text-red-950">Blocker:</span> {t.blocker}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center space-y-1.5">
                            <CheckCircle2Icon className="h-7 w-7 text-emerald-600 mx-auto" />
                            <p className="text-xs font-bold text-navy">No Pending or Flagged Tasks</p>
                            <p className="text-[11px] text-gray-500">
                              All tasks logged on this day were completed and approved.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- TAB 3: ALL LOGS --- */}
                    {dayDetailTab === 'all' && (
                      <div className="space-y-2.5 animate-in fade-in duration-150">
                        {activeAllTasks.length > 0 ? (
                          activeAllTasks.map((t) => (
                            <div
                              key={t.id}
                              className={`rounded-xl border p-3.5 transition-all ${
                                t.review === 'changes_requested'
                                  ? 'border-amber-300 bg-amber-50/70 shadow-2xs'
                                  : t.review === 'approved'
                                  ? 'border-green-200 bg-white shadow-2xs'
                                  : 'border-hairline bg-white shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy">
                                  {t.hourLabel}
                                </span>
                                <h4 className="text-xs font-bold text-navy flex-1 truncate">{t.title || t.task}</h4>
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
                                    : 'Pending Review'}
                                </Badge>
                              </div>

                              {t.description && (
                                <p className="mt-2 text-xs text-gray-700 leading-relaxed bg-canvas p-2 rounded-lg border border-hairline">
                                  {t.description}
                                </p>
                              )}

                              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                                <TaskStatusBadge status={t.status as TaskStatus} />
                                {t.activeMinutes ? (
                                  <span>{t.activeMinutes} mins active</span>
                                ) : null}
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
                            No logs submitted on this date.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                  <CalendarIcon className="h-9 w-9 text-gray-400" />
                  <p className="text-xs font-bold text-navy">No Day Selected</p>
                  <p className="text-[11px] text-gray-500 max-w-[220px]">
                    Click any day in the calendar to inspect non-submitted check-in slots and pending tasks for that day.
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
