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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <HighlighterIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy">Request Targeted Resubmit & Feedback</h2>
              <p className="text-xs text-gray-500">
                Developer: <span className="font-semibold text-navy">{developerName}</span> · {log.task}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-navy"
            aria-label="Close modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Highlighted text snippet */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
              <HighlighterIcon className="h-3.5 w-3.5 text-amber-600" />
              Highlighted / Specific Part
            </label>
            <textarea
              value={highlightedText}
              onChange={(e) => setHighlightedText(e.target.value)}
              placeholder="Highlight text in description or type specific code/part here..."
              rows={2}
              className="w-full rounded-xl border border-amber-300 bg-amber-50/60 px-3.5 py-2.5 text-sm font-medium text-amber-950 placeholder:text-amber-700/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {!highlightedText && (
              <p className="mt-1 text-xs text-gray-400">
                Tip: Highlight any snippet in the developer's log or specify the exact item above.
              </p>
            )}
          </div>

          {/* Feedback details */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
              <MessageSquareIcon className="h-3.5 w-3.5 text-brand" />
              Feedback / Rejection Reason for this Part <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Explain clearly what needs correction or updating for this specific part..."
              className="w-full rounded-xl border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Screenshot Upload section */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-600">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                Upload Screenshot to Identify Part (Optional)
              </span>
              {screenshotUrl && (
                <button
                  type="button"
                  onClick={clearScreenshot}
                  className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <Trash2Icon className="h-3 w-3" /> Remove
                </button>
              )}
            </label>

            {screenshotUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-hairline bg-gray-900 p-2 text-white">
                <div className="flex items-center justify-between px-2 pb-2 text-xs font-medium text-gray-300">
                  <span className="truncate">{screenshotName || 'Attached Screenshot'}</span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(!previewZoom)}
                    className="flex items-center gap-1 text-brand hover:underline"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    {previewZoom ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <img
                  src={screenshotUrl}
                  alt="Feedback screenshot preview"
                  className={`w-full rounded-lg object-cover transition-all ${
                    previewZoom ? 'max-h-96 object-contain' : 'max-h-40'
                  }`}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-hairline bg-canvas p-4 text-center transition-all hover:border-brand hover:bg-brand-soft/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm group-hover:text-brand">
                    <UploadIcon className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-navy">
                    Click to upload screenshot <span className="font-normal text-gray-500">or drag and drop</span>
                  </p>
                  <p className="text-[11px] text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                </div>

                {/* Preset Screenshots */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-gray-400">Quick Demo Presets:</span>
                  {SAMPLE_SCREENSHOTS.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={async () => {
                        // fetch the preset image into a File so it uploads like a real screenshot
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs font-medium text-navy hover:border-brand hover:text-brand"
                    >
                      <ImageIcon className="h-3 w-3 text-brand" />
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-hairline pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg h-9 px-4 text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
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
