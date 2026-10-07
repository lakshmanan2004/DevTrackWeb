import React, { useMemo, useState } from 'react';
import {
  CalendarIcon,
  XIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckSquareIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TaskStatusBadge } from '../ui/TaskStatusBadge';
import { useCalendar, useMyLogs } from '../../hooks/useLive';
import { TaskStatus } from '../../types';

export interface CalendarDayStatus {
  dateNum: number;
  dateStr: string;
  fullLabel: string;
  status: 'approved' | 'pending' | 'absent' | 'off' | 'weekend' | 'holiday';
  holidayName?: string;
  isHoliday?: boolean;
  tasksCount: number;
  approvedCount?: number;
  pendingCount?: number;
  missedCount?: number;
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

export function DeveloperCalendarWidget() {
  const navigate = useNavigate();
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const month = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const { data: cal } = useCalendar(month);
  const { data: logData } = useMyLogs();
  const todayLogs = logData?.logs || [];
  const days: CalendarDayStatus[] = cal?.days || [];

  const isTodayHoliday = !!(logData as any)?.isHoliday || !!(logData?.stats as any)?.isHoliday;
  const todayHolidayName = (logData as any)?.holiday?.name || (logData?.stats as any)?.holidayName || 'Holiday';

  const [selectedDay, setSelectedDay] = useState<CalendarDayStatus | null>(null);

  const pendingCount = days.filter((d) => d.status === 'pending').length;
  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const firstDow = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();

  const dayCellStyles: Record<string, string> = {
    approved: 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 ring-2 ring-emerald-400/30',
    pending: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 ring-2 ring-amber-400/40 animate-pulse',
    absent: 'bg-rose-500 text-white shadow-sm hover:bg-rose-600',
    holiday: 'bg-purple-600 text-white shadow-sm hover:bg-purple-700 ring-2 ring-purple-400/40',
    off: 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border dark:border-white/10',
    weekend: 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-900/80 dark:text-slate-500 dark:border-white/10'
  };

  return (
    <div className="grid gap-6 items-start md:grid-cols-2">
      {/* LEFT SIDE: TODAY'S ASSIGNED & LOGGED WORK */}
      <div className="glass-card flex flex-col rounded-3xl p-6 shadow-glass">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 text-brand shadow-glass">
              <CheckSquareIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-navy">Today&apos;s Assigned &amp; Logged Work</h2>
              <p className="text-xs font-medium text-slate-500">{todayLogs.length} items · {todayLabel}</p>
            </div>
          </div>
          <span className="rounded-full bg-brand/10 border border-brand/20 px-3 py-1 text-xs font-bold text-brand shadow-2xs">
            Today
          </span>
        </div>

        <div className="pt-4 space-y-3">
          {todayLogs.length === 0 && (
            isTodayHoliday ? (
              <div className="rounded-2xl border border-purple-200/70 bg-purple-50/60 backdrop-blur-md p-5 text-center shadow-glass">
                <div className="text-3xl mb-1.5">🎉</div>
                <div className="text-xs font-bold text-purple-950">
                  Organization Holiday: {todayHolidayName}
                </div>
                <p className="text-[11px] font-medium text-purple-800 mt-1">
                  Today is marked as an organization holiday — no hourly check-ins required.
                </p>
              </div>
            ) : (
              <div className="py-10 text-center text-xs font-medium text-slate-400">
                No logs submitted yet today — submit your hourly check-in.
              </div>
            )
          )}
          {todayLogs.map((log: any) => (
            <div
              key={log.id}
              className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 transition-all duration-200 ${
                log.review === 'changes_requested'
                  ? 'border-amber-300/80 bg-amber-50/60 shadow-glass'
                  : 'border-white/80 bg-white/60 backdrop-blur-md hover:bg-white/90 hover:shadow-glass'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-900/5 px-2 py-0.5 text-[11px] font-bold text-navy">
                    {log.hourLabel}
                  </span>
                  <h3 className="truncate text-xs font-bold text-navy">{log.task}</h3>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{log.wordCount} words</span>
                  <span>·</span>
                  <span
                    className={
                      log.review === 'approved'
                        ? 'font-semibold text-emerald-600'
                        : log.review === 'changes_requested'
                        ? 'font-bold text-amber-600'
                        : 'text-slate-500'
                    }
                  >
                    {log.review === 'approved'
                      ? 'Approved'
                      : log.review === 'changes_requested'
                      ? 'Changes Requested'
                      : 'Pending Review'}
                  </span>
                </div>
              </div>

              <TaskStatusBadge status={log.status as TaskStatus} />
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-200/60 pt-3 text-right">
          <Link
            to="/developer/logs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
          >
            View All Work Logs <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE: MONTHLY LOG PROGRESS CALENDAR */}
      <div className="glass-card flex flex-col rounded-3xl p-6 shadow-glass">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 shadow-glass">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-navy">
                {monthLabel}
              </h2>
              <p className="text-xs font-medium text-slate-500">Monthly Task Status &amp; Pending Calendar</p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs">
            <ClockIcon className="h-3.5 w-3.5" />
            {pendingCount} Pending
          </span>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-2">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-1">
            {Array.from({ length: firstDow }, (_, i) => <div key={`off-${i}`} className="h-9" />)}
            {days.map((day) => (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDay(day)}
                title={`${day.fullLabel} — ${(day.isHoliday ? 'HOLIDAY (' + (day.holidayName || 'Holiday') + ')' : day.status).toUpperCase()} (${day.tasksCount} tasks)`}
                className={`flex h-9 w-full items-center justify-center rounded-xl text-xs font-extrabold transition-all duration-150 transform hover:scale-105 active:scale-95 cursor-pointer shadow-glass ${
                  dayCellStyles[day.status]
                }`}
              >
                {day.dateNum}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200/60 pt-3.5">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300/40" />
              <span className="font-semibold text-slate-700">All Approved / Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300/40 animate-pulse" />
              <span className="font-bold text-amber-800">Pending Feedback</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-300/40" />
              <span className="font-semibold text-slate-700">Absent / Missing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600 ring-2 ring-purple-300/40" />
              <span className="font-bold text-purple-800">🎉 Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 ring-1 ring-slate-400/30" />
              <span className="font-semibold text-slate-500">Off / Weekend</span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200/60 pt-3 text-right">
          <Link
            to="/developer/pending"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline"
          >
            View All Pending Works <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* DATE DETAILS MODAL */}
      {selectedDay && (
        <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-slate-950/40 p-4 sm:p-6 backdrop-blur-md animate-in fade-in">
          <div className="glass-modal relative w-full max-w-xl rounded-3xl p-6 shadow-glass-modal">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white font-extrabold text-sm shadow-glass ${
                    dayCellStyles[selectedDay.status]
                  }`}
                >
                  {selectedDay.dateNum}
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">{selectedDay.fullLabel}</h3>
                  <p className="text-xs font-medium text-slate-500">
                    Active: {selectedDay.activeTime} · {selectedDay.tasksCount} Tasks Logged
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-navy transition-colors cursor-pointer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
              {selectedDay.notes && (
                <div
                  className={`rounded-2xl border p-3.5 text-xs font-semibold ${
                    selectedDay.isHoliday || selectedDay.status === 'holiday'
                      ? 'border-purple-300/80 bg-purple-50/70 text-purple-950'
                      : 'border-amber-200/80 bg-amber-50/70 text-amber-900'
                  }`}
                >
                  {selectedDay.isHoliday || selectedDay.status === 'holiday' ? '🎉' : '💡'} {selectedDay.notes}
                </div>
              )}

              {selectedDay.isHoliday || selectedDay.status === 'holiday' ? (
                <div className="rounded-2xl border border-purple-200/80 bg-purple-50/60 backdrop-blur-md p-6 text-center shadow-glass">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-2xl shadow-inner">
                    🎉
                  </div>
                  <h4 className="mt-3 text-sm font-black text-purple-950">
                    {selectedDay.holidayName || 'Organization Holiday'}
                  </h4>
                  <p className="mt-1 text-xs text-purple-800">
                    No work check-ins or tasks required for this date.
                  </p>
                </div>
              ) : selectedDay.tasks && selectedDay.tasks.length > 0 ? (
                selectedDay.tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-2xl border p-3.5 ${
                      t.review === 'changes_requested'
                        ? 'border-amber-300/80 bg-amber-50/60 shadow-glass'
                        : 'border-white/80 bg-white/60 backdrop-blur-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-lg bg-slate-900/5 px-2 py-0.5 text-[11px] font-bold text-navy">
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
                          ? 'Changes Requested'
                          : 'Pending'}
                      </Badge>
                    </div>

                    {t.tlNote && (
                      <div className="mt-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-950">
                        <span className="font-bold text-navy">TL Feedback:</span> "{t.tlNote}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-xs font-medium text-slate-400">
                  No work logs or tasks recorded for this date.
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200/60 pt-4">
              <Button variant="secondary" onClick={() => setSelectedDay(null)}>
                Close
              </Button>
              {selectedDay.status === 'pending' && !selectedDay.isHoliday && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(null);
                    navigate('/developer/pending');
                  }}
                  className="btn-glass-primary h-9 px-4 text-xs"
                >
                  <AlertTriangleIcon className="h-4 w-4" />
                  Fix Pending Tasks
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
