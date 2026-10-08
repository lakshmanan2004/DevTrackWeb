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
import { api } from '../../api/client';
import { ReviewLogFeedbackModal } from './ReviewLogFeedbackModal';
import { isLogLate } from '../../utils/logTimeliness';

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
  review: 'approved' | 'pending' | 'changes_requested' | 'rejected';
  hourLabel: string;
  time?: string;
  submittedAt?: string;
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
  status: 'approved' | 'pending' | 'absent' | 'off' | 'weekend' | 'holiday';
  holidayName?: string;
  isHoliday?: boolean;
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

  const { data: cal, loading, refetch: refetchCalendar } = useCalendar(monthStr, developer?.id);
  const days: CalendarDayStatus[] = cal?.days || [];
  const [selectedDay, setSelectedDay] = useState<CalendarDayStatus | null>(null);
  const [dayDetailTab, setDayDetailTab] = useState<'all' | 'missed' | 'pending' | 'approved'>('all');

  const [selectedReviewLog, setSelectedReviewLog] = useState<any | null>(null);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject'>('approve');
  const [isReviewing, setIsReviewing] = useState(false);
  const [overrideReviews, setOverrideReviews] = useState<Record<string, { review: string; reviewNote?: string }>>({});

  // Auto-select today or most recent day when days load
  React.useEffect(() => {
    if (days.length > 0 && !selectedDay) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const match = days.find((d) => d.dateStr === todayStr) || days[days.length - 1];
      if (match) setSelectedDay(match);
    }
  }, [days, selectedDay]);

  if (!isOpen || !developer) return null;

  const handleOpenReview = (log: any, mode: 'approve' | 'reject') => {
    setSelectedReviewLog(log);
    setReviewMode(mode);
  };

  const handleExecuteReview = async (action: 'approve' | 'changes_requested' | 'reject', note: string) => {
    if (!selectedReviewLog) return;
    const logId = selectedReviewLog.id || selectedReviewLog._id;
    setIsReviewing(true);
    setOverrideReviews((prev) => ({
      ...prev,
      [logId]: { review: action, reviewNote: note || '' }
    }));
    try {
      await api(`/api/logs/${logId}/review`, {
        method: 'POST',
        body: { action, note: note || '', reviewNote: note || '' }
      });
      setSelectedReviewLog(null);
      refetchCalendar();
    } catch (err: any) {
      console.error('Failed to review log:', err);
      setOverrideReviews((prev) => {
        const copy = { ...prev };
        delete copy[logId];
        return copy;
      });
    } finally {
      setIsReviewing(false);
    }
  };

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

  const dayCellStyles: Record<string, string> = {
    approved: 'bg-emerald-500/90 text-white shadow-sm hover:bg-emerald-600 dark:bg-emerald-500/70 dark:text-emerald-100 dark:border dark:border-emerald-400/40 ring-1 ring-emerald-400/30',
    pending: 'bg-amber-500/90 text-white shadow-sm hover:bg-amber-600 dark:bg-amber-500/70 dark:text-amber-100 dark:border dark:border-amber-400/40 ring-1 ring-amber-400/40 animate-pulse',
    absent: 'bg-rose-500/90 text-white shadow-sm hover:bg-rose-600 dark:bg-rose-500/70 dark:text-rose-100 dark:border dark:border-rose-400/40',
    holiday: 'bg-purple-600/90 text-white shadow-sm hover:bg-purple-700 dark:bg-purple-600/70 dark:text-purple-100 dark:border dark:border-purple-400/40 ring-1 ring-purple-400/40',
    off: 'bg-slate-100/80 text-slate-600 hover:bg-white/80 border border-slate-200/60 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/15 dark:border-white/10',
    weekend: 'bg-slate-100/50 text-slate-400 border border-slate-200/50 dark:bg-white/[0.02] dark:text-slate-500 dark:border-white/5 dark:hover:bg-white/[0.05]'
  };

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const firstDow = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const pendingDaysCount = days.filter((d) => d.status === 'pending' || d.status === 'absent').length;
  const totalTasksInMonth = days.reduce((acc, d) => acc + (d.tasksCount || 0), 0);
  const totalMissedSlotsInMonth = days.reduce((acc, d) => acc + (d.missedCount || d.missedSlots?.length || 0), 0);
  const approvedTasksCount = days.reduce((acc, d) => acc + (d.approvedCount || 0), 0);

  const activeMissedSlots = selectedDay?.missedSlots || [];
  const rawTasks = selectedDay?.allTasks || selectedDay?.tasks || [];
  const displayTasks = rawTasks.map((item: any) => {
    const logId = item.id || item._id;
    const override = overrideReviews[logId];
    if (override) {
      return { ...item, review: override.review, reviewNote: override.reviewNote || item.reviewNote };
    }
    return item;
  });
  const activePendingTasks = displayTasks.filter((t: any) => t.review !== 'approved' || t.status !== 'done' || t.isPendingWorkSubmission);
  const activeApprovedTasks = displayTasks.filter((t: any) => t.review === 'approved');

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-slate-900/50 p-4 sm:p-6 lg:p-8 backdrop-blur-md animate-in fade-in">
      <div className="glass-modal relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/90 dark:border-white/15 shadow-2xl p-0">
        {/* MODAL HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-white/40 dark:from-blue-500/15 dark:via-purple-500/10 dark:to-transparent px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md ring-2 ring-white/30">
              {developer.initials || developer.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-black text-navy dark:text-white tracking-tight">{developer.name}</h2>
                <Badge tone="blue">Developer Calendar</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Inspect non-submitted check-in slots &amp; pending tasks per date
              </p>
            </div>
          </div>

          {/* Month Switcher Controls */}
          <div className="flex items-center gap-2.5">
            <div className="glass-surface flex items-center gap-1 rounded-2xl border border-white/80 dark:border-white/10 p-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-xl p-1.5 text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-navy dark:hover:text-white transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <span className="px-3 text-xs font-black text-navy dark:text-white min-w-[120px] text-center">
                {monthLabel}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-xl p-1.5 text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-navy dark:hover:text-white transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="btn-glass-secondary h-9 px-3.5 text-xs font-bold cursor-pointer"
            >
              This Month
            </button>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* MONTH STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="glass-surface rounded-2xl border border-white/80 dark:border-white/10 p-4 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month</span>
              <p className="text-sm font-black text-navy dark:text-white">{monthLabel}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 p-4 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Submitted Tasks</span>
              <p className="text-sm font-black text-emerald-950 dark:text-emerald-100">{totalTasksInMonth} Logs</p>
            </div>
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 p-4 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Non-Submitted Slots</span>
              <p className="text-sm font-black text-rose-950 dark:text-rose-100">{totalMissedSlotsInMonth} Missed</p>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-4 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Pending / Flagged Days</span>
              <p className="text-sm font-black text-amber-950 dark:text-amber-100">{pendingDaysCount} Days</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* LEFT: CALENDAR GRID */}
            <div className="lg:col-span-6 glass-card rounded-3xl border border-white/80 dark:border-white/10 p-5 shadow-glass space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
                <h3 className="text-xs font-black text-navy dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <CalendarIcon className="h-4 w-4 text-brand" />
                  {monthLabel} Calendar
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Click any date to inspect details</span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-slate-400 animate-pulse font-medium">
                  Loading developer calendar...
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-7 text-center text-[11px] font-black text-slate-400 pb-1 border-b border-slate-200/40 dark:border-white/10">
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
                          onClick={() => {
                            setSelectedDay(day);
                            if ((day.missedCount || 0) > 0) {
                              setDayDetailTab('missed');
                            } else if ((day.pendingTasksCount || 0) > 0) {
                              setDayDetailTab('pending');
                            } else {
                              setDayDetailTab('approved');
                            }
                          }}
                          title={`${day.fullLabel} — ${day.status.toUpperCase()} (${day.tasksCount} logs, ${day.missedCount || 0} non-submitted)`}
                          className={`flex h-10 w-full items-center justify-center rounded-xl text-xs font-extrabold transition-all duration-150 transform hover:scale-105 cursor-pointer relative ${
                            dayCellStyles[day.status]
                          } ${isSelected ? 'ring-4 ring-brand dark:ring-blue-400 shadow-lg scale-105 z-10' : ''}`}
                        >
                          <span>{day.dateNum}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CALENDAR LEGEND */}
              <div className="border-t border-slate-200/60 dark:border-white/10 pt-3">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md bg-emerald-500 shadow-xs" />
                    <span className="font-bold text-navy dark:text-slate-200">Approved / Done</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md bg-amber-500 animate-pulse shadow-xs" />
                    <span className="font-bold text-amber-900 dark:text-amber-300">Pending / Feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md bg-rose-500 shadow-xs" />
                    <span className="font-bold text-navy dark:text-slate-200">Absent / Missed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md bg-purple-600 shadow-xs" />
                    <span className="font-bold text-purple-900 dark:text-purple-300">🎉 Holiday</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10" />
                    <span className="font-medium text-slate-400">Off / Weekend</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: SELECTED DAY DETAILS PANEL WITH HORIZONTAL TABS */}
            <div className="lg:col-span-6 flex flex-col glass-card rounded-3xl border border-white/80 dark:border-white/10 p-5 space-y-4 shadow-glass">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
                <h3 className="text-xs font-black text-navy dark:text-white flex items-center gap-2 uppercase tracking-wider">
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
                  <div className="glass-surface rounded-2xl p-4 border border-white/80 dark:border-white/10 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-navy dark:text-white">{selectedDay.fullLabel}</p>
                      <span className="text-xs font-bold text-brand dark:text-blue-400">{selectedDay.activeTime} Active</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/40 dark:border-white/10">
                      <span>Logs Submitted: <strong className="text-navy dark:text-white font-bold">{selectedDay.tasksCount}</strong></span>
                      <span>·</span>
                      <span>Missed: <strong className={activeMissedSlots.length > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>{activeMissedSlots.length}</strong></span>
                      <span>·</span>
                      <span>Approved: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedDay.approvedCount || 0}</strong></span>
                      <span>·</span>
                      <span>Pending: <strong className={activePendingTasks.length > 0 ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>{activePendingTasks.length}</strong></span>
                    </div>
                  </div>

                  {/* HORIZONTAL TABS (All Logs, Non-Submitted, Pending, Approved) */}
                  <div className="glass-surface flex flex-wrap items-center gap-1 rounded-2xl border border-white/80 dark:border-white/10 p-1 shadow-2xs">
                    {/* 1. ALL WORK LOGS TAB */}
                    <button
                      type="button"
                      onClick={() => setDayDetailTab('all')}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        dayDetailTab === 'all'
                          ? 'btn-glass-primary !text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/10 hover:text-navy dark:hover:text-white'
                      }`}
                    >
                      <ListChecksIcon className="h-3.5 w-3.5" />
                      <span>All Logs ({selectedDay.tasksCount || displayTasks.length})</span>
                    </button>

                    {/* 2. NON-SUBMITTED LOGS TAB */}
                    <button
                      type="button"
                      onClick={() => setDayDetailTab('missed')}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        dayDetailTab === 'missed'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-rose-50/50 dark:hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-300'
                      }`}
                    >
                      <OctagonAlertIcon className="h-3.5 w-3.5" />
                      <span>Non-Submitted ({activeMissedSlots.length})</span>
                    </button>

                    {/* 3. PENDING TASKS TAB */}
                    <button
                      type="button"
                      onClick={() => setDayDetailTab('pending')}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        dayDetailTab === 'pending'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-amber-50/50 dark:hover:bg-amber-500/15 hover:text-amber-800 dark:hover:text-amber-300'
                      }`}
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>Pending ({activePendingTasks.length})</span>
                    </button>

                    {/* 4. APPROVED LOGS TAB */}
                    <button
                      type="button"
                      onClick={() => setDayDetailTab('approved')}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        dayDetailTab === 'approved'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/15 hover:text-emerald-800 dark:hover:text-emerald-300'
                      }`}
                    >
                      <CheckCircle2Icon className="h-3.5 w-3.5" />
                      <span>Approved ({activeApprovedTasks.length})</span>
                    </button>
                  </div>

                  {/* TAB CONTENT DISPLAY */}
                  <div className="flex-1 space-y-3 max-h-80 overflow-y-auto pr-1">
                    {/* --- TAB 1 & TAB 3 & TAB 4: WORK LOGS LIST --- */}
                    {(dayDetailTab === 'all' || dayDetailTab === 'pending' || dayDetailTab === 'approved') && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        {(() => {
                          const tasksToList =
                            dayDetailTab === 'pending'
                              ? displayTasks.filter(t => t.review !== 'approved' || t.isPendingWorkSubmission)
                              : dayDetailTab === 'approved'
                              ? displayTasks.filter(t => t.review === 'approved')
                              : displayTasks;

                          if (tasksToList.length === 0) {
                            return (
                              <div className="glass-surface rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-center space-y-1.5 shadow-2xs">
                                <CheckCircle2Icon className="h-7 w-7 text-slate-400 mx-auto" />
                                <p className="text-xs font-bold text-navy dark:text-white">
                                  {dayDetailTab === 'pending'
                                    ? 'No Pending or Flagged Tasks'
                                    : dayDetailTab === 'approved'
                                    ? 'No Approved Logs Yet'
                                    : 'No Work Logs Submitted on this Date'}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {dayDetailTab === 'all'
                                    ? 'Hourly check-in logs submitted by the developer will appear here.'
                                    : 'All logs have been reviewed.'}
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              {tasksToList.map((t) => {
                                const isLate = isLogLate(t);
                                return (
                                  <div
                                    key={t.id}
                                    className={`glass-surface rounded-2xl border p-3.5 shadow-glass transition-all ${
                                      isLate
                                        ? 'border-amber-300/80 dark:border-amber-500/30'
                                        : 'border-white/80 dark:border-white/10'
                                    }`}
                                  >
                                    {/* ROW 1: [Hour] Title ... [Late Badge] [Status Badge] */}
                                    <div className="flex items-center justify-between gap-2.5 min-w-0">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="shrink-0 rounded-xl bg-slate-200 dark:bg-white/10 px-2.5 py-1 text-xs font-black tabular-nums text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-white/10">
                                          {t.hourLabel}
                                        </span>
                                        <h4 className="truncate text-xs sm:text-sm font-bold text-navy dark:text-white" title={t.title || t.task}>
                                          {t.title || t.task}
                                        </h4>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        {isLate && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
                                            ⚠️ Late
                                          </span>
                                        )}
                                        <TaskStatusBadge status={t.status as TaskStatus} />
                                      </div>
                                    </div>

                                    {t.description && (
                                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed glass-surface p-2.5 rounded-xl border border-white/60 dark:border-white/10">
                                        {t.description}
                                      </p>
                                    )}

                                    {t.isPendingWorkSubmission && (
                                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                                        <ClockIcon className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                                        <span>Kept Pending from: <strong>{t.originalPendingDate || selectedDay.dateStr}</strong></span>
                                      </div>
                                    )}

                                    {t.tlNote && (
                                      <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-2.5 text-xs text-amber-950 dark:text-amber-200">
                                        <span className="font-bold text-navy dark:text-white">TL Feedback:</span> &quot;{t.tlNote}&quot;
                                      </div>
                                    )}

                                    {t.blocker && (
                                      <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 p-2.5 text-xs text-rose-900 dark:text-rose-200">
                                        <span className="font-bold text-rose-950 dark:text-rose-300">Blocker:</span> {t.blocker}
                                      </div>
                                    )}

                                    {/* ROW 2: Submitted time (left) + Action Button / Approved Badge (right) */}
                                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/40 dark:border-white/10">
                                      <span className={`text-[11px] font-medium ${isLate ? 'font-bold text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {isLate ? `Submitted Late at ${t.submittedAt || t.time || 'time unknown'}` : `Submitted ${t.submittedAt || t.time || ''}`}
                                      </span>

                                      <div className="shrink-0">
                                        {t.review === 'approved' ? (
                                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                            <CheckCircle2Icon className="h-3.5 w-3.5" />
                                            Approved
                                          </span>
                                        ) : t.review === 'rejected' ? (
                                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                                            <XIcon className="h-3.5 w-3.5" />
                                            Rejected
                                          </span>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <Button
                                              size="sm"
                                              variant="success"
                                              className="!py-1 !px-2.5 !text-xs !rounded-xl"
                                              icon={<CheckCircle2Icon className="h-3.5 w-3.5" />}
                                              onClick={() => handleOpenReview(t, 'approve')}
                                            >
                                              Approve
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="danger"
                                              className="!py-1 !px-2.5 !text-xs !rounded-xl"
                                              icon={<XIcon className="h-3.5 w-3.5" />}
                                              onClick={() => handleOpenReview(t, 'reject')}
                                            >
                                              Reject
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* --- TAB 2: NON-SUBMITTED LOGS --- */}
                    {dayDetailTab === 'missed' && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 px-4 py-2.5 text-xs text-rose-950 dark:text-rose-200 font-bold">
                          <span className="flex items-center gap-1.5 min-w-0 leading-snug">
                            <OctagonAlertIcon className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>
                              {activeMissedSlots.length > 0
                                ? `${activeMissedSlots.length} Check-in Slot(s) Not Submitted on `
                                : '0 Missed Check-ins on '}
                              <span className="whitespace-nowrap font-black">{selectedDay.dateStr}</span>
                            </span>
                          </span>
                          <span className="shrink-0 whitespace-nowrap inline-flex items-center rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-200 px-2.5 py-0.5 text-[10px] font-extrabold border border-rose-500/30">
                            Required
                          </span>
                        </div>

                        {activeMissedSlots.length > 0 ? (
                          <div className="space-y-2.5">
                            {activeMissedSlots.map((ms, idx) => (
                              <div
                                key={idx}
                                className="glass-surface rounded-2xl border border-rose-300/60 dark:border-rose-500/30 dark:bg-rose-500/5 p-3.5 shadow-2xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-rose-500/15 text-rose-800 dark:text-rose-300 px-2.5 py-0.5 text-xs font-black border border-rose-500/30">
                                      {ms.hourLabel} Slot
                                    </span>
                                    <span className="text-xs font-bold text-navy dark:text-white">{ms.timeRange}</span>
                                  </div>
                                  <span className="rounded-full bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wide">
                                    Not Submitted
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-1 font-medium">
                                  {ms.reason || 'Check-in was required but no hourly work log was submitted for this slot.'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="glass-surface rounded-2xl border border-emerald-500/30 p-6 text-center space-y-1.5 shadow-2xs">
                            <CheckCircle2Icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
                            <p className="text-xs font-bold text-navy dark:text-white">All Required Check-ins Submitted</p>
                            <p className="text-[11px] text-slate-400">
                              {developer.name} completed all required hourly check-in slots for this working day.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                  <CalendarIcon className="h-9 w-9 text-slate-400" />
                  <p className="text-xs font-bold text-navy dark:text-white">No Day Selected</p>
                  <p className="text-[11px] text-slate-400 max-w-[220px]">
                    Click any day in the calendar to inspect non-submitted check-in slots and pending tasks for that day.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 px-6 py-4 glass-surface bg-white/40 dark:bg-white/[0.02]">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Developer: <strong className="text-navy dark:text-white">{developer.name}</strong> ({developer.email || 'developer'})
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close Calendar
          </Button>
        </div>
      </div>

      {selectedReviewLog && (
        <ReviewLogFeedbackModal
          isOpen={!!selectedReviewLog}
          onClose={() => setSelectedReviewLog(null)}
          log={{
            ...selectedReviewLog,
            developerName: selectedReviewLog.developerName || developer.name,
            developerInitials: selectedReviewLog.developerInitials || developer.initials,
            developerEmail: selectedReviewLog.developerEmail || developer.email
          }}
          mode={reviewMode}
          onReview={handleExecuteReview}
          busy={isReviewing}
        />
      )}
    </div>
  );
}
