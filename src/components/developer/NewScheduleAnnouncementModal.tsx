import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  SparklesIcon,
  XIcon,
  GitCommitVerticalIcon,
  ShieldAlertIcon,
  ArrowRightIcon,
  ClockIcon,
  UtensilsIcon,
  CheckIcon,
  RotateCwIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getWorkBlocks, getLunchBreak } from '../../utils/workBlocks';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

interface NewScheduleAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  lunchSlot?: number;
}

export function NewScheduleAnnouncementModal({ open, onClose, lunchSlot = 12 }: NewScheduleAnnouncementModalProps) {
  const { user, refresh } = useAuth();
  const currentAssignedSlot = user?.lunchSlot ?? lunchSlot;
  const [selectedSchedule, setSelectedSchedule] = useState<number>(currentAssignedSlot);
  const [isUpdating, setIsUpdating] = useState(false);
  const [switchSuccess, setSwitchSuccess] = useState(false);

  useEffect(() => {
    setSelectedSchedule(user?.lunchSlot ?? lunchSlot);
  }, [user?.lunchSlot, lunchSlot]);

  if (!open) return null;

  const handleAcknowledge = () => {
    localStorage.setItem('devtrack_schedule_v2_seen', 'true');
    onClose();
  };

  const handleSwitchSchedule = async (newSlot: number) => {
    setIsUpdating(true);
    setSwitchSuccess(false);
    try {
      await api('/api/users/profile', { method: 'PATCH', body: { lunchSlot: newSlot } });
      await refresh();
      setSwitchSuccess(true);
      setTimeout(() => setSwitchSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update lunch slot', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const is12Lunch = selectedSchedule === 12;
  const lunch = getLunchBreak(selectedSchedule);

  return (
    <div
      className="glass-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      {/* 
        Fix radius clipping:
        1. max-h-[min(92vh,760px)] ensures modal card never hits screen edges.
        2. flex flex-col with flex-1 on body allows inner scrolling while keeping rounded-3xl intact.
        3. rounded-t-3xl and rounded-b-3xl on header & footer prevent any background bleed.
      */}
      <div className="glass-modal w-full max-w-[620px] max-h-[min(92vh,760px)] flex flex-col my-auto overflow-hidden p-0 shadow-2xl border border-blue-500/30 dark:border-blue-400/20 rounded-3xl animate-scale-in">
        {/* Header */}
        <div className="shrink-0 rounded-t-3xl relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900 p-5 sm:p-6 text-white border-b border-white/10">
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-inner shrink-0">
                <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    Schedule Announcement
                  </span>
                  <span className="rounded-full bg-emerald-400/25 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200 border border-emerald-400/30">
                    Both Schedules Supported
                  </span>
                </div>
                <h2 id="schedule-modal-title" className="text-base sm:text-xl font-black tracking-tight text-white mt-1">
                  {is12Lunch ? '4-Block Schedule (12 PM Lunch)' : '3-Block Schedule (11 AM Lunch)'}
                </h2>
                <p className="text-xs text-blue-100 font-medium">
                  {is12Lunch
                    ? '8 to 10, 10 to 12, 12 to 1 Lunch, 1 to 3, 3 to 5 (4 equal 2-hour sprints).'
                    : '8 to 11, 11 to 12 Lunch, 12 to 2:30, 2:30 to 5 (3 balanced work blocks).'}
                </p>
              </div>
            </div>

            <button
              onClick={handleAcknowledge}
              className="text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4">
          {/* Dual Schedule Switcher Tabs */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Explore Work Schedules:
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Your assigned: <strong className="text-blue-600 dark:text-blue-400">{currentAssignedSlot === 12 ? '12 PM Lunch' : '11 AM Lunch'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 gap-1.5 shadow-inner">
              {/* Tab 1: 12 PM Lunch */}
              <button
                type="button"
                onClick={() => setSelectedSchedule(12)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                  is12Lunch
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <UtensilsIcon className="h-3.5 w-3.5" />
                  <span>12 PM – 1 PM Lunch</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    is12Lunch ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : 'text-slate-400'
                  }`}>
                    4 x 2-Hr Blocks
                  </span>
                  {currentAssignedSlot === 12 && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      ✓ Active
                    </span>
                  )}
                </div>
              </button>

              {/* Tab 2: 11 AM Lunch */}
              <button
                type="button"
                onClick={() => setSelectedSchedule(11)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                  !is12Lunch
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <UtensilsIcon className="h-3.5 w-3.5" />
                  <span>11 AM – 12 PM Lunch</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    !is12Lunch ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : 'text-slate-400'
                  }`}>
                    3 Work Blocks
                  </span>
                  {currentAssignedSlot === 11 && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      ✓ Active
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Quick Switch Button if inspecting alternate schedule */}
          {currentAssignedSlot !== selectedSchedule && (
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs animate-fade-in">
              <span className="text-blue-900 dark:text-blue-200 text-[11px] font-medium">
                Does your team follow this lunch break?
              </span>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleSwitchSchedule(selectedSchedule)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm transition-colors cursor-pointer flex items-center gap-1"
              >
                {isUpdating ? (
                  <RotateCwIcon className="h-3.5 w-3.5 animate-spin" />
                ) : switchSuccess ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Updated!</span>
                  </>
                ) : (
                  <span>Set as My Active Schedule</span>
                )}
              </button>
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            To eliminate micro-management and give you uninterrupted flow state, your day is structured as follows:
          </p>

          {/* Schedule Blocks */}
          <div className="grid gap-2.5 sm:gap-3">
            {is12Lunch ? (
              <>
                {/* Slot 1: 8 - 10 AM */}
                <div className="flex items-start gap-3 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold shrink-0 text-xs">
                    1
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        🌅 Morning Sprint 1
                      </h4>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-100/70 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                        8:00 AM – 10:00 AM · 2.0 hrs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Daily kick-off and initial implementation. <strong>Check-in submitted at 10:00 AM</strong>.
                    </p>
                  </div>
                </div>

                {/* Slot 2: 10 - 12 PM */}
                <div className="flex items-start gap-3 p-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold shrink-0 text-xs">
                    2
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        🚀 Morning Sprint 2 (Pre-Lunch)
                      </h4>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-100/70 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">
                        10:00 AM – 12:00 PM · 2.0 hrs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Core feature development and standup sync. <strong>Check-in submitted at 12:00 PM</strong> before lunch.
                    </p>
                  </div>
                </div>

                {/* Lunch Break: 12 - 1 PM */}
                <div className="flex items-start gap-3 p-3 rounded-2xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-sm shrink-0">
                    🍱
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        Lunch Break & Recharge (Excused)
                      </h4>
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 font-mono bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                        12:00 PM – 1:00 PM · 1.0 hr
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      No check-ins required. Automated notifications and monitoring are paused.
                    </p>
                  </div>
                </div>

                {/* Slot 3: 1 - 3 PM */}
                <div className="flex items-start gap-3 p-3 rounded-2xl border border-sky-200/80 dark:border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold shrink-0 text-xs">
                    3
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        ⚡ Afternoon Sprint 1 (Post-Lunch)
                      </h4>
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 font-mono bg-sky-100/70 dark:bg-sky-900/40 px-2 py-0.5 rounded-md">
                        1:00 PM – 3:00 PM · 2.0 hrs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Post-lunch coding and API integration. <strong>Check-in submitted at 3:00 PM</strong>.
                    </p>
                  </div>
                </div>

                {/* Slot 4: 3 - 5 PM */}
                <div className="flex items-start gap-3 p-3 rounded-2xl border border-purple-200/80 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold shrink-0 text-xs">
                    4
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        🏁 Afternoon Sprint 2 & EOD Wrap-up
                      </h4>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 font-mono bg-purple-100/70 dark:bg-purple-900/40 px-2 py-0.5 rounded-md">
                        3:00 PM – 5:00 PM · 2.0 hrs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      PR reviews, testing, bug fixes, and end-of-day summary. <strong>Check-in submitted at 5:00 PM</strong>.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 11 AM Lunch Schedule */}
                <div className="flex items-start gap-3 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold shrink-0 text-xs">
                    1
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        🌅 Morning Sprint (Pre-Lunch)
                      </h4>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-100/70 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                        8:00 AM – 11:00 AM · 3.0 hrs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Deep morning focus. <strong>Check-in submitted at 11:00 AM</strong> before lunch.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-sm shrink-0">
                    🍱
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        Lunch Break & Recharge (Excused)
                      </h4>
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 font-mono bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                        11:00 AM – 12:00 PM · 1.0 hr
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      No check-ins required. Automated notifications and monitoring paused.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold shrink-0 text-xs">
                    2
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        ⚡ Afternoon Sprint 1
                      </h4>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-100/70 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">
                        12:00 PM – 2:30 PM · 2.5 hrs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Feature implementation. <strong>Check-in submitted at 2:30 PM</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl border border-purple-200/80 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold shrink-0 text-xs">
                    3
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        🏁 Afternoon Sprint 2 & EOD Wrap-up
                      </h4>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 font-mono bg-purple-100/70 dark:bg-purple-900/40 px-2 py-0.5 rounded-md">
                        2:30 PM – 5:00 PM · 2.5 hrs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Review, bug fixes, and EOD sync. <strong>Check-in submitted at 5:00 PM</strong>.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CRITICAL VERIFICATION GUIDELINE */}
          <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 shadow-glass">
            <div className="flex items-start gap-2.5">
              <ShieldAlertIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  Proof of Work & Git Commits Guideline
                </h4>
                <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-normal">
                  Because each slot now spans <strong>2.0 to 3.0 hours</strong>, submitting only <strong>1 minor commit</strong> will be flagged for review by your Team Lead.
                </p>
                <div className="pt-1 flex flex-col gap-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <strong>Multiple commits / code diffs:</strong> Automatically verified.
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GitCommitVerticalIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <strong>Only 1 commit or non-coding tasks (Research / Debugging):</strong> Detail your progress and blockers in the log description so your full hours are credited!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 rounded-b-3xl border-t border-slate-200/60 dark:border-white/10 p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <ClockIcon className="h-4 w-4 text-blue-500" />
            <span>{is12Lunch ? '4 Check-ins (2 hrs each)' : '3 Check-ins'} · 8 hrs tracked</span>
          </div>

          <Button
            size="md"
            onClick={handleAcknowledge}
            icon={<ArrowRightIcon className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            Got It, Let&apos;s Build!
          </Button>
        </div>
      </div>
    </div>
  );
}
