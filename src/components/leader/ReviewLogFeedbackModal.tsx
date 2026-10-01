import React, { useState, useEffect } from 'react';
import {
  CheckIcon,
  AlertTriangleIcon,
  XIcon,
  MessageSquareIcon,
  ImageIcon,
  GitCommitVerticalIcon,
  ClockIcon,
  XCircleIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { fileUrl } from '../../api/client';
import { formatLogTitle } from '../../utils/logTitle';

interface ReviewLogFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  mode?: 'approve' | 'reject';
  onReview: (action: 'approve' | 'changes_requested' | 'reject', note: string) => Promise<void>;
  busy?: boolean;
}

export function ReviewLogFeedbackModal({
  isOpen,
  onClose,
  log,
  mode = 'approve',
  onReview,
  busy = false
}: ReviewLogFeedbackModalProps) {
  const [feedbackNote, setFeedbackNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (log) {
      setFeedbackNote(log.reviewNote || '');
      setError('');
    }
  }, [log, mode]);

  if (!isOpen || !log) return null;

  const isRejectMode = mode === 'reject';

  const handleApprove = async () => {
    setError('');
    await onReview('approve', feedbackNote.trim());
    onClose();
  };

  const handleRequestChanges = async () => {
    if (!feedbackNote.trim()) {
      setError('Please provide feedback notes explaining what specific changes are needed.');
      return;
    }
    setError('');
    await onReview('changes_requested', feedbackNote.trim());
    onClose();
  };

  const handleReject = async () => {
    if (!feedbackNote.trim()) {
      setError('Please provide a reason/feedback for rejecting this work log.');
      return;
    }
    setError('');
    await onReview('reject', feedbackNote.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-hairline animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-hairline bg-canvas px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                isRejectMode ? 'bg-red-100 text-danger' : 'bg-brand-soft text-brand'
              }`}>
                {isRejectMode ? <XCircleIcon className="h-4 w-4" /> : <MessageSquareIcon className="h-4 w-4" />}
              </span>
              <h2 id="review-modal-title" className="text-base font-bold text-navy">
                {isRejectMode ? 'Reject Work Log' : 'Review & Approve Log'}
              </h2>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Developer: <strong className="font-semibold text-navy">{log.developerName}</strong> ·{' '}
              {log.date} · {log.submittedAt ? `Submitted at ${log.submittedAt}` : 'Work Log'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {/* Work details preview */}
          <div className="rounded-xl border border-hairline bg-slate-50/70 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-navy">
                {formatLogTitle(log.task, log.description)}
              </span>
              {log.moduleName && (
                <Badge tone="purple" className="text-[11px]">
                  Module: {log.moduleName}
                </Badge>
              )}
            </div>

            <p className="text-xs text-gray-700 leading-relaxed max-h-36 overflow-y-auto rounded-lg bg-white p-2.5 border border-gray-200/80">
              {log.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {log.attachmentUrl && (
                <a
                  href={fileUrl(log.attachmentUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand-soft transition-colors"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>View Attached Proof</span>
                </a>
              )}
              {log.commits > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">
                  <GitCommitVerticalIcon className="h-3.5 w-3.5" />
                  {log.commits} commit(s)
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 ml-auto">
                <ClockIcon className="h-3.5 w-3.5" />
                {log.activeMinutes || 45} mins active
              </span>
            </div>
          </div>

          {/* Feedback / Rejection Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="review-feedback-input" className="text-xs font-bold uppercase tracking-wider text-navy">
                {isRejectMode ? 'Rejection Reason / Feedback' : 'Feedback / Specific Changes Notes'}
                {isRejectMode && <span className="text-danger ml-1">*</span>}
              </label>
              <span className="text-[11px] text-gray-400">
                {isRejectMode
                  ? 'Required for Rejection'
                  : 'Optional for Approve · Required for Changes'}
              </span>
            </div>
            <textarea
              id="review-feedback-input"
              rows={4}
              value={feedbackNote}
              onChange={(e) => {
                setFeedbackNote(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                isRejectMode
                  ? 'Explain why this work log is rejected so the developer can fix and re-submit...'
                  : 'Provide feedback, praise, or specific changes required for the developer...'
              }
              className={`w-full rounded-xl border p-3 text-xs text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                error
                  ? 'border-red-300 focus:border-danger focus:ring-red-100'
                  : 'border-hairline focus:border-brand focus:ring-blue-100'
              }`}
            />
            {error && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger">
                <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-canvas px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </Button>

          {isRejectMode ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleReject}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg h-9 px-5 text-xs font-bold bg-danger text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <XCircleIcon className="h-4 w-4" />
              Confirm & Reject Log
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={handleRequestChanges}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg h-9 px-4 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
              >
                <AlertTriangleIcon className="h-4 w-4" />
                Request Specific Changes
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={handleApprove}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg h-9 px-5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4" />
                Approve Log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
