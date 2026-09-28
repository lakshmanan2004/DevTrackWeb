import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  GithubIcon,
  TimerIcon,
  UploadCloudIcon,
  XIcon } from
'lucide-react';
import { Button } from '../ui/Button';
import { TaskStatus } from '../../types';
import { taskStatusMeta } from '../ui/TaskStatusBadge';
import { useLive } from '../../hooks/useLive';
import { apiUpload } from '../../api/client';

const MIN_WORDS = 30;
const statusOrder: TaskStatus[] = ['todo', 'progress', 'done', 'blocked'];

interface CheckInModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function CheckInModal({ open, onClose, onSubmitted }: CheckInModalProps) {
  const { data: projectData } = useLive<{ projects: any[] }>(open ? '/api/projects?scope=mine' : null, [], 0);
  const projects = projectData?.projects || [];
  const { data: taskData } = useLive<{ tasks: any[] }>(open ? '/api/tasks' : null, [], 0);
  const pendingTasks = (taskData?.tasks || []).filter((t: any) => t.status !== 'completed');

  const [projectId, setProjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedModuleName, setSelectedModuleName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('progress');
  const [blocker, setBlocker] = useState('');
  const [minutes, setMinutes] = useState(45);
  const [file, setFile] = useState<File | null>(null);
  const [commitUrl, setCommitUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveProjectId = projectId || projects[0]?.id || '';
  const activeProjectObj = projects.find((p: any) => p.id === effectiveProjectId) || projects[0];
  const activeModules = activeProjectObj?.modules || [];
  const activeModuleName = selectedModuleName || activeModules[0]?.name || '';

  const wordCount = useMemo(
    () => description.trim().split(/\s+/).filter(Boolean).length,
    [description]
  );
  const wordsOk = wordCount >= MIN_WORDS;
  const canSubmit = wordsOk && !!file && effectiveProjectId !== '' && !busy;

  if (!open) return null;

  const reset = () => {
    setProjectId('');
    setSelectedTaskId('');
    setSelectedModuleName('');
    setDescription('');
    setStatus('progress');
    setBlocker('');
    setMinutes(45);
    setFile(null);
    setCommitUrl('');
    setError('');
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    const t = pendingTasks.find((item: any) => item.id === taskId);
    if (t) {
      if (!description) {
        setDescription(`Working on assigned task: ${t.title}. ${t.note || ''}`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('projectId', effectiveProjectId);
      if (selectedTaskId) fd.append('taskId', selectedTaskId);
      if (activeModuleName) fd.append('moduleName', activeModuleName);
      fd.append('description', description);
      fd.append('status', status);
      if (status === 'blocked') fd.append('blocker', blocker);
      fd.append('minutes', String(minutes));
      if (commitUrl) fd.append('commitUrl', commitUrl);
      if (file) fd.append('attachment', file);
      await apiUpload('/api/logs', fd);
      reset();
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit log');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/50 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title">
      <div className="w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-pop">
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="flex gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
              <TimerIcon className="h-4 w-4 text-brand" aria-hidden="true" />
            </span>
            <div>
              <h2 id="checkin-title" className="text-base font-bold text-navy">
                Hourly Check-in
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ·
                {' '}current hour slot
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close check-in form"
            className="rounded-md p-1.5 text-gray-400 transition-colors duration-150 ease-out hover:bg-gray-100 hover:text-gray-600">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5" onSubmit={(e) => e.preventDefault()}>
          {pendingTasks.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <label htmlFor="ci-assigned-task" className="mb-1 block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                ⚡ Submit for an Assigned Lead Task? (Optional)
              </label>
              <select
                id="ci-assigned-task"
                value={selectedTaskId}
                onChange={(e) => handleTaskSelect(e.target.value)}
                className="h-9 w-full rounded-lg border border-amber-300 bg-white px-3 text-xs font-medium text-navy focus:outline-none"
              >
                <option value="">— None (Standard Hourly Log) —</option>
                {pendingTasks.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.title} (Due: {t.dueDate})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="ci-project" className="mb-1.5 block text-sm font-semibold text-navy">
              Which project is this log for? <span className="text-danger">*</span>
            </label>
            <select
              id="ci-project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-navy">
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {projects.length === 0 ? (
              <p className="mt-1.5 text-xs font-semibold text-amber-700">
                You haven't been added to a project team yet — ask your Project Manager to add you.
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-500">
                Your log will be visible to the Team Leader of the selected project only.
              </p>
            )}
          </div>

          {activeModules.length > 0 && (
            <div>
              <label htmlFor="ci-module" className="mb-1.5 block text-sm font-semibold text-navy flex items-center justify-between">
                <span>Select Project Module <span className="text-danger">*</span></span>
                <span className="text-xs font-normal text-brand font-mono">Decoupled Delivery Tracker</span>
              </label>
              <select
                id="ci-module"
                value={activeModuleName}
                onChange={(event) => setSelectedModuleName(event.target.value)}
                className="h-10 w-full rounded-lg border border-brand bg-white px-3 text-xs font-bold text-navy shadow-xs focus:outline-none"
              >
                {activeModules.map((m: any) => (
                  <option key={m.id || m.name} value={m.name}>
                    {m.name} ({m.weightPercentage}% Weight)
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">
                Grouping your work log under this module allows Team Leads to inspect proof before completing milestones.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="ci-desc" className="mb-1.5 block text-sm font-semibold text-navy">
              What did you work on? <span className="text-danger">*</span>
            </label>
            <textarea
              id="ci-desc"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Fixed auth bug, reviewed PR"
              className="w-full rounded-lg border border-hairline px-3 py-2.5 text-sm leading-relaxed text-navy placeholder:text-gray-400" />
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className={wordsOk ? 'font-semibold text-green-600' : 'text-gray-500'}>
                {wordCount} / min {MIN_WORDS} words
              </span>
              {!wordsOk &&
              <span className="inline-flex items-center gap-1.5 font-semibold text-danger">
                  <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Minimum 30 words required
                </span>
              }
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">
              Task Status <span className="text-danger">*</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {statusOrder.map((option) => {
                const meta = taskStatusMeta[option];
                const selected = status === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setStatus(option)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out ${
                    selected ?
                    'border-brand bg-brand text-white' :
                    'border-hairline bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>);
              })}
            </div>
          </fieldset>

          {status === 'blocked' &&
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3.5">
              <label htmlFor="ci-blocker" className="block text-sm font-semibold text-orange-900">
                What is blocking you?
              </label>
              <textarea
              id="ci-blocker"
              rows={3}
              value={blocker}
              onChange={(event) => setBlocker(event.target.value)}
              placeholder="Describe the blocker and who can unblock you"
              className="mt-2 w-full rounded-lg border border-orange-200 px-3 py-2.5 text-sm text-navy placeholder:text-orange-300" />
            </div>
          }

          <div>
            <label htmlFor="ci-minutes" className="mb-1.5 block text-sm font-semibold text-navy">
              Active minutes this hour
            </label>
            <input
              id="ci-minutes"
              type="range"
              min={0}
              max={60}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
              className="w-full accent-blue-600" />
            <p className="mt-1 text-xs font-semibold tabular-nums text-gray-600">{minutes} minutes</p>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-navy">
              Screenshot Proof <span className="text-danger">*</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ?
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-ok-soft px-3.5 py-3">
                <CheckCircle2Icon className="h-4 w-4 text-ok" aria-hidden="true" />
                <p className="truncate text-sm font-semibold text-green-800">{file.name}</p>
                <button
                type="button"
                onClick={() => setFile(null)}
                className="ml-auto text-xs font-semibold text-green-700 hover:underline">
                  Replace
                </button>
              </div> :
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-colors duration-150 ease-out hover:border-brand hover:bg-brand-soft">
                <UploadCloudIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-navy">
                  Drop screenshot or click to browse
                </span>
                <span className="text-xs text-gray-500">Required · PNG JPG PDF · Max 10MB</span>
              </button>
            }
          </div>

          <div>
            <label htmlFor="ci-commit" className="mb-1.5 block text-sm font-semibold text-navy">
              GitHub Commit Link
            </label>
            <div className="relative">
              <GithubIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true" />
              <input
                id="ci-commit"
                value={commitUrl}
                onChange={(event) => setCommitUrl(event.target.value)}
                placeholder="github.com/you/repo/commit/a3f2b1"
                className="h-10 w-full rounded-lg border border-hairline pl-10 pr-3 text-sm text-navy placeholder:text-gray-400" />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Linked as proof for coding tasks</p>
          </div>

          {error &&
          <p className="rounded-lg border border-red-200 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </p>
          }
        </form>

        <div className="flex items-center justify-between gap-3 border-t border-hairline bg-canvas px-5 py-4">
          <p className="text-xs text-gray-500">
            <span className="text-danger">*</span> required fields
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={handleSubmit}
              icon={<ArrowRightIcon className="h-4 w-4" />}>
              {busy ? 'Submitting…' : 'Submit Log'}
            </Button>
          </div>
        </div>
      </div>
    </div>);
}
