import React, { useState, useRef } from 'react';
import {
  XIcon,
  UploadIcon,
  ImageIcon,
  HighlighterIcon,
  MessageSquareIcon,
  CheckIcon,
  Trash2Icon,
  EyeIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { WorkLog } from '../../types';

export interface FeedbackDraft {
  highlightedText: string;
  comment: string;
  screenshotUrl?: string;
  screenshotName?: string;
  file?: File;
}

interface TargetedFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: WorkLog;
  developerName: string;
  initialHighlightedText?: string;
  onSaveFeedback: (feedback: FeedbackDraft) => void;
}

const SAMPLE_SCREENSHOTS = [
  {
    name: 'ui-alignment-issue.png',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    label: 'Sample UI Issue'
  },
  {
    name: 'api-error-log.png',
    url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80',
    label: 'Sample Error Log'
  }
];

export function TargetedFeedbackModal({
  isOpen,
  onClose,
  log,
  developerName,
  initialHighlightedText = '',
  onSaveFeedback
}: TargetedFeedbackModalProps) {
  const [highlightedText, setHighlightedText] = useState(initialHighlightedText || '');
  const [comment, setComment] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>(undefined);
  const [screenshotName, setScreenshotName] = useState<string | undefined>(undefined);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [previewZoom, setPreviewZoom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setHighlightedText(initialHighlightedText);
  }, [initialHighlightedText]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setScreenshotName(f.name);
      setScreenshotUrl(URL.createObjectURL(f));
    }
  };

  const clearScreenshot = () => {
    setFile(undefined);
    setScreenshotUrl(undefined);
    setScreenshotName(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    onSaveFeedback({
      highlightedText: highlightedText.trim(),
      comment: comment.trim(),
      screenshotUrl,
      screenshotName,
      file
    });

    setComment('');
    clearScreenshot();
    setHighlightedText('');
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xl animate-in fade-in">
      <div className="glass-modal relative w-full max-w-2xl rounded-3xl border border-white/30 dark:border-white/15 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30 shadow-inner">
              <HighlighterIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Request Targeted Resubmit &amp; Feedback</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Developer: <span className="font-semibold text-slate-800 dark:text-slate-200">{developerName}</span> · {log.task}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Highlighted text snippet */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <HighlighterIcon className="h-3.5 w-3.5 text-amber-500" />
              Highlighted / Specific Part
            </label>
            <textarea
              value={highlightedText}
              onChange={(e) => setHighlightedText(e.target.value)}
              placeholder="Highlight text in description or type specific code/part here..."
              rows={2}
              className="glass-input w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm font-medium text-amber-950 dark:text-amber-200 placeholder:text-amber-700/50 dark:placeholder:text-amber-300/40 focus:outline-none"
            />
            {!highlightedText && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Tip: Highlight any snippet in the developer's log or specify the exact item above.
              </p>
            )}
          </div>

          {/* Feedback details */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <MessageSquareIcon className="h-3.5 w-3.5 text-blue-500" />
              Feedback / Rejection Reason for this Part <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Explain clearly what needs correction or updating for this specific part..."
              className="glass-input w-full rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Screenshot Upload section */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                Upload Screenshot to Identify Part (Optional)
              </span>
              {screenshotUrl && (
                <button
                  type="button"
                  onClick={clearScreenshot}
                  className="flex items-center gap-1 text-xs text-rose-500 hover:underline"
                >
                  <Trash2Icon className="h-3 w-3" /> Remove
                </button>
              )}
            </label>

            {screenshotUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 glass-surface p-2 text-white">
                <div className="flex items-center justify-between px-2 pb-2 text-xs font-medium text-slate-300">
                  <span className="truncate">{screenshotName || 'Attached Screenshot'}</span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(!previewZoom)}
                    className="flex items-center gap-1 text-blue-400 hover:underline"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    {previewZoom ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <img
                  src={screenshotUrl}
                  alt="Feedback screenshot preview"
                  className={`w-full rounded-xl object-cover transition-all ${
                    previewZoom ? 'max-h-96 object-contain' : 'max-h-40'
                  }`}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 dark:border-white/15 glass-surface p-4 text-center transition-all hover:border-blue-500/50 hover:bg-white/10"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl glass-surface text-slate-500 dark:text-slate-400 shadow-sm group-hover:text-blue-500">
                    <UploadIcon className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-white">
                    Click to upload screenshot <span className="font-normal text-slate-500 dark:text-slate-400">or drag and drop</span>
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">PNG, JPG, WEBP up to 5MB</p>
                </div>

                {/* Preset Screenshots */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Quick Demo Presets:</span>
                  {SAMPLE_SCREENSHOTS.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(sample.url);
                          const blob = await res.blob();
                          setFile(new File([blob], sample.name, { type: blob.type }));
                        } catch {
                          /* ignore */
                        }
                        setScreenshotUrl(sample.url);
                        setScreenshotName(sample.name);
                      }}
                      className="glass-surface inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-blue-500/50 hover:text-blue-500 transition-colors"
                    >
                      <ImageIcon className="h-3 w-3 text-blue-500" />
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-white/20 dark:border-white/10 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <button
              type="submit"
              className="btn-glass-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-lg from-amber-500 to-orange-600"
            >
              <CheckIcon className="h-4 w-4 text-white" />
              Submit Targeted Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
