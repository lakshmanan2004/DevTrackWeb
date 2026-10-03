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
    setResubmitText(item.feedbackNote && !item.feedbackNote.includes('Work log submitted') ? item.feedbackNote : '');
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
    setBusy(true);
    try {
      if (resubmitModalItem.kind === 'log') {
        const fd = new FormData();
        fd.append('text', resubmitText || 'Updated log and attached proof.');
        if (activeModuleName) fd.append('moduleName', activeModuleName);
        if (resubmitFile) fd.append('attachment', resubmitFile);
        if (resubmitFile) {
          await apiUpload(`/api/logs/${resubmitModalItem.logId}/resubmit`, fd);
        } else {
          await api(`/api/logs/${resubmitModalItem.logId}/resubmit`, {
            method: 'POST',
            body: { text: resubmitText, moduleName: activeModuleName }
          });
        }
        setToastMessage('Resubmission sent to Team Lead!');
      } else {
        // Full Work Log submission for Assigned Task
        if (!resubmitFile) {
          setToastMessage('⚠️ Screenshot proof is required to submit work log.');
          setTimeout(() => setToastMessage(''), 3000);
          setBusy(false);
          return;
        }
        if (!wordsOk) {
          setToastMessage(`⚠️ Description must be at least 30 words (currently ${wordCount}).`);
          setTimeout(() => setToastMessage(''), 3000);
          setBusy(false);
          return;
        }

        const fd = new FormData();
        fd.append('projectId', resubmitModalItem.projectId || defaultProjectId);
        fd.append('taskId', resubmitModalItem.taskId);
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

      setTimeout(() => setToastMessage(''), 3000);
      setResubmitModalItem(null);
      setResubmitText('');
      setResubmitFile(null);
      setCommitUrl('');
      refetch();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to submit work log');
      setTimeout(() => setToastMessage(''), 3000);
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
                        <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-200 flex items-center gap-1">
                          <ZapIcon className="h-3.5 w-3.5 text-amber-600" />
                          {item.hourLabel}
                        </span>
                        <h3 className="text-sm font-bold text-navy">{item.taskTitle}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'awaiting_lead_approval' ? (
                          <Badge tone="blue">
                            <span className="inline-flex items-center gap-1">
                              <ClockIcon className="h-3 w-3 text-blue-600" />
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
                            className="group relative inline-block overflow-hidden rounded-lg border border-hairline bg-gray-900 cursor-pointer"
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
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-900">
                          <ClockIcon className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                          <span>Submitted for Review · Awaiting Team Lead approval</span>
                        </div>
                      ) : (
                        <div />
                      )}

                      <Button
                        disabled={item.status === 'awaiting_lead_approval'}
                        onClick={item.status === 'awaiting_lead_approval' ? undefined : () => openSubmissionModal(item)}
                        className={`font-bold border-none text-white ${
                          item.status === 'awaiting_lead_approval'
                            ? 'bg-blue-600/80 opacity-85 cursor-not-allowed shadow-none'
                            : item.status === 'changes_requested'
                            ? 'bg-amber-500 hover:bg-amber-600 cursor-pointer'
                            : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
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
          <div className="rounded-2xl border border-hairline bg-white p-12 text-center">
            <CheckCircle2Icon className="mx-auto h-10 w-10 text-emerald-500" />
            <h3 className="mt-3 text-base font-bold text-navy">All Pending Works Cleared!</h3>
            <p className="mt-1 text-xs text-gray-500">You have completed all pending tasks assigned by your Team Lead and PM.</p>
          </div>
        )}
      </div>

      {/* FULL WORK LOG SUBMISSION MODAL */}
      {resubmitModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-hairline bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <ZapIcon className="h-5 w-5 text-amber-500" />
                  {resubmitModalItem.status === 'awaiting_lead_approval'
                    ? 'Update Work Log (Sent to Review)'
                    : resubmitModalItem.kind === 'log'
                    ? 'Resubmit Work Log'
                    : 'Submit Full Work Log for Assigned Task'}
                </h3>
                <p className="text-xs text-gray-500">{resubmitModalItem.taskTitle} · Assigned by {resubmitModalItem.assignedBy}</p>
              </div>
              <button onClick={() => setResubmitModalItem(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                <strong>Lead Task Note:</strong> "{resubmitModalItem.feedbackNote}"
              </div>

              {/* 0. Module Select */}
              {activeModules.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy">
                    Select Project Module <span className="text-danger">*</span>
                  </label>
                  <select
                    value={activeModuleName}
                    onChange={(e) => setSelectedModuleName(e.target.value)}
                    className="h-9 w-full rounded-xl border border-hairline bg-canvas px-3 text-xs font-bold text-navy focus:border-brand focus:bg-white focus:outline-none"
                  >
                    {activeModules.map((m: any) => (
                      <option key={m.id || m.name} value={m.name}>
                        {m.name} ({m.weightPercentage}% Weight)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 1. Description */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy">
                  Work Log Description <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  value={resubmitText}
                  onChange={(e) => setResubmitText(e.target.value)}
                  placeholder="Describe in detail what you implemented, files changed, and tested logic (min 30 words)..."
                  className="w-full rounded-xl border border-hairline bg-canvas p-3 text-xs text-navy focus:border-brand focus:bg-white focus:outline-none"
                />
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className={wordsOk ? 'font-semibold text-green-600' : 'text-gray-500'}>
                    {wordCount} / min 30 words
                  </span>
                  {!wordsOk && (
                    <span className="inline-flex items-center gap-1 font-semibold text-danger">
                      <AlertTriangleIcon className="h-3.5 w-3.5" /> Minimum 30 words required
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Screenshot Proof */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy">
                  Screenshot Proof <span className="text-danger">*</span>
                </label>
                <div className={`flex items-center gap-3 rounded-xl border border-dashed p-3 ${fileError ? 'border-red-300 bg-danger-soft' : 'border-hairline bg-canvas'}`}>
                  <ImageIcon className={`h-5 w-5 shrink-0 ${fileError ? 'text-danger' : 'text-gray-400'}`} />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand hover:file:bg-violet-100"
                  />
                </div>
                {fileError && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-danger-soft p-2.5 text-xs font-semibold text-danger">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>

              {/* 3. GitHub Commit URL */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy">
                  GitHub Commit URL <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <GithubIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={commitUrl}
                    onChange={(e) => setCommitUrl(e.target.value)}
                    placeholder="https://github.com/org/repo/commit/sha"
                    className="h-9 w-full rounded-xl border border-hairline bg-canvas pl-9 pr-3 text-xs text-navy focus:border-brand focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Active Minutes & Task Status */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy">
                    Active Minutes Spent
                  </label>
                  <div className="relative">
                    <TimerIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={activeMinutes}
                      onChange={(e) => setActiveMinutes(Number(e.target.value) || 45)}
                      className="h-9 w-full rounded-xl border border-hairline bg-canvas pl-9 pr-3 text-xs font-bold text-navy focus:border-brand focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy">
                    Task Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as any)}
                    className="h-9 w-full rounded-xl border border-hairline bg-canvas px-3 text-xs font-bold text-navy focus:border-brand focus:bg-white focus:outline-none"
                  >
                    <option value="done">Completed / Ready for Review</option>
                    <option value="progress">In Progress</option>
                    <option value="blocked">Blocked with Issues</option>
                  </select>
                </div>
              </div>

              {/* Blocker input if blocked */}
              {taskStatus === 'blocked' && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-danger">
                    Describe Blocker / Issue
                  </label>
                  <input
                    type="text"
                    value={blockerText}
                    onChange={(e) => setBlockerText(e.target.value)}
                    placeholder="What is blocking you from completing this task?"
                    className="h-9 w-full rounded-xl border border-red-200 bg-danger-soft px-3 text-xs text-navy focus:border-danger focus:outline-none"
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
