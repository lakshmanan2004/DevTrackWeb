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
  const [previewScreenshot, setPreviewScreenshot] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (log) {
      setFeedbackNote(log.reviewNote || '');
      setError('');
      setPreviewScreenshot(null);
    }
  }, [log, mode]);

  if (!isOpen || !log) return null;

  const isRejectMode = mode === 'reject';
  const isPdfAttachment = log.attachmentUrl && (
    log.attachmentUrl.split('?')[0].toLowerCase().endsWith('.pdf') ||
    (log.attachment && String(log.attachment).toLowerCase().endsWith('.pdf'))
  );

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
      className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center overflow-y-auto bg-navy/70 p-4 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-hairline dark:border-white/10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-hairline dark:border-white/10 bg-canvas dark:bg-slate-950/70 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                isRejectMode ? 'bg-red-100 dark:bg-rose-950/60 text-danger dark:text-rose-400' : 'bg-brand-soft dark:bg-sky-950/60 text-brand dark:text-sky-400'
              }`}>
                {isRejectMode ? <XCircleIcon className="h-4 w-4" /> : <MessageSquareIcon className="h-4 w-4" />}
              </span>
              <h2 id="review-modal-title" className="text-base font-bold text-navy dark:text-white">
                {isRejectMode ? 'Reject Work Log' : 'Review & Approve Log'}
              </h2>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Developer: <strong className="font-semibold text-navy dark:text-white">{log.developerName}</strong> ·{' '}
              {log.date} · {log.submittedAt ? `Submitted at ${log.submittedAt}` : 'Work Log'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {/* Work details preview */}
          <div className="rounded-xl border border-hairline dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-navy dark:text-white">
                {formatLogTitle(log.task, log.description)}
              </span>
              {log.moduleName && (
                <Badge tone="purple" className="text-[11px]">
                  Module: {log.moduleName}
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed max-h-36 overflow-y-auto rounded-lg bg-white dark:bg-slate-900/90 p-2.5 border border-gray-200/80 dark:border-white/10">
              {log.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {log.attachmentUrl && (
                isPdfAttachment ? (
                  <a
                    href={fileUrl(log.attachmentUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-rose-500/30 bg-red-50/80 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-semibold text-red-900 dark:text-rose-200 hover:bg-red-100 dark:hover:bg-rose-900/60 transition-colors"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-red-600 dark:text-rose-400" />
                    <span>View Attached PDF Document ↗</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewScreenshot({
                        url: fileUrl(log.attachmentUrl),
                        title: log.attachment ? `${log.developerName || 'Developer'} — ${log.attachment}` : `${log.developerName || 'Developer'} — Screenshot Proof`
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 dark:border-sky-500/30 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-brand dark:text-sky-300 hover:bg-brand-soft dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-brand dark:text-sky-400" />
                    <span>View Attached Proof</span>
                    <span className="rounded bg-brand/10 dark:bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold">Pop up</span>
                  </button>
                )
              )}
              {log.commits > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-hairline dark:border-white/10 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-slate-300">
                  <GitCommitVerticalIcon className="h-3.5 w-3.5" />
                  {log.commits} commit(s)
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 ml-auto">
                <ClockIcon className="h-3.5 w-3.5" />
                {log.activeMinutes || 45} mins active
              </span>
            </div>
          </div>

          {/* Feedback / Rejection Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="review-feedback-input" className="text-xs font-bold uppercase tracking-wider text-navy dark:text-white">
                {isRejectMode ? 'Rejection Reason / Feedback' : 'Feedback / Specific Changes Notes'}
                {isRejectMode && <span className="text-danger ml-1">*</span>}
              </label>
              <span className="text-[11px] text-gray-400 dark:text-slate-400">
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
              className={`w-full rounded-xl border p-3 text-xs text-navy dark:text-white bg-white dark:bg-slate-950 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                error
                  ? 'border-red-300 dark:border-rose-500/50 focus:border-danger focus:ring-red-100 dark:focus:ring-rose-950/50'
                  : 'border-hairline dark:border-white/15 focus:border-brand focus:ring-blue-100 dark:focus:ring-sky-950/50'
              }`}
            />
            {error && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger dark:text-rose-400">
                <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline dark:border-white/10 bg-canvas dark:bg-slate-950/70 px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </Button>

          {isRejectMode ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleReject}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl h-10 px-5 text-xs font-bold bg-danger hover:bg-red-700 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <XCircleIcon className="h-4 w-4" />
              Confirm &amp; Reject Log
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={handleRequestChanges}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl h-10 px-4 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <AlertTriangleIcon className="h-4 w-4" />
                Request Specific Changes
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={handleApprove}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <CheckIcon className="h-4 w-4" />
                Approve Log
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Zoom Popup Modal with High Z-Index */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-gray-900 p-4 shadow-2xl border border-white/10 animate-in zoom-in-95">
            <div className="mb-3 flex items-center justify-between border-b border-gray-800 pb-2 text-white">
              <span className="text-sm font-semibold">{previewScreenshot.title}</span>
              <button
                type="button"
                onClick={() => setPreviewScreenshot(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <img
              src={previewScreenshot.url}
              alt="Screenshot popup preview"
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
