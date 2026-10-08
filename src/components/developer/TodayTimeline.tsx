import React from 'react';
import {
  CheckCircle2Icon,
  GitCommitVerticalIcon,
  PaperclipIcon,
  TimerIcon,
  HighlighterIcon,
  XIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TaskStatusBadge, taskStatusMeta } from '../ui/TaskStatusBadge';
import { TaskStatus } from '../../types';
import { isLogLate } from '../../utils/logTimeliness';
import { useAuth } from '../../context/AuthContext';

const baseHours = [
  { slot: 8, label: '8 AM' },
  { slot: 9, label: '9 AM' },
  { slot: 10, label: '10 AM' },
  { slot: 11, label: '11 AM' },
  { slot: 12, label: '12 PM' },
  { slot: 13, label: '1 PM' },
  { slot: 14, label: '2 PM' },
  { slot: 15, label: '3 PM' },
  { slot: 16, label: '4 PM' }
];

interface TodayTimelineProps {
  logs: any[];
  currentSlot?: number;
  teamName?: string;
  lunchSlot?: number;
  isHoliday?: boolean;
  holidayName?: string;
  onLog: (targetSlot?: number) => void;
}

function LogCard({ log }: { log: any }) {
  const isLate = isLogLate(log);
  const statusMeta = (taskStatusMeta[log.status as TaskStatus] || taskStatusMeta['progress']);
  return (
    <article
      className={`glass-card relative overflow-hidden rounded-2xl border p-4 shadow-glass transition-all duration-200 ${
        isLate
          ? 'border-amber-300/80 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20'
          : log.review === 'changes_requested'
          ? 'border-amber-300/80 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20'
          : 'border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 hover:bg-white/90 dark:hover:bg-slate-800/90'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight text-navy dark:text-white">{log.task}</h3>
          {isLate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/30 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
              ⚠️ Late Submission
            </span>
          )}
        </div>
        <TaskStatusBadge status={log.status} />
      </div>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-normal">{log.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span className={`inline-flex items-center gap-1.5 ${isLate ? 'font-bold text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/30' : 'text-slate-500 dark:text-slate-400'}`}>
          <TimerIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {log.activeMinutes} active min · {isLate ? `Submitted Late at ${log.submittedAt}` : log.submittedAt}
        </span>
        {log.attachment && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
            <PaperclipIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {log.attachment}
          </span>
        )}
        {log.commits > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
            <GitCommitVerticalIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {log.commits} commit{log.commits > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p
        className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold shadow-2xs ${
          log.review === 'approved'
            ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-500/40'
            : log.review === 'changes_requested'
            ? 'bg-amber-500/15 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-500/30 dark:border-amber-500/40 font-bold'
            : log.review === 'rejected'
            ? 'bg-rose-500/10 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-500/20 dark:border-rose-500/40'
            : 'bg-blue-500/10 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/40'
        }`}
      >
        {log.review === 'approved' ? (
          <>
            <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Approved by Team Lead
          </>
        ) : log.review === 'changes_requested' ? (
          <>
            <HighlighterIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            TL Requested Specific Changes & Resubmit
          </>
        ) : log.review === 'rejected' ? (
          <>
            <XIcon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            Full Log Rejected (Resubmit Needed)
          </>
        ) : (
          <>
            <TimerIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            Pending review
          </>
        )}
      </p>
    </article>
  );
}

