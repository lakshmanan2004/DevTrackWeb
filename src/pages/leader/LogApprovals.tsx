import React, { useState } from 'react';
import {
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  GitCommitVerticalIcon,
  ImageIcon,
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
import { TargetedFeedbackModal } from '../../components/leader/TargetedFeedbackModal';
import { AssignTaskModal } from '../../components/common/AssignTaskModal';
import { useLive, useDevelopers } from '../../hooks/useLive';
import { api, apiUpload, fileUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { isLogLate } from '../../utils/logTimeliness';

export function LogApprovals() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<string>('all');
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
  const [filter, setFilter] = useState('pending');
  const [activeModalItem, setActiveModalItem] = useState<{ developer: string; log: any } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [activeScreenshotModal, setActiveScreenshotModal] = useState<{ url: string; title: string } | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const moduleNames = Array.from(new Set(queue.map((i: any) => i.moduleName).filter(Boolean)));

  const handleTextSelection = (_logId: string) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
    }
  };

  const review = async (logId: string, action: 'approve' | 'reject' | 'reset') => {
    setBusyId(logId);
    try {
      const note = rejectionNotes[logId];
      await api(`/api/logs/${logId}/review`, { method: 'POST', body: { action, note } });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveTargetedFeedback = async (feedbackData: any) => {
    if (!activeModalItem) return;
    const fd = new FormData();
    fd.append('highlightedText', feedbackData.highlightedText || '');
    fd.append('comment', feedbackData.comment);
    if (feedbackData.file) fd.append('screenshot', feedbackData.file);
    setBusyId(activeModalItem.log.id);
    try {
      await apiUpload(`/api/logs/${activeModalItem.log.id}/feedback`, fd);
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
      const targetDevId = String(developerFilter).trim();
      const itemDevId = String(
        item.developerId ||
        (item.developer && (item.developer._id || item.developer.id || item.developer)) ||
        ''
      ).trim();
      if (itemDevId !== targetDevId) return false;
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
        subtitle={`${user?.teamName || 'Team'} · ${user?.projectName || 'Project'}`}
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

            <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-white p-1 shadow-card">
              <button
                type="button"
                onClick={() => setDateFilter(new Date().toISOString().slice(0, 10))}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  dateFilter === new Date().toISOString().slice(0, 10)
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-navy hover:bg-gray-100'
                }`}
              >
                Today's Logs
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  dateFilter === 'all'
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
                  value={dateFilter === 'all' ? '' : dateFilter}
                  onChange={(e) => setDateFilter(e.target.value || 'all')}
                  className="bg-transparent text-xs font-bold text-navy outline-none cursor-pointer"
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

        {/* Floating Selection Tooltip Banner */}
        {selectedText && (
          <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <HighlighterIcon className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Text Highlighted: <span className="font-semibold italic">"{selectedText.substring(0, 60)}{selectedText.length > 60 ? '...' : ''}"</span>
                </p>
                <p className="text-xs text-amber-700">
                  Click "Highlight & Request Specific Changes" on any log to attach feedback for this highlight.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedText('')}
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              Clear Highlight
            </button>
          </div>
        )}

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
                {/* ASSIGNED TASK PROMINENT BANNER */}
                {isAssigned && (
                  <div className="flex items-center justify-between bg-amber-500 px-5 py-2 text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <ZapIcon className="h-4 w-4 animate-pulse" />
                      ⚡ SUBMISSION FOR ASSIGNED LEAD TASK: {log.assignedTaskTitle || log.task}
                    </span>
                    <span className="rounded bg-amber-700/60 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                      Approving this log completes the task
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-navy">
                      {log.developerName}
                      <span className="ml-2 font-normal text-gray-500">
                        📅 {log.date} · {log.hourLabel} · {isLate ? `submitted late at ${log.submittedAt}` : `submitted ${log.submittedAt}`} · {log.project || user?.teamName}
                      </span>
                    </p>
                    {isLate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-extrabold shadow-xs uppercase tracking-wide">
                        ⚠️ Late Submission
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAssigned && (
                      <Badge tone="amber">
                        ⚡ Assigned Task
                      </Badge>
                    )}
                    {log.review === 'changes_requested' && (
                      <Badge tone="amber">Changes Requested ({log.targetedFeedback?.length || 0})</Badge>
                    )}
                    {log.review === 'approved' && <Badge tone="green">Approved</Badge>}
                    {log.review === 'rejected' && <Badge tone="red">Rejected</Badge>}
                    {log.review === 'pending' && <Badge tone="blue">{log.project || 'Pending review'}</Badge>}
                  </div>
                </div>

              <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-sm font-bold text-navy">{log.task}</h2>
                    <TaskStatusBadge status={log.status} />
                    {log.moduleName && (
                      <Badge tone="purple">Module: {log.moduleName}</Badge>
                    )}
                  </div>

                  <div
                    className="relative mt-2.5 rounded-lg p-2 transition-colors hover:bg-gray-50/80 cursor-text"
                    onMouseUp={() => handleTextSelection(log.id)}
                  >
                    <p className="text-sm leading-relaxed text-gray-700 selection:bg-amber-200 selection:text-amber-950">
                      {log.description}
                    </p>
                    <span className="mt-1 block text-[11px] text-gray-400">
                      💡 Select text above to auto-fill highlighted snippet into targeted feedback.
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-green-600">
                    {log.wordCount} words · meets minimum
                  </p>

                  {/* Attachments */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-navy">
                      <ImageIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                      <a href={fileUrl(log.attachmentUrl)} target="_blank" rel="noreferrer" className="hover:underline">
                        {log.attachment}
                      </a>
                    </span>
                    {log.commits > 0 && (
                      <span className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-navy">
                        <GitCommitVerticalIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                        {log.commitUrl ? (
                          <a href={log.commitUrl} target="_blank" rel="noreferrer" className="hover:underline">
                            view commit ({log.commits})
                          </a>
                        ) : (
                          `${log.commits} commit${log.commits > 1 ? 's' : ''} linked`
                        )}
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-ok" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  {/* Targeted Feedback section */}
                  {log.targetedFeedback && log.targetedFeedback.length > 0 && (
                    <div className="mt-5 space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                          <HighlighterIcon className="h-4 w-4 text-amber-600" />
                          Targeted Feedback & Screenshots ({log.targetedFeedback.length})
                        </h4>
                        <span className="text-[11px] font-semibold text-amber-700">
                          No full resubmit required
                        </span>
                      </div>

                      <div className="space-y-3">
                        {log.targetedFeedback.map((fb: any) => (
                          <div key={fb.id} className="rounded-lg border border-amber-200/80 bg-white p-3.5 shadow-sm">
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
                                <p className="mb-1 text-[11px] font-semibold text-gray-500">Attached Screenshot:</p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveScreenshotModal({
                                      url: fileUrl(fb.screenshotUrl),
                                      title: fb.screenshotName || 'Screenshot Preview'
                                    })
                                  }
                                  className="group relative inline-block overflow-hidden rounded-lg border border-hairline bg-gray-900"
                                >
                                  <img
                                    src={fileUrl(fb.screenshotUrl)}
                                    alt="Targeted feedback screenshot"
                                    className="h-24 w-40 object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-navy/40 opacity-0 transition-opacity group-hover:opacity-100">
                                    <span className="flex items-center gap-1 text-xs font-bold text-white">
                                      <EyeIcon className="h-4 w-4" /> View Full
                                    </span>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resubmission history */}
                  {log.resubmissions && log.resubmissions.length > 0 && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-brand-soft p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-brand">Developer resubmissions</p>
                      <ul className="mt-2 space-y-1.5">
                        {log.resubmissions.map((r: any, i: number) => (
                          <li key={i} className="text-xs text-gray-700">
                            <span className="font-semibold">{r.at}</span> — {r.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rejection input */}
                  {log.review === 'pending' && (
                    <div className="mt-4">
                      <label
                        htmlFor={`reject-${log.id}`}
                        className="mb-1.5 block text-xs font-semibold text-navy"
                      >
                        Full Rejection Reason (Only if rejecting entire log)
                      </label>
                      <textarea
                        id={`reject-${log.id}`}
                        rows={2}
                        value={rejectionNotes[log.id] || ''}
                        onChange={(e) =>
                          setRejectionNotes({ ...rejectionNotes, [log.id]: e.target.value })
                        }
                        placeholder="Reason for full log rejection..."
                        className="w-full rounded-lg border border-hairline px-3 py-2.5 text-sm text-navy placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-hairline pt-3">
                    <Button
                      disabled={busyId === log.id}
                      onClick={() => review(log.id, 'approve')}
                      icon={<CheckIcon className="h-4 w-4" />}
                      className={log.review === 'approved' ? 'bg-green-700 text-white' : ''}
                    >
                      {log.review === 'approved' ? 'Approved' : 'Approve Log'}
                    </Button>

                    <button
                      type="button"
                      disabled={busyId === log.id}
                      onClick={() => setActiveModalItem({ developer: log.developerName, log })}
                      className="inline-flex items-center justify-center gap-2 rounded-lg h-9 px-3.5 text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      <HighlighterIcon className="h-4 w-4 text-white" />
                      {log.targetedFeedback && log.targetedFeedback.length > 0
                        ? 'Add More Targeted Feedback'
                        : 'Highlight & Request Specific Changes'}
                    </button>

                    <Button
                      variant="danger"
                      disabled={busyId === log.id}
                      onClick={() => review(log.id, 'reject')}
                      icon={<XIcon className="h-4 w-4" />}
                    >
                      Reject Entire Log
                    </Button>

                    {log.review !== 'pending' && (
                      <button
                        onClick={() => review(log.id, 'reset')}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-navy hover:underline ml-auto"
                      >
                        <RotateCcwIcon className="h-3.5 w-3.5" /> Reset Status
                      </button>
                    )}
                  </div>
                </div>

                {/* Validation checklist sidebar */}
                <div className="rounded-xl border border-hairline bg-canvas p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Validation checklist
                  </h3>
                  <ul className="mt-3 space-y-2.5 text-xs">
                    <li className="flex items-start gap-2 text-gray-700">
                      {isLate ? (
                        <>
                          <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 font-bold" aria-hidden="true" />
                          <span className="font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                            Submitted Late at {log.submittedAt}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
                          Submitted {log.submittedAt}
                        </>
                      )}
                    </li>
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

      {/* Targeted Feedback Modal */}
      {activeModalItem && (
        <TargetedFeedbackModal
          isOpen={!!activeModalItem}
          onClose={() => setActiveModalItem(null)}
          log={activeModalItem.log}
          developerName={activeModalItem.developer}
          initialHighlightedText={selectedText}
          onSaveFeedback={handleSaveTargetedFeedback}
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
