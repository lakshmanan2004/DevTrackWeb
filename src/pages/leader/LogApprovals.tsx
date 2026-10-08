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
import { Select } from '../../components/ui/Select';
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
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 overflow-visible">
          <div className="shrink-0">
            <FilterPills
              size="sm"
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
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {developers.length > 0 && (
              <div className="w-48 xl:w-52">
                <Select
                  size="sm"
                  fullWidth
                  value={developerFilter}
                  onChange={(val) => setDeveloperFilter(val)}
                  icon={<UsersIcon className="h-3.5 w-3.5" />}
                  placeholder={`All Developers (${developers.length})`}
                  options={[
                    { value: '', label: `All Developers (${developers.length})` },
                    ...developers.map((dev: any) => {
                      const dId = getDevId(dev);
                      return {
                        value: dId,
                        label: dev.name || dev.stat?.name || 'Developer',
                        badge: dev.role || 'Developer'
                      };
                    })
                  ]}
                  searchable
                />
              </div>
            )}

            <div className="glass-surface flex items-center gap-1 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setDateFilter(getTodayStr())}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === getTodayStr()
                    ? 'btn-glass-primary !text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/10'
                }`}
              >
                Today's Logs
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === 'all'
                    ? 'btn-glass-primary !text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/10'
                }`}
              >
                Show All Logs
              </button>

              <div className="h-4 w-px bg-white/20 dark:bg-white/10 mx-0.5" />

              <label className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
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
              <div className="w-44 xl:w-48">
                <Select
                  size="sm"
                  fullWidth
                  value={moduleFilter}
                  onChange={(val) => setModuleFilter(val)}
                  placeholder="All Project Modules"
                  options={[
                    { value: '', label: 'All Project Modules' },
                    ...moduleNames.map((modName: string) => ({
                      value: modName,
                      label: modName
                    }))
                  ]}
                  searchable
                />
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
                className={`glass-card rounded-2xl transition-all overflow-hidden ${
                  isAssigned
                    ? 'border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-500/30'
                    : isLate
                    ? 'border-amber-500/50 ring-2 ring-amber-500/30 bg-amber-500/10'
                    : log.review === 'changes_requested'
                    ? 'border-amber-500/40 ring-2 ring-amber-500/20'
                    : log.review === 'approved'
                    ? 'border-emerald-500/30'
                    : log.review === 'rejected'
                    ? 'border-rose-500/30'
                    : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 dark:border-white/10 px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {log.developerName}
                      <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                        {log.isPendingWorkSubmission ? (
                          <>
                            📅 Kept Pending on: <strong className="font-semibold text-amber-900 dark:text-amber-300">{log.originalPendingDate || log.date}</strong> ({log.hourLabel}) · Submitted on: <strong className="font-semibold text-slate-900 dark:text-white">{log.pendingSubmissionDate || log.submittedDate || log.date} at {log.pendingSubmissionAt || log.submittedAt}</strong>
                          </>
                        ) : (
                          <>
                            📅 {log.date} · {log.hourLabel} · {isLate ? `submitted late at ${log.submittedAt}` : `submitted ${log.submittedAt}`}
                          </>
                        )}
                      </span>
                    </p>
                    {isLate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-extrabold shadow-sm uppercase tracking-wide">
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
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">{formatLogTitle(log.task, log.description)}</h2>
                    <TaskStatusBadge status={log.status} />
                    {log.moduleName && (
                      <Badge tone="purple">Module: {log.moduleName}</Badge>
                    )}
                  </div>

                  <div className="relative mt-2.5 rounded-2xl glass-surface p-3.5">
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
                          className="glass-surface inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer group shadow-sm"
                        >
                          <FileTextIcon className="h-3.5 w-3.5 text-rose-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
                          <span className="underline decoration-rose-500/30 group-hover:decoration-rose-500">{log.attachment || 'document.pdf'}</span>
                          <span className="rounded bg-rose-500/20 text-rose-500 px-1.5 py-0.5 text-[10px] font-bold">
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
                          className="glass-surface inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-500 transition-colors cursor-pointer group shadow-sm"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-blue-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
                          <span className="underline decoration-slate-300 dark:decoration-slate-600 group-hover:decoration-blue-500">{log.attachment || 'screenshot.png'}</span>
                          <span className="rounded bg-blue-500/20 text-blue-500 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-bold">
                            View Proof
                          </span>
                        </button>
                      )
                    ) : (
                      <span className="glass-surface inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                        <ImageIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        <span>{log.attachment || 'No screenshot attached'}</span>
                      </span>
                    )}
                    {log.commits > 0 && (
                      <span className="glass-surface inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white">
                        <GitCommitVerticalIcon className="h-3.5 w-3.5 text-purple-500" aria-hidden="true" />
                        {log.commitUrl ? (
                          <a href={log.commitUrl} target="_blank" rel="noreferrer" className="hover:underline text-blue-500 dark:text-blue-400 font-bold">
                            view commit ({log.commits})
                          </a>
                        ) : (
                          `${log.commits} commit${log.commits > 1 ? 's' : ''} linked`
                        )}
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  {/* Leader Feedback Note */}
                  {log.reviewNote && (
                    <div className={`mt-3.5 rounded-2xl border p-3.5 text-xs leading-relaxed backdrop-blur-md ${
                      log.review === 'approved'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                        : log.review === 'changes_requested'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200'
                    }`}>
                      <span className="font-bold text-slate-900 dark:text-white">Team Leader Note:</span> {log.reviewNote}
                    </div>
                  )}

                  {/* Resubmission history */}
                  {log.resubmissions && log.resubmissions.length > 0 && (
                    <div className="mt-4 rounded-2xl glass-surface border border-blue-500/30 p-3.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">Developer resubmissions</p>
                      <ul className="mt-2 space-y-1.5">
                        {log.resubmissions.map((r: any, i: number) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-900 dark:text-white">{r.at}</span> — {r.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-white/20 dark:border-white/10 pt-3">
                    {log.review === 'pending' ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === log.id}
                          onClick={() => setSelectedReviewLog({ log, mode: 'approve' })}
                          className="btn-glass-primary inline-flex items-center justify-center gap-1.5 rounded-xl h-9 px-4 text-xs font-bold from-emerald-500 to-teal-600 shadow-lg cursor-pointer"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve Log
                        </button>

                        <button
                          type="button"
                          disabled={busyId === log.id}
                          onClick={() => setSelectedReviewLog({ log, mode: 'reject' })}
                          className="btn-glass-primary inline-flex items-center justify-center gap-1.5 rounded-xl h-9 px-4 text-xs font-bold from-rose-500 to-pink-600 shadow-lg cursor-pointer"
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
                          className="glass-surface inline-flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          {log.review === 'approved' ? '✓ Approved (Update)' : log.review === 'changes_requested' ? '⚠️ Changes Requested (Update)' : '✗ Rejected (Update)'}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === log.id}
                          onClick={() => review(log.id, 'reset')}
                          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline ml-auto cursor-pointer"
                        >
                          <RotateCcwIcon className="h-3.5 w-3.5" /> Reset Status
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Validation checklist sidebar */}
                <div className="glass-surface rounded-2xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Validation checklist
                  </h3>
                  <ul className="mt-3 space-y-2.5 text-xs">
                    {log.isPendingWorkSubmission ? (
                      <>
                        <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                          <span>
                            Kept Pending: <strong className="font-semibold text-slate-900 dark:text-white">{log.originalPendingDate || log.date}</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                          <span>
                            Submitted: <strong className="font-semibold text-slate-900 dark:text-white">{log.pendingSubmissionDate || log.submittedDate || log.date}</strong> at {log.pendingSubmissionAt || log.submittedAt}
                          </span>
                        </li>
                      </>
                    ) : (
                      <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        {isLate ? (
                          <>
                            <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 font-bold" aria-hidden="true" />
                            <span className="font-bold text-amber-900 dark:text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                              Submitted Late at {log.submittedAt}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                            <span>Submitted at {log.submittedAt}</span>
                          </>
                        )}
                      </li>
                    )}
                    <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                      {log.wordCount} words — meets minimum
                    </li>
                    <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      {log.attachmentUrl || log.attachment
                        ? <>
                            <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                            Screenshot attached
                          </>
                        : <>
                            <XIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden="true" />
                            No screenshot
                          </>}
                    </li>
                    <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      {log.commits > 0
                        ? <>
                            <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                            {log.commits} GitHub commit{log.commits > 1 ? 's' : ''} linked
                          </>
                        : <>
                            <XIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                            No commit linked
                          </>}
                    </li>

                    <li className="border-t border-white/20 dark:border-white/10 pt-2">
                      {log.review === 'approved' && (
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-500">
                          <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                          Log Approved
                        </div>
                      )}
                      {log.review === 'changes_requested' && (
                        <div className="flex items-start gap-1.5 font-semibold text-amber-500">
                          <HighlighterIcon className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
                          <div>
                            <span>Targeted Changes Requested</span>
                            <p className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                              Developer notified with highlights &amp; screenshots.
                            </p>
                          </div>
                        </div>
                      )}
                      {log.review === 'rejected' && (
                        <div className="flex items-center gap-1.5 font-semibold text-rose-500">
                          <XIcon className="h-4 w-4 text-rose-500" />
                          Full Log Rejected
                        </div>
                      )}
                      {log.review === 'pending' && (
                        <div className="flex items-center gap-1.5 font-semibold text-amber-500">
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
            <li className="glass-card rounded-2xl border-dashed border-white/20 p-12 text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Nothing here right now</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New check-ins from your team will appear here instantly.</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in">
          <div className="glass-modal relative max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl p-4 shadow-2xl border border-white/30 dark:border-white/15">
            <div className="mb-3 flex items-center justify-between border-b border-white/20 dark:border-white/10 pb-2 text-white">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{activeScreenshotModal.title}</span>
              <button
                onClick={() => setActiveScreenshotModal(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <img
              src={activeScreenshotModal.url}
              alt="Screenshot full view"
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain mx-auto shadow-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
