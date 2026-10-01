import React, { useMemo, useState } from 'react';
import {
  CalendarIcon,
  XIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  CheckSquareIcon
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
  status: 'approved' | 'pending' | 'absent' | 'off' | 'weekend';
  tasksCount: number;
  approvedCount: number;
  pendingCount: number;
  missedCount?: number;
  missedSlots?: string[];
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

  const [selectedDay, setSelectedDay] = useState<CalendarDayStatus | null>(null);

  const totalApproved = days.reduce((sum, d) => sum + (d.approvedCount || 0), 0);
  const totalPending = days.reduce((sum, d) => sum + (d.pendingCount || 0), 0);
  const totalMissed = days.reduce((sum, d) => sum + (d.missedCount || 0), 0);

  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const firstDow = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();

  const getDayTone = (day: CalendarDayStatus) => {
    const isToday = day.dateStr === todayStr;
    const isPastOrToday = day.dateStr <= todayStr;
    const isWeekend = day.status === 'weekend';
    const isOff = day.status === 'off';

    if (isWeekend || isOff) {
      return 'border-slate-200/70 bg-slate-50/60 text-slate-400 hover:bg-slate-100/80';
    }

    // Has pending / review items
    if (day.pendingCount > 0) {
      return isToday
        ? 'border-amber-300 bg-amber-50/90 text-amber-950 ring-2 ring-brand hover:bg-amber-100 shadow-sm'
        : 'border-amber-200/90 bg-amber-50/70 text-amber-900 hover:bg-amber-100/90 shadow-2xs';
    }

    // All submitted logs approved and no missed slots
    if (day.approvedCount > 0 && (!day.missedCount || day.missedCount === 0)) {
      return isToday
        ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 ring-2 ring-brand hover:bg-emerald-100 shadow-sm'
        : 'border-emerald-200/90 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100/90 shadow-2xs';
    }

    // Has missed slots on past workdays
    if (isPastOrToday && (day.missedCount || 0) > 0) {
      return isToday
        ? 'border-rose-300 bg-rose-50/90 text-rose-950 ring-2 ring-brand hover:bg-rose-100 shadow-sm'
        : 'border-rose-200/90 bg-rose-50/70 text-rose-900 hover:bg-rose-100/90 shadow-2xs';
    }

    // Normal workday
    return isToday
      ? 'border-blue-300 bg-blue-50/70 text-navy ring-2 ring-brand hover:bg-blue-100 shadow-sm'
      : 'border-slate-200 bg-white text-navy hover:bg-slate-50 shadow-2xs';
  };

  return (
    <div className="grid gap-5 items-start md:grid-cols-2">
      {/* LEFT SIDE: TODAY'S ASSIGNED & LOGGED WORK */}
      <div className="flex flex-col rounded-2xl border border-hairline bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <CheckSquareIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">Today&apos;s Assigned &amp; Logged Work</h2>
              <p className="text-xs text-gray-500">{todayLogs.length} items · {todayLabel}</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand">
            Today
          </span>
        </div>

        <div className="p-4 space-y-3">
          {todayLogs.length === 0 && (
            <p className="py-8 text-center text-xs text-gray-500">No logs yet today — submit your hourly check-in.</p>
          )}
          {todayLogs.map((log: any) => (
            <div
              key={log.id}
              className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition-all ${
                log.review === 'changes_requested'
                  ? 'border-amber-300 bg-amber-50/60'
                  : 'border-hairline bg-canvas hover:bg-white hover:shadow-sm'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-[11px] font-bold text-navy">
                    {log.hourLabel}
                  </span>
                  <h3 className="truncate text-xs font-bold text-navy">{log.task}</h3>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500">
                  <span>{log.wordCount} words</span>
                  <span>·</span>
                  <span
                    className={
                      log.review === 'approved'
                        ? 'font-semibold text-green-600'
                        : log.review === 'changes_requested'
                        ? 'font-bold text-amber-600'
                        : 'text-gray-500'
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

        <div className="border-t border-hairline bg-canvas/60 px-5 py-3 text-right">
          <Link
            to="/developer/logs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            View All Work Logs <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE: MONTHLY LOG PROGRESS CALENDAR */}
      <div className="flex flex-col rounded-2xl border border-hairline bg-white p-5 shadow-card">
        {/* Header with Month & Summary Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">
                {monthLabel}
              </h2>
              <p className="text-xs text-gray-500">Monthly Log Compliance &amp; Review Status</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-800">
              <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
              {totalApproved} Done
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800">
              <ClockIcon className="h-3 w-3 text-amber-600" />
              {totalPending} Pending
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-rose-800">
              <XCircleIcon className="h-3 w-3 text-rose-600" />
              {totalMissed} Missed
            </span>
          </div>
        </div>

        {/* Days Grid */}
        <div className="mt-4">
          <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 pb-2">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {Array.from({ length: firstDow }, (_, i) => <div key={`off-${i}`} className="min-h-[50px]" />)}
            {days.map((day) => {
              const isToday = day.dateStr === todayStr;
              const hasApproved = (day.approvedCount || 0) > 0;
              const hasPending = (day.pendingCount || 0) > 0;
              const hasMissed = (day.missedCount || 0) > 0 && day.status !== 'weekend' && day.status !== 'off' && day.dateStr <= todayStr;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDay(day)}
                  title={`${day.fullLabel}\n• Completed: ${day.approvedCount || 0}\n• Pending: ${day.pendingCount || 0}\n• Missed: ${day.missedCount || 0}`}
                  className={`flex flex-col items-center justify-between rounded-xl p-1.5 min-h-[50px] text-xs font-bold border transition-all duration-150 transform hover:scale-102 cursor-pointer ${
                    getDayTone(day)
                  }`}
                >
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className={`text-[11px] font-extrabold ${isToday ? 'text-brand' : ''}`}>
                      {day.dateNum}
                    </span>
                    {isToday && (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    )}
                  </div>

                  {/* Clean mini badges for counts */}
                  <div className="flex flex-wrap items-center justify-center gap-0.5 w-full pt-1">
                    {hasApproved && (
                      <span className="inline-flex items-center justify-center rounded bg-emerald-200/80 px-1 py-0.2 text-[9px] font-extrabold text-emerald-900 leading-tight">
                        ✓{day.approvedCount}
                      </span>
                    )}
                    {hasPending && (
                      <span className="inline-flex items-center justify-center rounded bg-amber-200/90 px-1 py-0.2 text-[9px] font-extrabold text-amber-950 leading-tight">
                        ⏳{day.pendingCount}
                      </span>
                    )}
                    {hasMissed && (
                      <span className="inline-flex items-center justify-center rounded bg-rose-200/90 px-1 py-0.2 text-[9px] font-extrabold text-rose-950 leading-tight">
                        ✗{day.missedCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean Legend */}
        <div className="mt-4 border-t border-hairline pt-3">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-emerald-100 border border-emerald-300 shrink-0" />
              <span className="text-gray-700"><strong>Completed</strong> (Approved logs)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-amber-100 border border-amber-300 shrink-0" />
              <span className="text-gray-700"><strong>Pending</strong> (Under TL review)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-rose-100 border border-rose-300 shrink-0" />
              <span className="text-gray-700"><strong>Missed</strong> (Unsubmitted slot)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-slate-100 border border-slate-300 shrink-0" />
              <span className="text-gray-500">Weekend / Off day</span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-hairline pt-3">
          <button
            type="button"
            onClick={() => navigate('/developer/pending')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl h-9 px-4 text-xs font-bold bg-brand text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            <span>View All Pending Works &amp; Resubmissions</span>
            <ArrowRightIcon className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* DATE DETAILS MODAL */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-base font-bold text-navy">{selectedDay.fullLabel}</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Total Active Time: <strong className="text-navy">{selectedDay.activeTime}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Daily Metric Cards */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
                <span className="text-xs font-semibold text-emerald-800">Completed</span>
                <p className="mt-1 text-lg font-bold text-emerald-950">{selectedDay.approvedCount || 0}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center">
                <span className="text-xs font-semibold text-amber-800">Pending</span>
                <p className="mt-1 text-lg font-bold text-amber-950">{selectedDay.pendingCount || 0}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-center">
                <span className="text-xs font-semibold text-rose-800">Missed</span>
                <p className="mt-1 text-lg font-bold text-rose-950">{selectedDay.missedCount || 0}</p>
              </div>
            </div>

            {/* Tasks list for that day */}
            <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {selectedDay.notes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-semibold flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{selectedDay.notes}</span>
                </div>
              )}

              {selectedDay.tasks && selectedDay.tasks.length > 0 ? (
                selectedDay.tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-xl border p-3 ${
                      t.review === 'changes_requested'
                        ? 'border-amber-300 bg-amber-50/60'
                        : t.review === 'approved'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-hairline bg-canvas'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-navy/10 px-2 py-0.5 text-[11px] font-bold text-navy">
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
                      <div className="mt-2 rounded-lg border border-amber-200 bg-white p-2 text-xs text-amber-950">
                        <span className="font-bold text-navy">TL Feedback:</span> "{t.tlNote}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-gray-500">
                  No work logs recorded on this date.
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-hairline pt-4">
              <Button variant="secondary" size="md" onClick={() => setSelectedDay(null)}>
                Close
              </Button>
              {selectedDay.pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(null);
                    navigate('/developer/pending');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg h-9 px-4 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <AlertTriangleIcon className="h-4 w-4 text-white" />
                  Fix Pending Items ({selectedDay.pendingCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
