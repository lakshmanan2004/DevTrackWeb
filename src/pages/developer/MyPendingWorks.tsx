import React, { useState } from 'react';
import {
  ClockIcon,
  CheckCircle2Icon,
  HighlighterIcon,
  EyeIcon,
  SendIcon,
  CalendarIcon,
  XIcon,
  GithubIcon,
  ImageIcon,
  TimerIcon,
  ZapIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FilterPills } from '../../components/ui/FilterPills';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { usePendingWorks, useProjects } from '../../hooks/useLive';
import { api, apiUpload, fileUrl } from '../../api/client';

export function MyPendingWorks() {
  const { data, refetch } = usePendingWorks();
  const { data: projData } = useProjects('mine');
  const userProjects = projData?.projects || [];
  const defaultProjectId = userProjects[0]?.id || '';

  const items = data?.items || [];
  const [filter, setFilter] = useState('all');
  const [activeScreenshotModal, setActiveScreenshotModal] = useState<{ url: string; title: string } | null>(null);
  const [resubmitModalItem, setResubmitModalItem] = useState<any | null>(null);

  // Full Work Log Fields
  const [resubmitText, setResubmitText] = useState('');
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [selectedModuleName, setSelectedModuleName] = useState('');
  const [commitUrl, setCommitUrl] = useState('');
  const [activeMinutes, setActiveMinutes] = useState(45);
  const [taskStatus, setTaskStatus] = useState<'progress' | 'done' | 'blocked'>('done');
  const [blockerText, setBlockerText] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const wordCount = resubmitText.trim().split(/\s+/).filter(Boolean).length;
  const wordsOk = wordCount >= 30;

  const isBlocked = taskStatus === 'blocked';
  const blockerValid = !isBlocked || blockerText.trim().length > 0;
  const canSubmit = wordsOk && !!resubmitFile && !fileError && blockerValid && !busy;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) {
      setResubmitFile(null);
      setFileError('');
      return;
    }

    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const ALLOWED_EXTS = ['.png', '.jpg', '.jpeg', '.pdf'];
    const ext = selectedFile.name.includes('.')
      ? selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      : '';

    const isAllowedFormat = ALLOWED_TYPES.includes(selectedFile.type) || ALLOWED_EXTS.includes(ext);
    if (!isAllowedFormat) {
      setResubmitFile(null);
      setFileError(`⚠️ Invalid file format "${ext || 'unknown'}". Only PNG, JPG, and PDF files are allowed.`);
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > MAX_SIZE) {
      const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setResubmitFile(null);
      setFileError(`⚠️ File size (${sizeMb} MB) exceeds the maximum allowed 10 MB limit. Please select a smaller file.`);
      e.target.value = '';
      return;
    }
    setFileError('');
    setResubmitFile(selectedFile);
  };

  const openSubmissionModal = (item: any) => {
    setResubmitModalItem(item);
    setResubmitText('');
    setResubmitFile(null);
    setFileError('');
    setSelectedModuleName('');
    setCommitUrl('');
    setActiveMinutes(45);
    setTaskStatus('done');
    setBlockerText('');
  };

  const activeProjectObj = userProjects.find((p: any) => p.id === (resubmitModalItem?.projectId || defaultProjectId)) || userProjects[0];
  const activeModules = activeProjectObj?.modules || [];
  const activeModuleName = selectedModuleName || activeModules[0]?.name || '';

  const handleResolve = async () => {
    if (!resubmitModalItem) return;

    if (!wordsOk) {
      setToastMessage(`⚠️ Description must be at least 30 words (currently ${wordCount} words).`);
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }
    if (!resubmitFile) {
      setToastMessage('⚠️ Screenshot proof is required (*). Please choose an image or document proof.');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }
    if (fileError) {
      setToastMessage(fileError);
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }
    if (taskStatus === 'blocked' && !blockerText.trim()) {
      setToastMessage('⚠️ Please provide details about what is blocking your task.');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    setBusy(true);
    try {
      if (resubmitModalItem.kind === 'log') {
        const fd = new FormData();
        fd.append('text', resubmitText);
        if (activeModuleName) fd.append('moduleName', activeModuleName);
        if (taskStatus) fd.append('status', taskStatus);
        if (activeMinutes) fd.append('minutes', String(activeMinutes));
        if (commitUrl) fd.append('commitUrl', commitUrl);
        if (taskStatus === 'blocked' && blockerText) fd.append('blocker', blockerText);
        fd.append('attachment', resubmitFile);

        await apiUpload(`/api/logs/${resubmitModalItem.logId}/resubmit`, fd);
        setToastMessage('Resubmission sent to Team Lead for approval!');
      } else {
        // Full Work Log submission for Assigned Task
        const fd = new FormData();
        fd.append('projectId', resubmitModalItem.projectId || defaultProjectId);
        if (resubmitModalItem.taskId) fd.append('taskId', resubmitModalItem.taskId);
        fd.append('isPendingWork', 'true');
        fd.append('originalPendingDate', resubmitModalItem.dateStr || '');
        if (activeModuleName) fd.append('moduleName', activeModuleName);
        fd.append('description', resubmitText);
        fd.append('status', taskStatus);
        if (taskStatus === 'blocked') fd.append('blocker', blockerText);
        fd.append('minutes', String(activeMinutes));
        if (commitUrl) fd.append('commitUrl', commitUrl);
        fd.append('attachment', resubmitFile);

        await apiUpload('/api/logs', fd);
        setToastMessage('Full Work Log submitted & sent to Team Lead for approval!');
      }

      setTimeout(() => setToastMessage(''), 3500);
      setResubmitModalItem(null);
      setResubmitText('');
      setResubmitFile(null);
      setCommitUrl('');
      refetch();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to submit work log');
      setTimeout(() => setToastMessage(''), 3500);
    } finally {
      setBusy(false);
    }
  };

  const visible = filter === 'all'
    ? items
    : filter === 'resubmit'
    ? items.filter((i: any) => i.highlightedText || i.status === 'changes_requested')
    : items.filter((i: any) => !i.highlightedText && i.status !== 'changes_requested');

  const groupedByDate: Record<string, any[]> = {};
  visible.forEach((item: any) => {
    if (!groupedByDate[item.dateStr]) groupedByDate[item.dateStr] = [];
    groupedByDate[item.dateStr].push(item);
  });

  return (
    <>
      <PageHeader
        title="My Pending Works"
        subtitle="All pending tasks, in-progress logs & resubmissions assigned by Team Lead / PM, grouped by date"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
            <ClockIcon className="h-4 w-4" />
            {items.length} Works Pending
          </span>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {toastMessage && (
          <div className={`flex items-center gap-2 rounded-xl p-3 text-xs font-bold text-white shadow-md animate-in fade-in ${toastMessage.includes('⚠️') ? 'bg-amber-600' : 'bg-emerald-600'}`}>
            <CheckCircle2Icon className="h-4 w-4 shrink-0" />
            {toastMessage}
          </div>
        )}

        <FilterPills
          ariaLabel="Filter pending works"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All Pending', count: items.length },
            { id: 'resubmit', label: 'Targeted Feedback', count: items.filter((i: any) => i.highlightedText || i.status === 'changes_requested').length },
            { id: 'blocker', label: 'Assigned Lead & In Progress Tasks', count: items.filter((i: any) => !i.highlightedText && i.status !== 'changes_requested').length }
          ]}
        />

        {Object.keys(groupedByDate).length > 0 ? (
          Object.entries(groupedByDate).map(([dateLabel, dateItems]) => (
            <section key={dateLabel} className="space-y-3">
              <div className="glass-surface inline-flex items-center gap-2.5 rounded-2xl px-4 py-2 border border-white/70 dark:border-white/10 shadow-glass backdrop-blur-xl">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Pending Date:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold">{dateLabel}</span>
                </h2>
                <Badge tone="amber" size="sm" className="font-bold">
                  {dateItems.length} {dateItems.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>

              <div className="space-y-3">
                {dateItems.map((item: any) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-amber-300/80 dark:border-amber-500/30 bg-white/80 dark:bg-[#121a2c]/90 backdrop-blur-xl p-5 sm:p-6 shadow-glass transition-all hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-xl bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 text-xs font-bold text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                          <ZapIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          {item.hourLabel}
                        </span>
                        <h3 className="text-sm font-bold text-navy dark:text-white">{item.taskTitle}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'awaiting_lead_approval' ? (
                          <Badge tone="blue">
                            <span className="inline-flex items-center gap-1">
                              <ClockIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              Sent to Review
                            </span>
                          </Badge>
                        ) : item.status === 'changes_requested' ? (
                          <Badge tone="yellow">Changes Requested</Badge>
                        ) : item.status === 'in_progress' ? (
                          <Badge tone="blue">In Progress Log</Badge>
                        ) : item.status === 'blocked' ? (
                          <Badge tone="red">Blocked Log</Badge>
                        ) : (
                          <Badge tone="purple">Assigned by {item.assignedBy}</Badge>
                        )}
                      </div>
                    </div>

                    {item.highlightedText && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 text-xs font-semibold text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30">
                        <HighlighterIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        Targeted Snippet: "{item.highlightedText}"
                      </div>
                    )}

                    <div className="mt-3 rounded-2xl border border-amber-200/90 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/30 p-4 shadow-glass">
                      <p className="text-xs leading-relaxed text-amber-950 dark:text-amber-200">
                        <strong className="text-navy dark:text-white">Feedback / Instruction:</strong> "{item.feedbackNote}"
                      </p>

                      {item.screenshotUrl && (
                        <div className="mt-3">
                          <p className="mb-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-300">
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
                            className="group relative inline-block overflow-hidden rounded-xl border border-hairline bg-gray-900 cursor-pointer shadow-md"
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

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
                      {item.status === 'awaiting_lead_approval' ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/15 dark:bg-blue-500/25 border border-blue-500/40 dark:border-blue-400/40 px-3 py-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 shadow-xs">
                          <ClockIcon className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400 animate-pulse" />
                          <span>Submitted for Review · Awaiting Team Lead approval</span>
                        </div>
                      ) : (
                        <div />
                      )}

                      <Button
                        disabled={item.status === 'awaiting_lead_approval'}
                        onClick={item.status === 'awaiting_lead_approval' ? undefined : () => openSubmissionModal(item)}
                        className={`font-bold border-none text-white shadow-glass transition-all ${
                          item.status === 'awaiting_lead_approval'
                            ? 'bg-blue-600/60 opacity-80 cursor-not-allowed shadow-none'
                            : item.status === 'changes_requested'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 cursor-pointer shadow-amber-500/20'
                            : 'btn-glass-primary !from-emerald-500 !to-teal-600 hover:!from-emerald-600 hover:!to-teal-700 cursor-pointer'
                        }`}
                        icon={item.status === 'awaiting_lead_approval' ? <ClockIcon className="h-3.5 w-3.5" /> : <SendIcon className="h-3.5 w-3.5" />}
                      >
                        {item.status === 'awaiting_lead_approval'
                          ? 'Sent to Review'
                          : item.status === 'changes_requested'
                          ? 'Update Log & Resubmit'
                          : 'Mark as Completed & Request Approval'}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="glass-card rounded-3xl p-12 text-center shadow-glass">
            <CheckCircle2Icon className="mx-auto h-10 w-10 text-emerald-400" />
            <h3 className="mt-3 text-base font-bold text-navy dark:text-white">All Pending Works Cleared!</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">You have completed all pending tasks assigned by your Team Lead and PM.</p>
          </div>
        )}
      </div>

      {/* FULL WORK LOG SUBMISSION MODAL */}
      {resubmitModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in">
          <div className="glass-modal relative w-full max-w-lg rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-base font-bold text-navy dark:text-white flex items-center gap-2">
                  <ZapIcon className="h-5 w-5 text-amber-500" />
                  {resubmitModalItem.status === 'awaiting_lead_approval'
                    ? 'Update Work Log (Sent to Review)'
                    : resubmitModalItem.kind === 'log'
                    ? 'Resubmit Work Log'
                    : 'Submit Full Work Log for Assigned Task'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{resubmitModalItem.taskTitle} · Assigned by {resubmitModalItem.assignedBy}</p>
              </div>
              <button onClick={() => setResubmitModalItem(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-500/10 hover:text-white transition-all">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                <strong>Lead Task Note:</strong> "{resubmitModalItem.feedbackNote}"
              </div>

              {/* 0. Module Select */}
              {activeModules.length > 0 && (
                <div>
                  <Select
                    label="Select Project Module *"
                    size="lg"
                    fullWidth
                    value={activeModuleName}
                    onChange={(val) => setSelectedModuleName(val)}
                    options={activeModules.map((m: any) => ({
                      value: m.name,
                      label: m.name,
                      badge: `${m.weightPercentage}% Weight`
                    }))}
                  />
                </div>
              )}

              {/* 1. Description */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy dark:text-slate-200">
                  Work Log Description <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  value={resubmitText}
                  onChange={(e) => setResubmitText(e.target.value)}
                  placeholder="Describe in detail what you implemented, files changed, and tested logic (min 30 words)..."
                  className="glass-input w-full rounded-2xl p-3 text-xs text-navy dark:text-white focus:outline-none placeholder:text-slate-400"
                />
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className={wordsOk ? 'font-semibold text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                    {wordCount} / min 30 words
                  </span>
                  {!wordsOk && (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                      <AlertTriangleIcon className="h-3.5 w-3.5" /> Minimum 30 words required
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Screenshot Proof */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy dark:text-slate-200">
                  Screenshot Proof <span className="text-danger">*</span>
                </label>
                <div className={`flex items-center gap-3 rounded-2xl border border-dashed p-3 transition-all ${
                  fileError
                    ? 'border-rose-400/50 bg-rose-500/10'
                    : resubmitFile
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'glass-surface hover:border-blue-400/50'
                }`}>
                  <ImageIcon className={`h-5 w-5 shrink-0 ${fileError ? 'text-rose-400' : resubmitFile ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs text-navy dark:text-slate-200 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand hover:file:bg-violet-500/20 cursor-pointer"
                  />
                </div>
                {resubmitFile && !fileError && (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2Icon className="h-3.5 w-3.5 shrink-0" />
                    Selected: {resubmitFile.name} ({(resubmitFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
                {!resubmitFile && !fileError && (
                  <p className="mt-1 text-[11px] font-medium text-rose-400 flex items-center gap-1">
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                    Screenshot proof is required to submit log
                  </p>
                )}
                {fileError && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 p-2.5 text-xs font-semibold text-rose-300">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>

              {/* 3. GitHub Commit URL */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy dark:text-slate-200">
                  GitHub Commit URL <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <GithubIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={commitUrl}
                    onChange={(e) => setCommitUrl(e.target.value)}
                    placeholder="https://github.com/org/repo/commit/sha"
                    className="glass-input h-10 w-full rounded-2xl pl-10 pr-3 text-xs text-navy dark:text-white focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* 4. Active Minutes & Task Status */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy dark:text-slate-200">
                    Active Minutes Spent
                  </label>
                  <div className="relative">
                    <TimerIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={activeMinutes}
                      onChange={(e) => setActiveMinutes(Number(e.target.value) || 45)}
                      className="glass-input h-10 w-full rounded-2xl pl-10 pr-3 text-xs font-bold text-navy dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <Select
                    label="Task Status"
                    size="lg"
                    fullWidth
                    value={taskStatus}
                    onChange={(val) => setTaskStatus(val)}
                    options={[
                      { value: 'done', label: 'Completed / Ready for Review', tone: 'green' },
                      { value: 'progress', label: 'In Progress', tone: 'blue' },
                      { value: 'blocked', label: 'Blocked with Issues', tone: 'red' }
                    ]}
                  />
                </div>
              </div>

              {/* Blocker input if blocked */}
              {taskStatus === 'blocked' && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-rose-400">
                    Describe Blocker / Issue <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={blockerText}
                    onChange={(e) => setBlockerText(e.target.value)}
                    placeholder="What is blocking you from completing this task?"
                    className="glass-input h-10 w-full rounded-2xl border-rose-500/30 bg-rose-500/10 px-3 text-xs text-navy dark:text-white focus:outline-none placeholder:text-rose-300/60"
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
                disabled={!canSubmit}
                className={`font-bold border-none text-white transition-all ${
                  canSubmit
                    ? 'btn-glass-primary !from-emerald-500 !to-teal-600 hover:!from-emerald-600 hover:!to-teal-700 shadow-md cursor-pointer'
                    : 'bg-slate-400/40 dark:bg-slate-700/40 text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed shadow-none'
                }`}
                icon={<CheckCircle2Icon className="h-4 w-4" />}
              >
                {busy
                  ? 'Submitting…'
                  : resubmitModalItem.status === 'awaiting_lead_approval'
                  ? 'Update Submission for Review'
                  : 'Submit Work Log to Lead'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Expand Modal */}
      {activeScreenshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in">
          <div className="glass-modal relative max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-hairline pb-2 text-white">
              <span className="text-sm font-semibold text-navy dark:text-white">{activeScreenshotModal.title}</span>
              <button
                onClick={() => setActiveScreenshotModal(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-500/10 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <img
              src={activeScreenshotModal.url}
              alt="Screenshot full view"
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain mx-auto border border-hairline shadow-glass"
            />
          </div>
        </div>
      )}
    </>
  );
}
