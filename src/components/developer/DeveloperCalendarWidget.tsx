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
    off: 'bg-slate-200 text-slate-600 hover:bg-slate-300',
    weekend: 'bg-slate-100 text-slate-400 border border-slate-200'
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
            isTodayHoliday ? (
              <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 text-center">
                <div className="text-2xl mb-1">🎉</div>
                <div className="text-xs font-bold text-purple-950">
                  Organization Holiday: {todayHolidayName}
                </div>
                <p className="text-[11px] text-purple-800 mt-1">
                  Today is marked as an organization holiday — no hourly check-ins required.
                </p>
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-gray-500">No logs yet today — submit your hourly check-in.</p>
            )
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
      <div className="flex flex-col rounded-2xl border border-amber-300/80 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wider">
                {monthLabel}
              </h2>
              <p className="text-xs text-amber-800">Monthly Task Status &amp; Pending Calendar</p>
            </div>
          </div>

          <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <ClockIcon className="h-3.5 w-3.5" />
            {pendingCount} Pending
          </span>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-500 pb-2">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-1">
            {Array.from({ length: firstDow }, (_, i) => <div key={`off-${i}`} className="h-9" />)}
            {days.map((day) => (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDay(day)}
                title={`${day.fullLabel} — ${(day.isHoliday ? 'HOLIDAY (' + (day.holidayName || 'Holiday') + ')' : day.status).toUpperCase()} (${day.tasksCount} tasks)`}
                className={`flex h-9 w-full items-center justify-center rounded-xl text-xs font-extrabold transition-all duration-150 transform hover:scale-105 cursor-pointer ${
                  dayCellStyles[day.status]
                }`}
              >
                {day.dateNum}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-hairline pt-3">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-emerald-500" />
              <span className="font-semibold text-navy">All Approved / Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-amber-500 animate-pulse" />
              <span className="font-bold text-amber-900">Pending Work / Feedback</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-rose-500" />
              <span className="font-semibold text-navy">Absent / Missing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-purple-600" />
              <span className="font-bold text-purple-900">🎉 Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-slate-200 border border-slate-300" />
              <span className="font-semibold text-gray-500">Off / Weekend</span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-hairline pt-3">
          <button
            type="button"
            onClick={() => navigate('/developer/pending')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl h-10 px-4 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm cursor-pointer"
          >
            <span>View All Pending Works</span>
            <ArrowRightIcon className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* DATE DETAILS MODAL */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-extrabold text-sm ${
                    dayCellStyles[selectedDay.status]
                  }`}
                >
                  {selectedDay.dateNum}
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">{selectedDay.fullLabel}</h3>
                  <p className="text-xs text-gray-500">
                    Active: {selectedDay.activeTime} · {selectedDay.tasksCount} Tasks Logged
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy cursor-pointer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
              {selectedDay.notes && (
                <div
                  className={`rounded-xl border p-3 text-xs font-semibold ${
                    selectedDay.isHoliday || selectedDay.status === 'holiday'
                      ? 'border-purple-300 bg-purple-50 text-purple-950'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  {selectedDay.isHoliday || selectedDay.status === 'holiday' ? '🎉' : '💡'} {selectedDay.notes}
                </div>
              )}

              {selectedDay.isHoliday || selectedDay.status === 'holiday' ? (
                <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-5 text-center">
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
                    className={`rounded-xl border p-3.5 ${
                      t.review === 'changes_requested'
                        ? 'border-amber-300 bg-amber-50/60'
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
                      <div className="mt-2.5 rounded-lg border border-amber-200 bg-white p-2.5 text-xs text-amber-950">
                        <span className="font-bold text-navy">TL Feedback:</span> "{t.tlNote}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-gray-500">
                  No work logs or tasks recorded for this date.
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-hairline pt-4">
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl h-9 px-4 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm cursor-pointer"
                >
                  <AlertTriangleIcon className="h-4 w-4 text-white" />
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
