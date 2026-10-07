import React from 'react';
import { AlarmClockIcon, AlertTriangleIcon, Volume2Icon, XIcon } from 'lucide-react';
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
    <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 transition-all ${
          isUrgent ? 'border-red-500' : 'border-amber-400'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                isUrgent ? 'bg-red-100 text-red-600 animate-bounce' : 'bg-amber-100 text-amber-600'
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
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isTest ? 'System Alert Test' : isUrgent ? 'Urgent Deadline Alert' : 'Check-In Reminder'}
              </span>
              <h3 className="mt-1 text-lg font-bold text-navy">
                {isTest
                  ? 'DevTrack Pop-Up Alert Working!'
                  : isUrgent
                  ? `URGENT: ${minutesLeft} Minutes Left!`
                  : `${minutesLeft} Minutes Left to Log Work`}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-hairline bg-canvas p-4">
          <p className="text-sm leading-relaxed text-gray-700">
            {isTest
              ? 'This is a live pop-up message alert with system audio pop sound and Windows desktop notification support.'
              : `You have not submitted your work log for the ${slotLabel} slot yet. Submit before the hour ends to keep your on-time record.`}
          </p>

          {!isTest && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 text-xs font-semibold text-gray-600">
              <span>Time remaining for this slot:</span>
              <span className={`tabular-nums text-sm font-bold ${isUrgent ? 'text-red-600' : 'text-amber-700'}`}>
                {minutesLeft} mins
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {isTest ? 'Close Preview' : 'Dismiss'}
          </Button>
          <Button
            className={isUrgent ? 'bg-red-600 hover:bg-red-700 text-white border-none' : ''}
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
