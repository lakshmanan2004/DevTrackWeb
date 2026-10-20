import React from 'react';
import {
  CheckCircle2Icon,
  GitCommitVerticalIcon,
  PaperclipIcon,
  TimerIcon,
  HighlighterIcon,
  XIcon,
  ClockIcon,
  ArrowRightIcon,
  PlusIcon,
  AlertTriangleIcon,
  SparklesIcon,
  CheckIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TaskStatusBadge } from '../ui/TaskStatusBadge';
import { isLogLate } from '../../utils/logTimeliness';
import { useAuth } from '../../context/AuthContext';
import {
  getWorkBlocks,
  getLunchBreak,
  isLogForBlock,
  getCurrentBlockStatus
} from '../../utils/workBlocks';

interface TodayTimelineProps {
  logs: any[];
  currentSlot?: number;
  teamName?: string;
  lunchSlot?: number;
  isHoliday?: boolean;
  holidayName?: string;
  onLog: (targetSlot?: number) => void;
}

function formatTimeUntil(targetHour: number, currentFloat: number): string {
  const diffHours = targetHour - currentFloat;
  if (diffHours <= 0) return 'Opening soon';
  const totalMinutes = Math.round(diffHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

function cleanTitle(rawTitle: string): { mainTitle: string; subtitle: string } {
  const match = rawTitle.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return { mainTitle: match[1].trim(), subtitle: match[2].trim() };
  }
  return { mainTitle: rawTitle, subtitle: '' };
}

function LogCard({ log, lunchSlot = 12 }: { log: any; lunchSlot?: number }) {
  const isLate = isLogLate(log, lunchSlot);
  return (
    <article
      className={`glass-subcard hover-tile relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
        isLate
          ? 'border-amber-300/80 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20'
          : log.review === 'changes_requested'
          ? 'border-amber-300/80 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20'
          : 'border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 hover:bg-white/90 dark:hover:bg-slate-800/90'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-bold tracking-tight text-navy dark:text-white">{log.task}</h4>
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

export function TodayTimeline({
  logs,
  currentSlot: _propCurrentSlot,
  lunchSlot: propLunchSlot,
  isHoliday,
  holidayName,
  onLog
}: TodayTimelineProps) {
  const { user } = useAuth();
  const activeLunchSlot = propLunchSlot ?? user?.lunchSlot ?? 12;

  const now = new Date();
  const timeFloat = now.getHours() + now.getMinutes() / 60;
  const status = getCurrentBlockStatus(now, activeLunchSlot);
  const blocks = getWorkBlocks(activeLunchSlot);
  const lunch = getLunchBreak(activeLunchSlot);

  // Chronological timeline items:
  // 12 PM lunch: Slot 1 (8-10), Slot 2 (10-12), Lunch (12-1), Slot 3 (1-3), Slot 4 (3-5)
  // 11 AM lunch: Slot 1 (8-11), Lunch (11-12), Slot 2 (12-2:30), Slot 3 (2:30-5)
  const timelineItems = activeLunchSlot === 11
    ? [
        { type: 'block' as const, block: blocks[0], slot: blocks[0].slot, label: blocks[0].label, title: blocks[0].displayTitle, duration: `${blocks[0].durationHours.toFixed(1)} hrs` },
        { type: 'lunch' as const, slot: 0, label: lunch.label, title: lunch.displayTitle, duration: `${lunch.durationHours.toFixed(1)} hr` },
        { type: 'block' as const, block: blocks[1], slot: blocks[1].slot, label: blocks[1].label, title: blocks[1].displayTitle, duration: `${blocks[1].durationHours.toFixed(1)} hrs` },
        { type: 'block' as const, block: blocks[2], slot: blocks[2].slot, label: blocks[2].label, title: blocks[2].displayTitle, duration: `${blocks[2].durationHours.toFixed(1)} hrs` }
      ]
    : [
        { type: 'block' as const, block: blocks[0], slot: blocks[0].slot, label: blocks[0].label, title: blocks[0].displayTitle, duration: `${blocks[0].durationHours.toFixed(1)} hrs` },
        { type: 'block' as const, block: blocks[1], slot: blocks[1].slot, label: blocks[1].label, title: blocks[1].displayTitle, duration: `${blocks[1].durationHours.toFixed(1)} hrs` },
        { type: 'lunch' as const, slot: 0, label: lunch.label, title: lunch.displayTitle, duration: `${lunch.durationHours.toFixed(1)} hr` },
        { type: 'block' as const, block: blocks[2], slot: blocks[2].slot, label: blocks[2].label, title: blocks[2].displayTitle, duration: `${blocks[2].durationHours.toFixed(1)} hrs` },
        { type: 'block' as const, block: blocks[3], slot: blocks[3].slot, label: blocks[3].label, title: blocks[3].displayTitle, duration: `${blocks[3].durationHours.toFixed(1)} hrs` }
      ];

  // Calculate day summary metrics
  const totalWorkBlocks = blocks.length;
  const completedBlocksCount = blocks.filter((b) => logs.some((l) => isLogForBlock(l, b.slot, activeLunchSlot))).length;
  const elapsedWorkBlocks = blocks.filter((b) => timeFloat >= b.endHour);
  const missedBlocksCount = elapsedWorkBlocks.filter((b) => !logs.some((l) => isLogForBlock(l, b.slot, activeLunchSlot))).length;

  return (
    <section aria-label="Today's timeline" className="glass-card rounded-3xl p-6 sm:p-7 shadow-glass">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-black text-navy dark:text-white tracking-tight">
              Today&apos;s Timeline
            </h2>
            <span className="rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300/80 dark:border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5">
              {activeLunchSlot === 11 ? '3 Work Blocks · 8h Total' : '4 Work Blocks (2 hrs each) · 8h Total'}
            </span>
            {isHoliday && (
              <span className="rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 text-[10px] font-bold px-3 py-0.5 shadow-2xs">
                🎉 Holiday: {holidayName || 'Holiday'}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {isHoliday
              ? 'Organization Holiday — Work check-ins paused today'
              : activeLunchSlot === 11
              ? '8:00 AM – 5:00 PM schedule (8-11 Morning Sprint, 11-12 Lunch, 12-2:30 Afternoon 1, 2:30-5 Afternoon 2)'
              : '8:00 AM – 5:00 PM schedule (8-10, 10-12, 12-1 Lunch, 1-3, 3-5)'}
          </p>
        </div>

        {/* Live Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold">
            <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{completedBlocksCount} of {totalWorkBlocks} Logged</span>
          </div>
          {missedBlocksCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-100/80 dark:bg-rose-950/50 border border-rose-300/80 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 font-bold">
              <AlertTriangleIcon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>{missedBlocksCount} Missed</span>
            </div>
          )}
          {!isHoliday && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold shadow-2xs ${
              status.isBeforeWork
                ? 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300'
                : status.isLunch
                ? 'bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
                : status.isAfterWork
                ? 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300'
                : 'bg-blue-100/80 dark:bg-blue-950/50 border border-blue-300/80 dark:border-blue-500/30 text-blue-900 dark:text-blue-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                status.isBeforeWork || status.isAfterWork
                  ? 'bg-slate-400'
                  : status.isLunch
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-blue-600 dark:bg-blue-400 animate-pulse'
              }`} />
              <span>
                {status.isBeforeWork
                  ? 'Starts at 8:00 AM'
                  : status.isLunch
                  ? `Lunch Break (${status.minutesLeftInBlock}m left)`
                  : status.isAfterWork
                  ? 'Workday Completed'
                  : `${status.activeBlock.shortLabel} (${status.minutesLeftInBlock}m left)`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Workday Context Banner */}
      {status.isBeforeWork && !isHoliday && (
        <div className="mt-4 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 flex items-center gap-3">
          <span className="text-xl">🌅</span>
          <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 font-medium">
            Good morning! The official workday begins at 8:00 AM. Your first check-in session (Morning Sprint 1) opens at 8:00 AM.
          </p>
        </div>
      )}

      {status.isAfterWork && !isHoliday && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
          <span className="text-xl">🌙</span>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
            The standard workday has concluded (5:00 PM). Review your completed blocks below and make sure to submit your End-of-Day (EOD) summary report.
          </p>
        </div>
      )}

      {/* Main Timeline List */}
      {isHoliday && logs.length === 0 ? (
        <div className="p-8 text-center bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-500/30 my-5 shadow-glass">
          <span className="text-4xl">🎉</span>
          <h3 className="mt-2 text-base font-bold text-purple-950 dark:text-purple-200">Organization Holiday: {holidayName || 'Holiday'}</h3>
          <p className="mt-1 text-xs text-purple-800 dark:text-purple-300 max-w-md mx-auto">
            Today is marked as an organization holiday on the calendar. Check-ins, attendance tracking, and work logs are paused today.
          </p>
        </div>
      ) : (
        <ol className="pt-6">
          {timelineItems.map((item, index) => {
            const isLunch = item.type === 'lunch';
            const slotLogs = !isLunch ? logs.filter((entry) => isLogForBlock(entry, item.slot, activeLunchSlot)) : [];
            const hasLogs = slotLogs.length > 0;

            // Clear, unambiguous timeline state resolution:
            // Exactly one of isCurrent, isPast, or isUpcoming is true for every item.
            let isCurrent = false;
            let isPast = false;
            let isUpcoming = false;

            if (isLunch) {
              isCurrent = timeFloat >= lunch.startHour && timeFloat < lunch.endHour;
              isPast = timeFloat >= lunch.endHour;
              isUpcoming = timeFloat < lunch.startHour;
            } else {
              isCurrent = !status.isBeforeWork && !status.isAfterWork && !status.isLunch && (timeFloat >= item.block.startHour && timeFloat < item.block.endHour);
              isPast = timeFloat >= item.block.endHour;
              isUpcoming = timeFloat < item.block.startHour;
            }

            // Dot tone indicator
            const dotTone = isCurrent
              ? isLunch
                ? 'bg-amber-500 ring-4 ring-amber-400/40 dark:ring-amber-500/30 animate-pulse'
                : 'bg-brand ring-4 ring-blue-400/40 dark:ring-blue-500/30 animate-pulse'
              : isPast
              ? isLunch
                ? 'bg-slate-300 dark:bg-slate-600 ring-4 ring-slate-100 dark:ring-slate-800'
                : hasLogs
                ? slotLogs.some((l) => l.review === 'changes_requested')
                  ? 'bg-amber-500 ring-4 ring-amber-200 dark:ring-amber-950/60'
                  : slotLogs.some((l) => l.review === 'rejected')
                  ? 'bg-rose-500 ring-4 ring-rose-200 dark:ring-rose-950/60'
                  : slotLogs.some((l) => isLogLate(l, activeLunchSlot))
                  ? 'bg-amber-500 ring-4 ring-amber-200 dark:ring-amber-950/60'
                  : 'bg-emerald-500 ring-4 ring-emerald-200 dark:ring-emerald-950/60'
                : 'bg-rose-500 ring-4 ring-rose-200 dark:ring-rose-950/60'
              : 'bg-slate-300 dark:bg-slate-700 ring-4 ring-slate-100 dark:ring-slate-800';

            // Clean title & subtitle extraction
            const { mainTitle, subtitle } = isLunch
              ? { mainTitle: 'Lunch Break & Recharge', subtitle: 'Scheduled Break' }
              : cleanTitle(item.title);

            const timeUntilStr = isUpcoming
              ? formatTimeUntil(isLunch ? lunch.startHour : item.block.startHour, timeFloat)
              : '';

            return (
              <li key={item.slot + '-' + index} className="flex gap-3 sm:gap-4">
                {/* Time & Duration Column */}
                <div className="w-28 sm:w-32 shrink-0 pt-1 text-right">
                  <span className="block text-xs font-mono font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    {item.label}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {item.duration}
                  </span>

                  {/* Clear status pill */}
                  <div className="mt-1">
                    {isCurrent ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                        isLunch
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-500/30'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 dark:border-blue-500/30'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isLunch ? 'bg-amber-500 animate-ping' : 'bg-brand animate-ping'}`} />
                        {isLunch ? 'Lunch' : 'Active'}
                      </span>
                    ) : isPast ? (
                      isLunch ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80">
                          Break Done
                        </span>
                      ) : hasLogs ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30">
                          Logged
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold text-rose-800 dark:text-rose-200 bg-rose-100/90 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/30">
                          Missed
                        </span>
                      )
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>

                {/* Vertical Spine & Node */}
                <div className="flex w-4 shrink-0 flex-col items-center">
                  <span className={`mt-2 h-3.5 w-3.5 shrink-0 rounded-full transition-all ${dotTone}`} aria-hidden="true" />
                  {index < timelineItems.length - 1 && (
                    <span className="w-px flex-1 bg-slate-200/80 dark:bg-white/15 my-1.5" aria-hidden="true" />
                  )}
                </div>

                {/* Content Card Column */}
                <div className={`min-w-0 flex-1 ${index < timelineItems.length - 1 ? 'pb-6' : 'pb-2'}`}>
                  {/* ==================== 1. LUNCH BREAK ==================== */}
                  {isLunch ? (
                    isCurrent ? (
                      /* Active Lunch Break */
                      <article className="hover-tile rounded-2xl border-2 border-amber-400/80 dark:border-amber-500/50 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white dark:from-amber-950/50 dark:via-slate-900/60 dark:to-slate-900/80 p-5 shadow-glass">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/70 text-amber-900 dark:text-amber-100 text-xl shadow-inner">
                              🍱
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100">
                                  Lunch Break & Recharge ({lunch.label})
                                </h3>
                                <span className="rounded-full bg-amber-200/90 dark:bg-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-500/30">
                                  Break in Progress
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300 font-medium">
                                No check-in required. Enjoy your lunch! Afternoon check-ins resume at {lunch.label.split('–')[1]?.trim() || '1:00 PM'}.
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/50 px-3 py-1.5 rounded-xl border border-amber-300/60 dark:border-amber-500/30">
                            {status.minutesLeftInBlock}m remaining
                          </span>
                        </div>
                      </article>
                    ) : isPast ? (
                      /* Past Lunch Break */
                      <div className="hover-tile rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">🍱</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Lunch Break ({lunch.label})
                          </span>
                          <span>· Break Completed</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">
                          1 hr duration
                        </span>
                      </div>
                    ) : (
                      /* Upcoming Lunch Break */
                      <article className="hover-tile rounded-2xl border border-dashed border-amber-200/80 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/20 p-4 transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100/70 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm">
                              🍱
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                                Lunch Break & Recharge
                              </h3>
                              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                                {lunch.label} ({lunch.durationHours} hr) · Scheduled Break (No check-in required)
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/40 border border-amber-200/80 dark:border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
                            <ClockIcon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            Opens in {timeUntilStr}
                          </span>
                        </div>
                      </article>
                    )
                  ) : null}

                  {/* ==================== 2. CURRENT ACTIVE WORK BLOCK ==================== */}
                  {!isLunch && isCurrent ? (
                    <div className="space-y-3">
                      {hasLogs ? (
                        /* Active block with logs submitted */
                        <>
                          <div className="rounded-2xl border-2 border-emerald-400/80 dark:border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/40 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-glass">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <h4 className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100 tracking-tight">
                                  Current Block: {mainTitle}
                                </h4>
                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-500/30">
                                  ✓ {slotLogs.length} log{slotLogs.length > 1 ? 's' : ''} submitted
                                </span>
                              </div>
                              <p className="mt-1 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                                Log submitted for this session. You can add more updates before {item.block.deadlineStr} ({status.minutesLeftInBlock}m left).
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => onLog(item.slot)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 shadow-glass font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <PlusIcon className="h-3.5 w-3.5" />
                              <span>Add Another Update</span>
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {slotLogs.map((log, lIdx) => (
                              <LogCard key={log.id || log._id || lIdx} log={log} lunchSlot={activeLunchSlot} />
                            ))}
                          </div>
                        </>
                      ) : (
                        /* Active block awaiting check-in */
                        <article className="hover-tile rounded-2xl border-2 border-brand/50 dark:border-blue-500/50 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white/90 dark:from-blue-950/40 dark:via-slate-900/60 dark:to-slate-900/80 p-5 shadow-glass">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand"></span>
                                </span>
                                <h3 className="text-sm sm:text-base font-black text-navy dark:text-white tracking-tight">
                                  Current Block in Progress: {mainTitle}
                                </h3>
                                {subtitle && (
                                  <span className="rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                                    {subtitle}
                                  </span>
                                )}
                                <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                                  Awaiting Check-in
                                </span>
                              </div>
                              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                                Work session is underway ({item.label}). Log your progress, completed tasks, or blockers before the block concludes at <strong className="text-navy dark:text-white font-bold">{item.block.deadlineStr}</strong>.
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-brand dark:text-blue-400">
                                <span className="inline-flex items-center gap-1.5 bg-blue-100/80 dark:bg-blue-900/40 px-2.5 py-1 rounded-lg border border-blue-200/80 dark:border-blue-700/50">
                                  <TimerIcon className="h-3.5 w-3.5" />
                                  {status.minutesLeftInBlock}m remaining in this block
                                </span>
                                <span className="text-slate-400 dark:text-slate-500">·</span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  Max limit: {item.block.maxMinutes} mins
                                </span>
                              </div>
                            </div>

                            <Button
                              onClick={() => onLog(item.slot)}
                              className="btn-glass-primary shadow-glass text-xs sm:text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer font-bold"
                            >
                              <span>Check-In for Block</span>
                              <ArrowRightIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </article>
                      )}
                    </div>
                  ) : null}

                  {/* ==================== 3. PAST WORK BLOCK ==================== */}
                  {!isLunch && isPast ? (
                    <div className="space-y-3">
                      {hasLogs ? (
                        <>
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                              <span>{mainTitle} completed ({slotLogs.length} update{slotLogs.length > 1 ? 's' : ''})</span>
                            </span>
                            <span className="text-[11px] text-slate-400">{item.label}</span>
                          </div>
                          {slotLogs.map((log, lIdx) => (
                            <LogCard key={log.id || log._id || lIdx} log={log} lunchSlot={activeLunchSlot} />
                          ))}
                        </>
                      ) : (
                        /* Missed Check-in Alert */
                        <article className="hover-tile rounded-2xl border-2 border-rose-300 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/40 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-glass">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200">
                              <AlertTriangleIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                                  Missed Check-in: {mainTitle}
                                </h3>
                                <span className="rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 px-2 py-0.5 text-[10px] font-bold">
                                  Deadline Passed
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-300 font-medium">
                                The deadline ({item.block.deadlineStr}) passed without a submitted log for this {item.duration} block.
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => onLog(item.slot)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-4 shadow-glass cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Submit Late Log</span>
                            <ArrowRightIcon className="h-3.5 w-3.5" />
                          </Button>
                        </article>
                      )}
                    </div>
                  ) : null}

                  {/* ==================== 4. UPCOMING WORK BLOCK ==================== */}
                  {!isLunch && isUpcoming ? (
                    <article className="hover-tile rounded-2xl border border-dashed border-slate-200/90 dark:border-white/10 bg-slate-50/40 dark:bg-slate-900/30 p-4 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                            <ClockIcon className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {mainTitle}
                              </h3>
                              {subtitle && (
                                <span className="rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 text-[10px] font-semibold">
                                  {subtitle}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              {item.label} · {item.duration} · Check-in opens at {item.label.split('–')[0]?.trim()}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <TimerIcon className="h-3 w-3 text-slate-400" />
                          Opens in {timeUntilStr}
                        </span>
                      </div>
                    </article>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
