import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  XIcon,
  SunIcon,
  MoonIcon,
  PalmtreeIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  Trash2Icon,
  Loader2Icon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  onSuccess?: () => void;
  existingLeave?: {
    id: string;
    type: 'half_day_morning' | 'half_day_afternoon' | 'full_day';
    date: string;
    reason: string;
    slots?: number[];
  } | null;
}

const QUICK_REASONS = [
  'Doctor / Medical Appointment',
  'Personal Emergency',
  'Sick Leave',
  'Family Function / Urgent Work',
  'Planned Vacation / Out of Office'
];

export function ApplyLeaveModal({
  isOpen,
  onClose,
  initialDate,
  onSuccess,
  existingLeave
}: ApplyLeaveModalProps) {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(initialDate || existingLeave?.date || todayStr);
  const [leaveType, setLeaveType] = useState<'half_day_morning' | 'half_day_afternoon' | 'full_day'>(
    existingLeave?.type || 'half_day_morning'
  );
  const [reason, setReason] = useState(existingLeave?.reason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || existingLeave?.date || todayStr);
      setLeaveType(existingLeave?.type || 'half_day_morning');
      setReason(existingLeave?.reason || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialDate, existingLeave, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Please specify a reason for your leave/half-day.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api('/api/leaves', {
        method: 'POST',
        body: {
          date,
          type: leaveType,
          reason: reason.trim()
        }
      });
      setSuccessMsg('Leave status successfully registered! Team Lead and Project Manager notified.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async () => {
    if (!existingLeave?.id) return;
    if (!window.confirm('Are you sure you want to cancel this leave record? Hourly check-in monitoring will resume.')) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await api(`/api/leaves/${existingLeave.id}`, {
        method: 'DELETE'
      });
      setSuccessMsg('Leave cancelled. Normal check-in monitoring resumed.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel leave.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl rounded-3xl p-6 sm:p-8 text-navy dark:text-white shadow-2xl border border-white/20 dark:border-white/10 bg-white/90 dark:bg-[#0c1322]/90 backdrop-blur-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand to-indigo-500 text-white shadow-lg shadow-brand/25">
              <PalmtreeIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-navy dark:text-white">
                {existingLeave ? 'Manage Leave / Half-Day' : 'Apply Leave / Mark Half-Day'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Excuses hourly check-ins and suppresses idle alerts for TL & PM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Success banner */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2Icon className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
              <AlertCircleIcon className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-semibold bg-slate-50 dark:bg-[#141d30] border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand dark:focus:ring-brand transition-all text-navy dark:text-white"
                required
              />
              <CalendarIcon className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Leave Type Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Leave Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Morning Half-Day */}
              <button
                type="button"
                onClick={() => setLeaveType('half_day_morning')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  leaveType === 'half_day_morning'
                    ? 'border-brand bg-brand/10 dark:bg-brand/20 shadow-md ring-2 ring-brand/30'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#141d30]/50 hover:bg-slate-100 dark:hover:bg-[#141d30]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
                    <SunIcon className="h-4 w-4" />
                  </div>
                  {leaveType === 'half_day_morning' && (
                    <CheckCircle2Icon className="h-4 w-4 text-brand dark:text-[#5AA9FF]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-navy dark:text-white">Morning Half-Day</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    9:00 AM – 1:00 PM
                  </div>
                </div>
              </button>

              {/* Afternoon Half-Day */}
              <button
                type="button"
                onClick={() => setLeaveType('half_day_afternoon')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  leaveType === 'half_day_afternoon'
                    ? 'border-brand bg-brand/10 dark:bg-brand/20 shadow-md ring-2 ring-brand/30'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#141d30]/50 hover:bg-slate-100 dark:hover:bg-[#141d30]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                    <MoonIcon className="h-4 w-4" />
                  </div>
                  {leaveType === 'half_day_afternoon' && (
                    <CheckCircle2Icon className="h-4 w-4 text-brand dark:text-[#5AA9FF]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-navy dark:text-white">Afternoon Half-Day</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    2:00 PM – 6:00 PM
                  </div>
                </div>
              </button>

              {/* Full-Day Leave */}
              <button
                type="button"
                onClick={() => setLeaveType('full_day')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  leaveType === 'full_day'
                    ? 'border-brand bg-brand/10 dark:bg-brand/20 shadow-md ring-2 ring-brand/30'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#141d30]/50 hover:bg-slate-100 dark:hover:bg-[#141d30]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                    <PalmtreeIcon className="h-4 w-4" />
                  </div>
                  {leaveType === 'full_day' && (
                    <CheckCircle2Icon className="h-4 w-4 text-brand dark:text-[#5AA9FF]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-navy dark:text-white">Full-Day Leave</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    All 8 Slots Excused
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Reason / Note
              </label>
              <span className="text-[11px] text-slate-400">Visible to TL & PM</span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Doctor appointment from 9:30 AM, will join post-lunch..."
              rows={3}
              className="w-full p-3.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-[#141d30] border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand transition-all text-navy dark:text-white placeholder:text-slate-400"
              required
            />

            {/* Quick reason chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_REASONS.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 transition-all"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Automatic alert suppression notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-start gap-3 text-xs leading-relaxed">
            <ShieldCheckIcon className="h-5 w-5 shrink-0 text-indigo-500 dark:text-indigo-400 mt-0.5" />
            <div>
              <span className="font-bold">Smart Notification Protection:</span> Your Team Lead and Project Manager will see your status updated in real-time. False-positive missing log alerts for excused slots are automatically suppressed.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10">
            {existingLeave ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleCancelLeave}
                disabled={isDeleting || isSubmitting}
                icon={isDeleting ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <Trash2Icon className="h-3.5 w-3.5" />}
              >
                Cancel Leave
              </Button>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || isDeleting || !reason.trim()}
                icon={isSubmitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CheckCircle2Icon className="h-4 w-4" />}
              >
                {isSubmitting ? 'Submitting...' : existingLeave ? 'Update Leave' : 'Confirm & Mark Leave'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
