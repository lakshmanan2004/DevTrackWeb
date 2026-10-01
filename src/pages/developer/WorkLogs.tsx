import React, { useState } from 'react';
import {
  CalendarIcon,
  CheckCircle2Icon,
  GitCommitVerticalIcon,
  OctagonAlertIcon,
  PaperclipIcon,
  TimerIcon,
  HighlighterIcon,
  EyeIcon,
  FileTextIcon,
  XIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FilterPills } from '../../components/ui/FilterPills';
import { TaskStatusBadge } from '../../components/ui/TaskStatusBadge';
import { useMyLogs } from '../../hooks/useLive';
import { fileUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { isLogLate } from '../../utils/logTimeliness';
import { formatLogTitle } from '../../utils/logTitle';

export function WorkLogs() {
  const { user } = useAuth();
  const [date, setDate] = useState<string>('all');
  const { data, loading } = useMyLogs(date);
  const todayLogs = data?.logs || [];
  const stats = data?.stats;

  const [filter, setFilter] = useState('all');
  const [activeScreenshotModal, setActiveScreenshotModal] = useState<{ url: string; title: string } | null>(null);

  const counts = {
    all: todayLogs.length,
    done: todayLogs.filter((log: any) => log.status === 'done').length,
    progress: todayLogs.filter((log: any) => log.status === 'progress').length,
    blocked: todayLogs.filter((log: any) => log.status === 'blocked').length,
    changes_requested: todayLogs.filter((log: any) => log.review === 'changes_requested').length
  };

  const visible = filter === 'all'
    ? todayLogs
    : filter === 'changes_requested'
    ? todayLogs.filter((log: any) => log.review === 'changes_requested')
    : todayLogs.filter((log: any) => log.status === filter);

  const dateLabel = date === 'all'
    ? 'All Recorded Work Logs'
    : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });

  return (
    <>
      <PageHeader
        title="My Work Logs"
        subtitle={user?.leaderName ? `Only you and ${user.leaderName} can see these logs` : 'Only you and your Team Leader can see these logs'}
        actions={
          <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-white p-1 shadow-card">
            <button
              type="button"
              onClick={() => setDate(new Date().toISOString().slice(0, 10))}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                date === new Date().toISOString().slice(0, 10)
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-navy hover:bg-gray-100'
              }`}
            >
              Today's Logs
            </button>

            <button
              type="button"
              onClick={() => setDate('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                date === 'all'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-navy hover:bg-gray-100'
              }`}
            >
              Show All Logs
            </button>

            <div className="h-4 w-px bg-gray-200 mx-0.5" />

            <label className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-navy cursor-pointer">
              <CalendarIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              <span className="sr-only">Pick a date</span>
              <input
                type="date"
                value={date === 'all' ? '' : date}
                onChange={(e) => setDate(e.target.value || 'all')}
                className="bg-transparent text-xs font-bold text-navy outline-none cursor-pointer"
              />
            </label>
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-hairline bg-white px-5 py-4 shadow-card">
          <p className="text-sm font-bold text-navy">{dateLabel}</p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading logs…</p>
          ) : (
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <span>
                <dt className="inline font-semibold text-navy">{todayLogs.length}</dt>{' '}
                <dd className="inline">logs</dd>
              </span>
              {stats && (
                <>
                  <span>
                    <dt className="inline font-semibold text-navy">
                      {Math.floor(stats.activeMinutes / 60)}h {String(stats.activeMinutes % 60).padStart(2, '0')}m
                    </dt>{' '}
                    <dd className="inline">active</dd>
                  </span>
                  <span>
                    <dt className={`inline font-semibold ${stats.missed ? 'text-danger' : 'text-green-600'}`}>{stats.missed}</dt>{' '}
                    <dd className="inline">missed</dd>
                  </span>
                </>
              )}
              <span>
                <dt className="inline font-semibold font-bold text-amber-600">{counts.changes_requested}</dt>{' '}
                <dd className="inline font-medium text-amber-900">targeted feedback notes</dd>
              </span>
            </dl>
          )}
        </div>

        <FilterPills
          ariaLabel="Filter logs by status"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'changes_requested', label: 'Changes Requested', count: counts.changes_requested },
            { id: 'done', label: 'Done', count: counts.done },
            { id: 'progress', label: 'In Progress', count: counts.progress },
            { id: 'blocked', label: 'Blocked', count: counts.blocked }
          ]}
        />

        <div className="space-y-4">
          {visible.map((log: any) => {
            const isLate = isLogLate(log);
            return (
            <article
              key={log.id}
              className={`rounded-card border border-l-4 p-5 shadow-card transition-all ${
                isLate
                  ? 'border-amber-300 border-l-amber-500 bg-amber-50/30'
                  : log.review === 'changes_requested'
                  ? 'border-amber-300 border-l-amber-500 bg-amber-50/20'
                  : `${log.status === 'blocked' ? 'border-l-red-500' : 'border-l-green-500'} border-hairline bg-white`
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-bold tabular-nums ${
                      log.status === 'blocked'
                        ? 'bg-danger-soft text-danger'
                        : 'bg-ok-soft text-green-700'
                    }`}
                  >
                    {log.date ? `📅 ${log.date} · ${log.hourLabel}` : log.hourLabel}
                  </span>
                  <h2 className="text-sm font-bold text-navy">{formatLogTitle(log.task, log.description)}</h2>
                  {isLate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-extrabold shadow-xs uppercase tracking-wide">
                      ⚠️ Late Submission
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <TaskStatusBadge status={log.status} />
                  <span className="text-xs text-gray-500">{log.submittedAt}</span>
                </div>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-700">{log.description}</p>

              {/* Team Leader Targeted Feedback */}
              {log.targetedFeedback && log.targetedFeedback.length > 0 && (
                <div className="mt-4 space-y-3 rounded-xl border border-amber-300 bg-amber-50/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                      <HighlighterIcon className="h-4 w-4 text-amber-600" />
                      Team Leader Specific Feedback ({log.targetedFeedback.length})
                    </span>
                    <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                      Action Needed on Highlighted Part
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {log.targetedFeedback.map((fb: any) => (
                      <div key={fb.id} className="rounded-lg border border-amber-200 bg-white p-3.5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                            <HighlighterIcon className="h-3 w-3 text-amber-600" />
                            "{fb.highlightedText}"
                          </span>
                          <span className="text-[11px] text-gray-400">{fb.createdAt}</span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-gray-800">
                          <span className="font-bold text-navy">TL Feedback:</span> {fb.comment}
                        </p>

                        {fb.screenshotUrl && (
                          <div className="mt-3">
                            <p className="mb-1 text-[11px] font-semibold text-gray-500">
                              TL Uploaded Proof:
                            </p>
                            {(fb.screenshotUrl.split('?')[0].toLowerCase().endsWith('.pdf') || (fb.screenshotName && fb.screenshotName.toLowerCase().endsWith('.pdf'))) ? (
                              <a
                                href={fileUrl(fb.screenshotUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-900 hover:bg-red-100 transition-colors"
                              >
                                <FileTextIcon className="h-4 w-4 text-red-600" />
                                <span className="underline">{fb.screenshotName || 'Attached PDF Document'}</span>
                                <span className="rounded bg-red-200 text-red-800 px-1.5 py-0.5 text-[10px] font-bold">Open PDF ↗</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveScreenshotModal({
                                    url: fileUrl(fb.screenshotUrl),
                                    title: fb.screenshotName || 'TL Attached Screenshot'
                                  })
                                }
                                className="group relative inline-block overflow-hidden rounded-lg border border-hairline bg-gray-900"
                              >
                                <img
                                  src={fileUrl(fb.screenshotUrl)}
                                  alt={fb.screenshotName || 'TL Screenshot'}
                                  className="h-24 w-40 object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-navy/40 opacity-0 transition-opacity group-hover:opacity-100">
                                  <span className="flex items-center gap-1 text-xs font-bold text-white">
                                    <EyeIcon className="h-4 w-4" /> View Full
                                  </span>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {log.blocker && (
                <div className="mt-3 flex gap-2 rounded-lg border border-red-200 bg-danger-soft px-3.5 py-3">
                  <OctagonAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-red-900">{log.blocker}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <PaperclipIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {log.attachmentUrl ? (
                    (log.attachmentUrl.split('?')[0].toLowerCase().endsWith('.pdf') || (log.attachment && log.attachment.toLowerCase().endsWith('.pdf'))) ? (
                      <a
                        href={fileUrl(log.attachmentUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline cursor-pointer"
                      >
                        <FileTextIcon className="h-3.5 w-3.5 text-red-600" />
                        <span>{log.attachment || 'document.pdf'}</span>
                        <span className="rounded bg-red-100 text-red-800 px-1 py-0.5 text-[10px] font-bold">Open PDF ↗</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveScreenshotModal({
                            url: fileUrl(log.attachmentUrl),
                            title: log.attachment || 'Screenshot Proof'
                          })
                        }
                        className="font-semibold text-brand hover:underline cursor-pointer"
                      >
                        {log.attachment}
                      </button>
                    )
                  ) : (
                    log.attachment
                  )}
                </span>
                {log.commits > 0 && (
                  <a
                    href={log.commitUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
                  >
                    <GitCommitVerticalIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {log.commits} commit{log.commits > 1 ? 's' : ''} linked
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <TimerIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {log.activeMinutes} min active
                </span>
                <span
                  className={`ml-auto inline-flex items-center gap-1.5 font-semibold ${
                    log.review === 'approved'
                      ? 'text-green-600'
                      : log.review === 'changes_requested'
                      ? 'text-amber-700 font-bold'
                      : log.review === 'rejected'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}
                >
                  {log.review === 'approved' ? (
                    <>
                      <CheckCircle2Icon className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                      Approved
                    </>
                  ) : log.review === 'changes_requested' ? (
                    <>
                      <HighlighterIcon className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                      Specific Feedback Provided (Resubmit Part)
                    </>
                  ) : log.review === 'rejected' ? (
                    <>
                      <XIcon className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                      Rejected
                    </>
                  ) : (
                    <>
                      <TimerIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      Pending review
                    </>
                  )}
                </span>
              </div>
            </article>
          );})} 
          {!loading && visible.length === 0 && (
            <div className="rounded-card border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-sm font-semibold text-navy">No logs for this date</p>
              <p className="mt-1 text-sm text-gray-500">Submit an hourly check-in from your dashboard.</p>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Zoom Modal */}
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
              alt="Screenshot view"
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
