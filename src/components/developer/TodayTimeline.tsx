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

const hours = [
  { slot: 8, label: '8 AM' },
  { slot: 9, label: '9 AM' },
  { slot: 10, label: '10 AM' },
  { slot: 11, label: '11 AM' },
  { slot: 12, label: '12 PM', isLunch: true },
  { slot: 13, label: '1 PM' },
  { slot: 14, label: '2 PM' },
  { slot: 15, label: '3 PM' },
  { slot: 16, label: '4 PM' }
];

interface TodayTimelineProps {
  logs: any[];
  currentSlot?: number;
  teamName?: string;
  onLog: (targetSlot?: number) => void;
}

function LogCard({ log }: { log: any }) {
  const isLate = isLogLate(log);
  const statusMeta = (taskStatusMeta[log.status as TaskStatus] || taskStatusMeta['progress']);
  return (
    <article
      className={`rounded-card border border-l-4 p-4 shadow-card transition-all ${
        isLate
          ? 'border-amber-300 border-l-amber-500 bg-amber-50/30 ring-1 ring-amber-400/40'
          : log.review === 'changes_requested'
          ? 'border-hairline border-l-amber-500 bg-amber-50/20'
          : `border-hairline ${statusMeta.border} bg-white`
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-navy">{log.task}</h3>
          {isLate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-extrabold shadow-xs uppercase tracking-wide">
              ⚠️ Late Submission
            </span>
          )}
        </div>
        <TaskStatusBadge status={log.status} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{log.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
        <span className={`inline-flex items-center gap-1.5 ${isLate ? 'font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300' : ''}`}>
          <TimerIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {log.activeMinutes} active min · {isLate ? `Submitted Late at ${log.submittedAt}` : log.submittedAt}
        </span>
        {log.attachment && (
          <span className="inline-flex items-center gap-1.5">
            <PaperclipIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {log.attachment}
          </span>
        )}
        {log.commits > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <GitCommitVerticalIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {log.commits} commit{log.commits > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p
        className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
          log.review === 'approved'
            ? 'bg-ok-soft text-green-700'
            : log.review === 'changes_requested'
            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
            : log.review === 'rejected'
            ? 'bg-red-100 text-red-800'
            : 'bg-warn-soft text-amber-700'
        }`}
      >
        {log.review === 'approved' ? (
          <>
            <CheckCircle2Icon className="h-3.5 w-3.5" aria-hidden="true" />
            Approved by Team Lead
          </>
        ) : log.review === 'changes_requested' ? (
          <>
            <HighlighterIcon className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            TL Requested Specific Changes & Resubmit
          </>
        ) : log.review === 'rejected' ? (
          <>
            <XIcon className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
            Full Log Rejected (Resubmit Needed)
          </>
        ) : (
          <>
            <TimerIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Pending review
          </>
        )}
      </p>
    </article>
  );
}

export function TodayTimeline({ logs, currentSlot, onLog }: TodayTimelineProps) {
  const slot = currentSlot ?? new Date().getHours();

  return (
    <section aria-label="Today's timeline" className="rounded-card border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <h2 className="text-sm font-bold text-navy">Today&apos;s Timeline</h2>
        <p className="text-xs text-gray-500">8:00 AM – 4:30 PM workday</p>
      </div>

      <ol className="px-5 py-4">
        {hours.map((hour, index) => {
          const slotLogs = logs.filter((entry) => entry.hourSlot === hour.slot);
          const isCurrent = hour.slot === slot;
          const isFuture = hour.slot > slot;
          const isPast = hour.slot < slot;
          const hasLogs = slotLogs.length > 0;

          const dotTone = hour.isLunch
            ? 'bg-amber-400'
            : hasLogs
            ? slotLogs.some((l) => l.review === 'changes_requested')
              ? 'bg-amber-500'
              : slotLogs.some((l) => l.review === 'rejected')
              ? 'bg-red-500'
              : slotLogs.some((l) => isLogLate(l))
              ? 'bg-amber-500'
              : 'bg-ok'
            : isCurrent
            ? 'bg-warn dt-pulse'
            : isPast
            ? 'bg-red-200'
            : 'bg-gray-300';

          return (
            <li key={hour.slot} className="flex gap-4">
              <span className="w-14 shrink-0 pt-1 text-right text-xs font-semibold tabular-nums text-gray-500">
                {hour.label}
              </span>

              <div className="flex w-4 shrink-0 flex-col items-center">
                <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${dotTone}`} aria-hidden="true" />
                {index < hours.length - 1 && <span className="w-px flex-1 bg-gray-200" aria-hidden="true" />}
              </div>

              <div className={`min-w-0 flex-1 ${index < hours.length - 1 ? 'pb-4' : ''}`}>
                {/* Lunch Break Display (12 PM - 1 PM) */}
                {hour.isLunch ? (
                  <article className="rounded-card border border-amber-200 bg-amber-50/70 p-4 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-base">
                        🍱
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-amber-950">Lunch Break (12:00 PM – 1:00 PM)</h3>
                          <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                            Break Time
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-amber-800">
                          No check-in or work log required during lunch break. Enjoy your lunch!
                        </p>
                      </div>
                    </div>
                  </article>
                ) : isCurrent ? (
                  /* Current hour slot display */
                  <div className="space-y-3">
                    {hasLogs ? (
                      <>
                        <div className="rounded-card border border-emerald-300 bg-emerald-50/70 p-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <h4 className="text-xs font-bold text-emerald-950">Current Hour Slot ({hour.label})</h4>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                                {slotLogs.length} log{slotLogs.length > 1 ? 's' : ''} submitted
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-emerald-700">You can submit additional logs before this hour ends.</p>
                          </div>
                          <Button size="sm" onClick={() => onLog(hour.slot)} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-1 px-3">
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
                      <article className="flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-dashed border-amber-300 bg-warn-soft p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-amber-900">Current hour in progress</h3>
                            <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-semibold text-amber-900">0 logs submitted</span>
                          </div>
                          <p className="mt-1 text-xs text-amber-800">
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
                      <div className="rounded-card border border-red-200 bg-red-50/40 p-3 text-xs text-red-700 flex items-center justify-between">
                        <span>Missed check-in for {hour.label} (0 logs submitted)</span>
                        <button onClick={() => onLog(hour.slot)} className="text-xs font-semibold text-red-700 underline hover:text-red-900">
                          Submit Late Log
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Future hour slot display */}
                {isFuture && <p className="pt-1.5 text-xs text-gray-400">Upcoming — nothing to log yet</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

