import React, { useState } from 'react';
import {
  ClockIcon,
  CheckCircle2Icon,
  HighlighterIcon,
  EyeIcon,
  SendIcon,
  CalendarIcon,
  XIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FilterPills } from '../../components/ui/FilterPills';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { usePendingWorks } from '../../hooks/useLive';
import { api, apiUpload, fileUrl } from '../../api/client';

export function MyPendingWorks() {
  const { data, refetch } = usePendingWorks();
  const items = data?.items || [];
  const [filter, setFilter] = useState('all');
  const [activeScreenshotModal, setActiveScreenshotModal] = useState<{ url: string; title: string } | null>(null);
  const [resubmitModalItem, setResubmitModalItem] = useState<any | null>(null);
  const [resubmitText, setResubmitText] = useState('');
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleResolve = async () => {
    if (!resubmitModalItem) return;
    setBusy(true);
    try {
      if (resubmitModalItem.kind === 'log') {
        const fd = new FormData();
        fd.append('text', resubmitText || 'Updated the highlighted part and attached proof.');
        if (resubmitFile) fd.append('attachment', resubmitFile);
        if (resubmitFile) {
          await apiUpload(`/api/logs/${resubmitModalItem.logId}/resubmit`, fd);
        } else {
          await api(`/api/logs/${resubmitModalItem.logId}/resubmit`, {
            method: 'POST',
            body: { text: resubmitText }
          });
        }
      } else {
        await api(`/api/tasks/${resubmitModalItem.taskId}`, {
          method: 'PATCH',
          body: { status: 'completed' }
        });
      }
      setToastMessage('Work updated and resubmitted to your Team Lead!');
      setTimeout(() => setToastMessage(''), 2500);
      setResubmitModalItem(null);
      setResubmitText('');
      setResubmitFile(null);
      refetch();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to resubmit');
      setTimeout(() => setToastMessage(''), 2500);
    } finally {
      setBusy(false);
    }
  };

  const visible = filter === 'all'
    ? items
    : filter === 'resubmit'
    ? items.filter((i: any) => i.highlightedText)
    : items.filter((i: any) => !i.highlightedText);

  const groupedByDate: Record<string, any[]> = {};
  visible.forEach((item: any) => {
    if (!groupedByDate[item.dateStr]) groupedByDate[item.dateStr] = [];
    groupedByDate[item.dateStr].push(item);
  });

  return (
    <>
      <PageHeader
        title="My Pending Works"
        subtitle="All pending tasks & resubmissions assigned by Team Lead / PM, grouped by date"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
            <ClockIcon className="h-4 w-4" />
            {items.length} Works Pending
          </span>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-600 p-3 text-xs font-bold text-white shadow-md animate-in fade-in">
            <CheckCircle2Icon className="h-4 w-4" />
            {toastMessage}
          </div>
        )}

        <FilterPills
          ariaLabel="Filter pending works"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All Pending', count: items.length },
            { id: 'resubmit', label: 'Targeted Feedback', count: items.filter((i: any) => i.highlightedText).length },
            { id: 'blocker', label: 'Blockers / Assigned', count: items.filter((i: any) => !i.highlightedText).length }
          ]}
        />

        {Object.keys(groupedByDate).length > 0 ? (
          Object.entries(groupedByDate).map(([dateLabel, dateItems]) => (
            <section key={dateLabel} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-hairline pb-2">
                <CalendarIcon className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider">
                  Pending Date: <span className="text-amber-900">{dateLabel}</span>
                </h2>
                <Badge tone="amber">{dateItems.length} items</Badge>
              </div>

              <div className="space-y-3">
                {dateItems.map((item: any) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-amber-300 bg-white p-5 shadow-card transition-all hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded bg-navy/10 px-2.5 py-1 text-xs font-bold text-navy">
                          {item.hourLabel}
                        </span>
                        <h3 className="text-sm font-bold text-navy">{item.taskTitle}</h3>
                      </div>
                      <Badge tone="purple">Assigned by {item.assignedBy}</Badge>
                    </div>

                    {item.highlightedText && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950 border border-amber-200">
                        <HighlighterIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        Targeted Snippet: "{item.highlightedText}"
                      </div>
                    )}

                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                      <p className="text-xs leading-relaxed text-amber-950">
                        <strong className="text-navy">Feedback / Instruction:</strong> "{item.feedbackNote}"
                      </p>

                      {item.screenshotUrl && (
                        <div className="mt-3">
                          <p className="mb-1 text-[11px] font-bold text-amber-900">
                            Attached Screenshot from Lead:
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveScreenshotModal({
                                url: fileUrl(item.screenshotUrl),
                                title: item.screenshotName || 'Attached Screenshot'
                              })
                            }
                            className="group relative inline-block overflow-hidden rounded-lg border border-hairline bg-gray-900"
                          >
                            <img
                              src={fileUrl(item.screenshotUrl)}
                              alt={item.screenshotName || 'Lead screenshot'}
                              className="h-20 w-36 object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-navy/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="flex items-center gap-1 text-[11px] font-bold text-white">
                                <EyeIcon className="h-3.5 w-3.5" /> Expand
                              </span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-3 border-t border-hairline pt-3">
                      <Button
                        onClick={() => setResubmitModalItem(item)}
                        className="bg-amber-500 text-white hover:bg-amber-600 font-bold border-none"
                        icon={<SendIcon className="h-3.5 w-3.5" />}
                      >
                        {item.kind === 'log' ? 'Update Log & Resubmit Work' : 'Mark Task Done'}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-2xl border border-hairline bg-white p-12 text-center">
            <CheckCircle2Icon className="mx-auto h-10 w-10 text-emerald-500" />
            <h3 className="mt-3 text-base font-bold text-navy">All Pending Works Cleared!</h3>
            <p className="mt-1 text-xs text-gray-500">You have completed all pending tasks assigned by your Team Lead and PM.</p>
          </div>
        )}
      </div>

      {/* Resubmit Modal */}
      {resubmitModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-base font-bold text-navy">
                  {resubmitModalItem.kind === 'log' ? 'Resubmit Work Log' : 'Complete Assigned Task'}
                </h3>
                <p className="text-xs text-gray-500">{resubmitModalItem.taskTitle} · {resubmitModalItem.dateStr}</p>
              </div>
              <button onClick={() => setResubmitModalItem(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                <strong>TL Note:</strong> "{resubmitModalItem.feedbackNote}"
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Updated Explanation
                </label>
                <textarea
                  rows={3}
                  value={resubmitText}
                  onChange={(e) => setResubmitText(e.target.value)}
                  placeholder="Describe your fix or what you completed..."
                  className="w-full rounded-xl border border-hairline bg-canvas p-3 text-xs text-navy focus:border-brand focus:bg-white focus:outline-none"
                />
              </div>

              {resubmitModalItem.kind === 'log' && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-600">
                    Attach Updated Screenshot (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/pdf"
                    onChange={(e) => setResubmitFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-hairline bg-canvas p-2.5 text-xs text-navy"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-hairline pt-4">
              <Button variant="outline" onClick={() => setResubmitModalItem(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={busy}
                className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold border-none"
                icon={<CheckCircle2Icon className="h-4 w-4" />}
              >
                {busy ? 'Submitting…' : 'Submit Fix to Lead'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Expand Modal */}
      {activeScreenshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-gray-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-gray-800 pb-2 text-white">
              <span className="text-sm font-semibold">{activeScreenshotModal.title}</span>
              <button
                onClick={() => setActiveScreenshotModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <img
              src={activeScreenshotModal.url}
              alt="Screenshot full view"
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