export function TodayTimeline({ logs, currentSlot, lunchSlot: propLunchSlot, isHoliday, holidayName, onLog }: TodayTimelineProps) {
  const { user } = useAuth();
  const activeLunchSlot = propLunchSlot ?? user?.lunchSlot ?? 12;
  const slot = currentSlot ?? new Date().getHours();

  const hours = baseHours.map((h) => ({
    ...h,
    isLunch: h.slot === activeLunchSlot
  }));

  return (
    <section aria-label="Today's timeline" className="glass-card rounded-3xl p-6 sm:p-7 shadow-glass">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-navy dark:text-white flex items-center gap-2.5">
            Today&apos;s Timeline
            {isHoliday && (
              <span className="rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 text-[10px] font-bold px-3 py-0.5 shadow-2xs">
                🎉 Holiday: {holidayName || 'Holiday'}
              </span>
            )}
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {isHoliday ? 'Organization Holiday — Work check-ins paused today' : '8:00 AM – 5:00 PM standard workday schedule'}
          </p>
        </div>

      </div>

      {isHoliday && logs.length === 0 ? (
        <div className="p-8 text-center bg-purple-50/40 dark:bg-purple-950/30 backdrop-blur-md rounded-2xl border border-purple-200/80 dark:border-purple-500/30 my-5 shadow-glass">
          <span className="text-4xl">🎉</span>
          <h3 className="mt-2 text-base font-bold text-purple-950 dark:text-purple-200">Organization Holiday: {holidayName || 'Holiday'}</h3>
          <p className="mt-1 text-xs text-purple-800 dark:text-purple-300 max-w-md mx-auto">
            Today is marked as an organization holiday on the calendar. Check-ins, attendance tracking, and work logs are paused today.
          </p>
        </div>
      ) : (
        <ol className="pt-6">
          {hours.map((hour, index) => {
            const slotLogs = logs.filter((entry) => entry.hourSlot === hour.slot);
            const isCurrent = hour.slot === slot;
            const isFuture = hour.slot > slot;
            const isPast = hour.slot < slot;
            const hasLogs = slotLogs.length > 0;

            const dotTone = hour.isLunch
              ? 'bg-amber-400 ring-4 ring-amber-100 dark:ring-amber-950/60'
              : hasLogs
              ? slotLogs.some((l) => l.review === 'changes_requested')
                ? 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950/60'
                : slotLogs.some((l) => l.review === 'rejected')
                ? 'bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950/60'
                : slotLogs.some((l) => isLogLate(l))
                ? 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950/60'
                : 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/60'
              : isHoliday
              ? 'bg-purple-200 ring-4 ring-purple-100 dark:ring-purple-950/60'
              : isCurrent
              ? 'bg-brand ring-4 ring-blue-100 dark:ring-sky-950/60 animate-pulse'
              : isPast
              ? 'bg-rose-300 ring-4 ring-rose-100 dark:ring-rose-950/60'
              : 'bg-slate-300 dark:bg-slate-700 ring-4 ring-slate-100 dark:ring-slate-800';

          return (
            <li key={hour.slot} className="flex gap-4">
              <span className="w-14 shrink-0 pt-1 text-right text-xs font-mono font-bold tabular-nums text-slate-500 dark:text-slate-300">
                {hour.label}
              </span>

              <div className="flex w-4 shrink-0 flex-col items-center">
                <span className={`mt-2 h-3 w-3 shrink-0 rounded-full ${dotTone}`} aria-hidden="true" />
                {index < hours.length - 1 && <span className="w-px flex-1 bg-slate-200/80 dark:bg-white/15 my-1" aria-hidden="true" />}
              </div>

              <div className={`min-w-0 flex-1 ${index < hours.length - 1 ? 'pb-5' : ''}`}>
                {/* Lunch Break Display (11 AM - 12 PM or 12 PM - 1 PM) */}
                {hour.isLunch ? (
                  <article className="rounded-2xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/30 backdrop-blur-md p-4 shadow-glass flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-base shadow-inner">
                        🍱
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                            Lunch Break ({activeLunchSlot === 11 ? '11:00 AM – 12:00 PM' : '12:00 PM – 1:00 PM'})
                          </h3>
                          <span className="rounded-full bg-amber-200/80 dark:bg-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-500/30">
                            Break Time
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                          No check-in or work log required during your lunch break. Enjoy your lunch!
                        </p>
                      </div>
                    </div>
                  </article>
                ) : isCurrent ? (
                  /* Current hour slot display */
                  <div className="space-y-3">
                    {hasLogs ? (
                      <>
                        <div className="rounded-2xl border border-emerald-300/80 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 backdrop-blur-md p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-glass">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Current Hour Slot ({hour.label})</h4>
                              <span className="rounded-full bg-emerald-100/90 dark:bg-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-500/30">
                                {slotLogs.length} log{slotLogs.length > 1 ? 's' : ''} submitted
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">You can submit additional logs before this hour ends.</p>
                          </div>
                          <Button size="sm" onClick={() => onLog(hour.slot)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3.5 shadow-glass">
                            + Add Another Log
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {slotLogs.map((log, lIdx) => (
                            <LogCard key={log.id || log._id || lIdx} log={log} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <article className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/30 backdrop-blur-md p-5 shadow-glass">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Current hour in progress</h3>
                            <span className="rounded-full bg-amber-200/80 dark:bg-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-500/30">0 logs submitted</span>
                          </div>
                          <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                            Log your work for this hour before it ends
                          </p>
                        </div>
                        <Button onClick={() => onLog(hour.slot)}>Submit Now</Button>
                      </article>
                    )}
                  </div>
                ) : null}

                {/* Past hour slot display */}
                {isPast && (
                  <div className="space-y-3">
                    {hasLogs ? (
                      slotLogs.map((log, lIdx) => (
                        <LogCard key={log.id || log._id || lIdx} log={log} />
                      ))
                    ) : !hour.isLunch ? (
                      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/30 backdrop-blur-md p-3.5 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between shadow-2xs">
                        <span className="font-medium">Missed check-in for {hour.label} (0 logs submitted)</span>
                        <button onClick={() => onLog(hour.slot)} className="text-xs font-bold text-rose-700 dark:text-rose-300 underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer">
                          Submit Late Log
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Future hour slot display */}
                {isFuture && <p className="pt-1.5 text-xs font-medium text-slate-400">Upcoming — nothing to log yet</p>}
              </div>
            </li>
          );
        })}
      </ol>
      )}
    </section>
  );
}

