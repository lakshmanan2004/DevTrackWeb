import React, { useState } from 'react';
import {
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  GitCommitVerticalIcon,
  ImageIcon,
  FileTextIcon,
  XIcon,
  HighlighterIcon,
  EyeIcon,
  RotateCcwIcon,
  PlusIcon,
  ZapIcon,
  UsersIcon
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FilterPills } from '../../components/ui/FilterPills';
import { TaskStatusBadge } from '../../components/ui/TaskStatusBadge';
import { ReviewLogFeedbackModal } from '../../components/leader/ReviewLogFeedbackModal';
import { AssignTaskModal } from '../../components/common/AssignTaskModal';
import { useLive, useDevelopers } from '../../hooks/useLive';
import { api, fileUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { isLogLate } from '../../utils/logTimeliness';
import { formatLogTitle } from '../../utils/logTitle';

const getTodayStr = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function LogApprovals() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<string>(getTodayStr);
  const [developerFilter, setDeveloperFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const params = new URLSearchParams();
  if (dateFilter && dateFilter !== 'all') params.set('date', dateFilter);
  else params.set('date', 'all');
  if (developerFilter) params.set('developerId', developerFilter);

  const fetchPath = `/api/logs?${params.toString()}`;
  const { data, refetch } = useLive<{ logs: any[] }>(fetchPath, ['log:new', 'log:review'], 20000);
  const { data: devData } = useDevelopers();
  const developers = devData?.developers || [];

  const queue = data?.logs || [];
  const [filter, setFilter] = useState('all');
  const [selectedReviewLog, setSelectedReviewLog] = useState<{ log: any; mode: 'approve' | 'reject' } | null>(null);
  const [activeScreenshotModal, setActiveScreenshotModal] = useState<{ url: string; title: string } | null>(null);
  const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const moduleNames = Array.from(new Set(queue.map((i: any) => i.moduleName).filter(Boolean)));

  const review = async (logId: string, action: 'approve' | 'changes_requested' | 'reject' | 'reset', customNote?: string) => {
    setBusyId(logId);
    try {
      await api(`/api/logs/${logId}/review`, { method: 'POST', body: { action, note: customNote || '' } });
      refetch();
    } finally {
      setBusyId(null);
    }
  };


  const getDevId = (dev: any) => {
    if (!dev) return '';
    if (typeof dev === 'string') return dev;
    if (dev.id && typeof dev.id === 'string') return dev.id;
    if (dev._id && typeof dev._id === 'string') return dev._id;
    if (dev.stat && dev.stat.id) return String(dev.stat.id);
    if (dev.raw && dev.raw._id) return String(dev.raw._id);
    return String(dev._id || dev.id || dev);
  };

  const scopedQueue = queue.filter((item: any) => {
    if (developerFilter) {
      const target = String(developerFilter).trim().toLowerCase();
      const itemDevId = String(
        item.developerId ||
        (item.developer && (item.developer._id || item.developer.id || item.developer)) ||
        ''
      ).trim().toLowerCase();
      const itemDevName = String(item.developerName || '').trim().toLowerCase();

      const selectedDevObj = developers.find((d: any) => getDevId(d) === developerFilter);
      const selectedDevName = selectedDevObj ? (selectedDevObj.name || (selectedDevObj as any).stat?.name || '').trim().toLowerCase() : '';

      const matchId = itemDevId && (itemDevId === target || (selectedDevObj && itemDevId === getDevId(selectedDevObj).toLowerCase()));
      const matchName = (itemDevName && (itemDevName === target || (selectedDevName && itemDevName === selectedDevName))) || false;

      if (!matchId && !matchName) return false;
    }
    if (moduleFilter && item.moduleName !== moduleFilter) return false;
    return true;
  });

  const counts = {
    all: scopedQueue.length,
    pending: scopedQueue.filter((i: any) => i.review === 'pending').length,
    changes_requested: scopedQueue.filter((i: any) => i.review === 'changes_requested').length,
    approved: scopedQueue.filter((i: any) => i.review === 'approved').length,
    rejected: scopedQueue.filter((i: any) => i.review === 'rejected').length
  };

  const filteredQueue = scopedQueue.filter((item: any) => {
    if (filter === 'all') return true;
    return item.review === filter;
  });

  return (
    <>
      <PageHeader
        title="Log Approvals"
        subtitle="Review, approve, and provide feedback on developer daily work logs and proof submissions"
        actions={
          <div className="flex items-center gap-3">
            <Button
              icon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setAssignTaskModalOpen(true)}
              className="bg-brand text-white hover:bg-brand/90"
            >
              Assign New Task
            </Button>
            {counts.changes_requested > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                <HighlighterIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {counts.changes_requested} targeted changes
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-warn px-3 py-1.5 text-xs font-bold text-white">
              <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {counts.pending} pending
            </span>
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterPills
            ariaLabel="Filter approvals"
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'changes_requested', label: 'Changes Requested', count: counts.changes_requested },
              { id: 'approved', label: 'Approved', count: counts.approved },
              { id: 'rejected', label: 'Rejected', count: counts.rejected }
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            {developers.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-1.5 shadow-card">
                <label htmlFor="la-dev-filter" className="text-xs font-bold text-navy flex items-center gap-1">
                  <UsersIcon className="h-3.5 w-3.5 text-gray-400" />
                  Developer:
                </label>
                <select
                  id="la-dev-filter"
                  value={developerFilter}
                  onChange={(e) => setDeveloperFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-brand focus:outline-none cursor-pointer"
                >
                  <option value="">All Developers ({developers.length})</option>
                  {developers.map((dev: any) => {
                    const dId = getDevId(dev);
                    return (
                      <option key={dId} value={dId}>
                        {dev.name || dev.stat?.name || 'Developer'}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-1 shadow-glass">
              <button
                type="button"
                onClick={() => setDateFilter(getTodayStr())}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === getTodayStr()
                    ? 'btn-glass-primary !text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Today's Logs
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === 'all'
                    ? 'btn-glass-primary !text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Show All Logs
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-0.5" />

              <label className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span className="sr-only">Pick a date</span>
                <input
                  type="date"
                  value={dateFilter === 'all' ? '' : dateFilter}
                  onChange={(e) => setDateFilter(e.target.value || 'all')}
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                />
              </label>
            </div>

            {moduleNames.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-1.5 shadow-card">
                <label htmlFor="la-module-filter" className="text-xs font-bold text-navy flex items-center gap-1">
                  Filter by Module:
                </label>
                <select
                  id="la-module-filter"
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-brand focus:outline-none cursor-pointer"
                >
                  <option value="">All Project Modules</option>
                  {moduleNames.map((modName: string) => (
                    <option key={modName} value={modName}>
                      {modName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>


        <ul className="space-y-4">
          {filteredQueue.map((log: any) => {
            const isAssigned = log.isAssignedTask || !!log.linkedTask;
            const isLate = isLogLate(log);

            return (
              <li
                key={log.id}
                className={`rounded-card border transition-all ${
                  isAssigned
                    ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-300/60 shadow-md'
                    : isLate
                    ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20 shadow-md'
                    : log.review === 'changes_requested'
                    ? 'border-amber-300 ring-2 ring-amber-400/20 bg-white shadow-card'
                    : log.review === 'approved'
                    ? 'border-green-200 bg-white shadow-card'
                    : log.review === 'rejected'
                    ? 'border-red-200 bg-white shadow-card'
                    : 'border-hairline bg-white shadow-card'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-navy">
                      {log.developerName}
                      <span className="ml-2 font-normal text-gray-500">
                        {log.isPendingWorkSubmission ? (
                          <>
                            📅 Kept Pending on: <strong className="font-semibold text-amber-900">{log.originalPendingDate || log.date}</strong> ({log.hourLabel}) · Submitted on: <strong className="font-semibold text-navy">{log.pendingSubmissionDate || log.submittedDate || log.date} at {log.pendingSubmissionAt || log.submittedAt}</strong>
                          </>
                        ) : (
                          <>
                            📅 {log.date} · {log.hourLabel} · {isLate ? `submitted late at ${log.submittedAt}` : `submitted ${log.submittedAt}`}
                          </>
                        )}
                      </span>
                    </p>
                    {isLate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-extrabold shadow-2xs uppercase tracking-wide">
                        ⚠️ Late
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {log.isPendingWorkSubmission && (
                      <Badge tone="amber">
                        <ClockIcon className="mr-1 h-3 w-3 inline" />
                        Pending Work ({log.originalPendingDate || log.date})
                      </Badge>
                    )}
                    {isAssigned && !log.isPendingWorkSubmission && (
                      <Badge tone="amber">
                        ⚡ Assigned Task
                      </Badge>
                    )}
                    {log.review === 'changes_requested' && (
                      <Badge tone="amber">Changes Requested ({log.targetedFeedback?.length || 0})</Badge>
                    )}
                    {log.review === 'approved' && <Badge tone="green">Approved</Badge>}
                    {log.review === 'rejected' && <Badge tone="red">Rejected</Badge>}
                    {log.review === 'pending' && <Badge tone="blue">Pending review</Badge>}
                  </div>
                </div>

              <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-sm font-bold text-navy">{formatLogTitle(log.task, log.description)}</h2>
                    <TaskStatusBadge status={log.status} />
                    {log.moduleName && (
                      <Badge tone="purple">Module: {log.moduleName}</Badge>
                    )}
                  </div>

                  <div className="relative mt-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/70 p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                      {log.description}
                    </p>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {log.wordCount} words · meets minimum
                  </p>

                  {/* Attachments */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {log.attachmentUrl ? (
                      (log.attachmentUrl.split('?')[0].toLowerCase().endsWith('.pdf') || (log.attachment && log.attachment.toLowerCase().endsWith('.pdf'))) ? (
                        <a
                          href={fileUrl(log.attachmentUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-rose-500/30 bg-red-50/60 dark:bg-rose-950/30 px-3 py-2 text-xs font-semibold text-red-900 dark:text-rose-200 hover:bg-red-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer group shadow-2xs"
                        >
                          <FileTextIcon className="h-3.5 w-3.5 text-red-600 dark:text-rose-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
                          <span className="underline decoration-red-300 dark:decoration-rose-500 group-hover:decoration-red-600">{log.attachment || 'document.pdf'}</span>
                          <span className="rounded bg-red-200/80 dark:bg-rose-900/60 text-red-800 dark:text-rose-200 px-1.5 py-0.5 text-[10px] font-bold">
                            Open PDF ↗
                          </span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveScreenshotModal({
                              url: fileUrl(log.attachmentUrl),
                              title: log.attachment ? `${log.developerName || 'Developer'} — ${log.attachment}` : `${log.developerName || 'Developer'} — Screenshot Proof`
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-navy dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand transition-colors cursor-pointer group shadow-2xs"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-brand group-hover:scale-110 transition-transform" aria-hidden="true" />
                          <span className="underline decoration-slate-300 dark:decoration-slate-600 group-hover:decoration-brand">{log.attachment || 'screenshot.png'}</span>
                          <span className="rounded bg-brand/10 dark:bg-blue-500/20 text-brand dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-bold">
                            View Proof
                          </span>
                        </button>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                        <ImageIcon className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" aria-hidden="true" />
                        <span>{log.attachment || 'No screenshot attached'}</span>
                      </span>
                    )}
                    {log.commits > 0 && (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-navy dark:text-white">
                        <GitCommitVerticalIcon className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" aria-hidden="true" />
                        {log.commitUrl ? (
                          <a href={log.commitUrl} target="_blank" rel="noreferrer" className="hover:underline text-brand dark:text-blue-400">
                            view commit ({log.commits})
                          </a>
                        ) : (
                          `${log.commits} commit${log.commits > 1 ? 's' : ''} linked`
                        )}
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-ok" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  {/* Leader Feedback Note */}
                  {log.reviewNote && (
                    <div className={`mt-3.5 rounded-2xl border p-3.5 text-xs leading-relaxed shadow-glass ${
                      log.review === 'approved'
                        ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : log.review === 'changes_requested'
                        ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                        : 'border-red-200 dark:border-rose-500/30 bg-danger-soft dark:bg-rose-950/40 text-danger dark:text-rose-200'
                    }`}>
                      <span className="font-bold text-navy dark:text-white">Team Leader Note:</span> {log.reviewNote}
                    </div>
                  )}

                  {/* Resubmission history */}
                  {log.resubmissions && log.resubmissions.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-brand-soft dark:bg-blue-950/30 p-3.5">
                      <p className="text-xs font-bold uppercase tracking-wide text-brand dark:text-blue-300">Developer resubmissions</p>
                      <ul className="mt-2 space-y-1.5">
                        {log.resubmissions.map((r: any, i: number) => (
                          <li key={i} className="text-xs text-gray-700 dark:text-slate-300">
                            <span className="font-semibold text-navy dark:text-white">{r.at}</span> — {r.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-hairline pt-3">
                    {log.review === 'pending' ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === log.id}
                          onClick={() => setSelectedReviewLog({ log, mode: 'approve' })}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl h-9 px-4 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve Log
                        </button>

                        <button
                          type="button"
                          disabled={busyId === log.id}
                          onClick={() => setSelectedReviewLog({ log, mode: 'reject' })}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl h-9 px-4 text-xs font-bold border border-red-200 dark:border-rose-500/40 bg-red-50 dark:bg-rose-950/40 text-danger dark:text-rose-300 hover:bg-red-100 dark:hover:bg-rose-900/60 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          <XIcon className="h-4 w-4" />
                          Reject Log
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busyId === log.id}
                          onClick={() => setSelectedReviewLog({ log, mode: log.review === 'rejected' ? 'reject' : 'approve' })}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-semibold border border-hairline bg-white/80 dark:bg-slate-800 text-navy dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          {log.review === 'approved' ? '✓ Approved (Update)' : log.review === 'changes_requested' ? '⚠️ Changes Requested (Update)' : '✗ Rejected (Update)'}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === log.id}
                          onClick={() => review(log.id, 'reset')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-navy dark:hover:text-white hover:underline ml-auto cursor-pointer"
                        >
                          <RotateCcwIcon className="h-3.5 w-3.5" /> Reset Status
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Validation checklist sidebar */}
                <div className="rounded-2xl border border-hairline bg-slate-50/50 dark:bg-slate-900/60 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Validation checklist
                  </h3>
                  <ul className="mt-3 space-y-2.5 text-xs">
                    {log.isPendingWorkSubmission ? (
                      <>
                        <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                          <span>
                            Kept Pending: <strong className="font-semibold text-navy dark:text-white">{log.originalPendingDate || log.date}</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
                          <span>
                            Submitted: <strong className="font-semibold text-navy dark:text-white">{log.pendingSubmissionDate || log.submittedDate || log.date}</strong> at {log.pendingSubmissionAt || log.submittedAt}
                          </span>
                        </li>
                      </>
                    ) : (
                      <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        {isLate ? (
                          <>
                            <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 font-bold" aria-hidden="true" />
                            <span className="font-bold text-amber-900 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-500/40">
                              Submitted Late at {log.submittedAt}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
                            <span>Submitted at {log.submittedAt}</span>
                          </>
                        )}
                      </li>
                    )}
                    <li className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
                      {log.wordCount} words — meets minimum
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      {log.attachmentUrl || log.attachment
                        ? <>
                            <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
                            Screenshot attached
                          </>
                        : <>
                            <XIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
                            No screenshot
                          </>}
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      {log.commits > 0
                        ? <>
                            <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
                            {log.commits} GitHub commit{log.commits > 1 ? 's' : ''} linked
                          </>
                        : <>
                            <XIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                            No commit linked
                          </>}
                    </li>

                    <li className="border-t border-hairline pt-2">
                      {log.review === 'approved' && (
                        <div className="flex items-center gap-1.5 font-semibold text-green-700">
                          <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                          Log Approved
                        </div>
                      )}
                      {log.review === 'changes_requested' && (
                        <div className="flex items-start gap-1.5 font-semibold text-amber-700">
                          <HighlighterIcon className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
                          <div>
                            <span>Targeted Changes Requested</span>
                            <p className="text-[11px] font-normal text-amber-800">
                              Developer notified with highlights & screenshots.
                            </p>
                          </div>
                        </div>
                      )}
                      {log.review === 'rejected' && (
                        <div className="flex items-center gap-1.5 font-semibold text-red-700">
                          <XIcon className="h-4 w-4 text-red-600" />
                          Full Log Rejected
                        </div>
                      )}
                      {log.review === 'pending' && (
                        <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                          <ClockIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          Approval pending
                        </div>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
          {filteredQueue.length === 0 && (
            <li className="rounded-card border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-sm font-semibold text-navy">Nothing here right now</p>
              <p className="mt-1 text-sm text-gray-500">New check-ins from your team will appear here instantly.</p>
            </li>
          )}
        </ul>
      </div>

      {/* Review & Feedback Modal */}
      {selectedReviewLog && (
        <ReviewLogFeedbackModal
          isOpen={!!selectedReviewLog}
          onClose={() => setSelectedReviewLog(null)}
          log={selectedReviewLog.log}
          mode={selectedReviewLog.mode}
          onReview={(action, note) => review(selectedReviewLog.log.id, action, note)}
          busy={busyId === selectedReviewLog?.log?.id}
        />
      )}

      {/* Assign Task Modal */}
      <AssignTaskModal
        isOpen={assignTaskModalOpen}
        onClose={() => setAssignTaskModalOpen(false)}
        assignerRole="TL"
        assignerName={`${user?.name || ''} (Team Lead)`}
        developers={developers}
        onTaskAssigned={() => {}}
      />

      {/* Screenshot Zoom Modal */}
      {activeScreenshotModal && (
        <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-navy/80 p-4 backdrop-blur-md animate-in fade-in">
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
