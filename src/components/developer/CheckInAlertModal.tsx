import React from 'react';
import { AlarmClockIcon, AlertTriangleIcon, Volume2Icon, XIcon, CheckCircle2Icon } from 'lucide-react';
import { Button } from '../ui/Button';

interface CheckInAlertModalProps {
  open: boolean;
  onClose: () => void;
  onLogNow: () => void;
  minutesLeft: number;
  slotLabel: string;
  alertLevel: 'pop' | 'warning' | 'urgent' | 'late' | 'test';
}

export function CheckInAlertModal({
  open,
  onClose,
  onLogNow,
  minutesLeft,
  slotLabel,
  alertLevel
}: CheckInAlertModalProps) {
  if (!open) return null;

  const isUrgent = alertLevel === 'urgent' || alertLevel === 'late';
  const isTest = alertLevel === 'test';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 sm:p-6 backdrop-blur-xl animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`glass-modal relative w-full max-w-xl sm:max-w-2xl overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl border-2 transition-all ${
          isUrgent
            ? 'border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.25)]'
            : isTest
            ? 'border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
            : 'border-blue-500/80 shadow-[0_0_35px_rgba(59,130,246,0.25)]'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Ambient Icon Circle */}
            <div
              className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${
                isUrgent
                  ? 'border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-bounce'
                  : isTest
                  ? 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400'
              }`}
            >
              {isTest ? (
                <Volume2Icon className="h-6 w-6" />
              ) : isUrgent ? (
                <AlertTriangleIcon className="h-6 w-6" />
              ) : (
                <AlarmClockIcon className="h-6 w-6" />
              )}
            </div>

            <div>
              {/* High-Contrast Pill Badge */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider border shadow-xs ${
                  isUrgent
                    ? 'border-rose-500/40 bg-rose-500/20 text-rose-700 dark:text-rose-300'
                    : isTest
                    ? 'border-amber-500/40 bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    : 'border-blue-500/40 bg-blue-500/20 text-blue-800 dark:text-blue-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                    isUrgent ? 'bg-rose-500' : isTest ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                />
                {isTest ? 'System Alert Test' : isUrgent ? 'Urgent Deadline Alert' : 'Check-In Reminder'}
              </span>

              <h3 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {isTest
                  ? 'DevTrack Pop-Up Alert Working!'
                  : isUrgent
                  ? `URGENT: ${minutesLeft} Minutes Left!`
                  : `${minutesLeft} Minutes Left to Log Work`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Message Container Card */}
        <div className="glass-surface mt-6 rounded-2xl border border-white/60 dark:border-white/10 px-6 py-5 sm:px-7 sm:py-5.5 shadow-xs">
          <p className="text-sm sm:text-base leading-relaxed font-medium text-slate-700 dark:text-slate-200">
            {isTest
              ? 'This is a live pop-up message alert with system audio pop sound and Windows desktop notification support.'
              : `You have not submitted your work log for the ${slotLabel} slot yet. Submit before the hour ends to keep your on-time record.`}
          </p>

          {!isTest && (
            <div className="mt-4 flex items-center justify-between border-t border-white/20 dark:border-white/10 pt-3 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              <span>Time remaining for this slot:</span>
              <span
                className={`tabular-nums text-sm sm:text-base font-extrabold ${
                  isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {minutesLeft} mins
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-7 flex items-center justify-end gap-3.5">
          <Button variant="secondary" onClick={onClose} className="rounded-xl px-5 py-2.5 text-xs font-bold">
            {isTest ? 'Close Preview' : 'Dismiss'}
          </Button>
          <Button
            className={`rounded-xl px-6 py-2.5 text-xs font-bold shadow-lg cursor-pointer ${
              isUrgent ? 'bg-rose-600 hover:bg-rose-700 text-white border-none' : 'btn-glass-primary'
            }`}
            onClick={() => {
              onClose();
              onLogNow();
            }}
          >
            Submit Work Log Now
          </Button>
        </div>
      </div>
    </div>
  );
}
