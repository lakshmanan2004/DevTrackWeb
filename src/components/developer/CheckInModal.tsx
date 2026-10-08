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
import { Select } from '../ui/Select';
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
  targetSlot?: number;
}

export function CheckInModal({ open, onClose, onSubmitted, targetSlot }: CheckInModalProps) {
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
  const [fileError, setFileError] = useState('');
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
  const canSubmit = wordsOk && !!file && !fileError && effectiveProjectId !== '' && !busy;

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
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCommitUrl('');
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) {
      setFile(null);
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
      setFile(null);
      setFileError(`⚠️ Invalid file format "${ext || 'unknown'}". Only PNG, JPG, and PDF files are allowed.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > MAX_SIZE) {
      const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setFile(null);
      setFileError(`⚠️ File size (${sizeMb} MB) exceeds the maximum allowed 10 MB limit. Please select a smaller file.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileError('');
    setFile(selectedFile);
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
      if (targetSlot !== undefined) fd.append('hourSlot', String(targetSlot));
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
    >
      <div className="glass-modal w-full max-w-[560px] overflow-hidden p-0 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 text-brand shadow-glass">
              <TimerIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="checkin-title" className="text-base font-black text-navy tracking-tight">
                Hourly Check-in
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ·
                {' '}{targetSlot !== undefined ? `${targetSlot > 12 ? targetSlot - 12 : targetSlot} ${targetSlot >= 12 ? 'PM' : 'AM'} slot` : 'current hour slot'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close check-in form"
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form className="max-h-[72vh] space-y-5 overflow-y-auto p-6" onSubmit={(e) => e.preventDefault()}>
          {pendingTasks.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 backdrop-blur-md">
              <label className="mb-1.5 block text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                ⚡ Submit for an Assigned Lead Task? (Optional)
              </label>
              <Select
                value={selectedTaskId}
                onChange={(val) => handleTaskSelect(String(val))}
                placeholder="— None (Standard Hourly Log) —"
                options={[
                  { value: '', label: '— None (Standard Hourly Log) —' },
                  ...pendingTasks.map((t: any) => ({
                    value: t.id,
                    label: t.title,
                    description: `Due: ${t.dueDate} · Priority: ${t.priority || 'Normal'}`
                  }))
                ]}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-navy dark:text-white">
              Which project is this log for? <span className="text-red-500">*</span>
            </label>
            <Select
              value={projectId}
              onChange={(val) => setProjectId(String(val))}
              placeholder="Select Project..."
              options={projects.map((p) => ({
                value: p.id,
                label: p.name,
                description: p.description
              }))}
            />
            {projects.length === 0 ? (
              <p className="mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                You haven't been added to a project team yet — ask your Project Manager to add you.
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Your log will be visible to the Team Leader of the selected project only.
              </p>
            )}
          </div>

          {activeModules.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-navy dark:text-white">Select Project Module <span className="text-red-500">*</span></span>
                <span className="text-[11px] font-bold text-brand font-mono">Decoupled Delivery Tracker</span>
              </div>
              <Select
                value={activeModuleName}
                onChange={(val) => setSelectedModuleName(String(val))}
                placeholder="Select Module..."
                options={activeModules.map((m: any) => ({
                  value: m.name,
                  label: m.name,
                  badge: `${m.weightPercentage}% Weight`
                }))}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Grouping your work log under this module allows Team Leads to inspect proof before completing milestones.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="ci-desc" className="mb-1.5 block text-xs font-bold text-navy">
              What did you work on? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ci-desc"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Fixed auth bug, reviewed PR"
              className="glass-input w-full p-3.5 text-xs leading-relaxed text-navy placeholder:text-slate-400 font-normal"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs font-medium">
              <span className={wordsOk ? 'font-bold text-emerald-600' : 'text-slate-400'}>
                {wordCount} / min {MIN_WORDS} words
              </span>
              {!wordsOk && (
                <span className="inline-flex items-center gap-1.5 font-bold text-rose-600">
                  <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Minimum 30 words required
                </span>
              )}
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-bold text-navy">
              Task Status <span className="text-red-500">*</span>
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
                    className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      selected
                        ? 'btn-glass-primary !text-white border-transparent scale-[1.02]'
                        : 'glass-surface border-white/80 text-slate-600 hover:bg-white/80'
                    }`}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {status === 'blocked' && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 backdrop-blur-md">
              <label htmlFor="ci-blocker" className="block text-xs font-bold text-orange-950 dark:text-orange-200">
                What is blocking you?
              </label>
              <textarea
                id="ci-blocker"
                rows={3}
                value={blocker}
                onChange={(event) => setBlocker(event.target.value)}
                placeholder="Describe the blocker and who can unblock you"
                className="glass-input mt-2 w-full p-3 text-xs text-navy placeholder:text-orange-300"
              />
            </div>
          )}

          <div>
            <label htmlFor="ci-minutes" className="mb-1.5 block text-xs font-bold text-navy">
              Active minutes this hour
            </label>
            <input
              id="ci-minutes"
              type="range"
              min={0}
              max={60}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
              className="w-full accent-blue-600"
            />
            <p className="mt-1 text-xs font-bold tabular-nums text-slate-500">{minutes} minutes</p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold text-navy">
              Screenshot Proof <span className="text-red-500">*</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 backdrop-blur-md">
                <CheckCircle2Icon className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
                <p className="truncate text-xs font-bold text-emerald-800 dark:text-emerald-300">{file.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setFileError('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="ml-auto text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 transition-all duration-200 cursor-pointer ${
                  fileError
                    ? 'border-rose-300 bg-rose-50/40 hover:border-rose-500'
                    : 'glass-surface border-slate-300 hover:border-blue-500 hover:bg-white/80'
                }`}
              >
                <UploadCloudIcon className={`h-6 w-6 ${fileError ? 'text-rose-500' : 'text-slate-400'}`} aria-hidden="true" />
                <span className="text-xs font-bold text-navy">
                  Drop screenshot or click to browse
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Required · PNG JPG PDF · Max 10MB</span>
              </button>
            )}
            {fileError && (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-bold text-rose-600">
                <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="ci-commit" className="mb-1.5 block text-xs font-bold text-navy">
              GitHub Commit Link
            </label>
            <div className="relative">
              <GithubIcon
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="ci-commit"
                value={commitUrl}
                onChange={(event) => setCommitUrl(event.target.value)}
                placeholder="github.com/you/repo/commit/a3f2b1"
                className="glass-input h-10 w-full pl-10 pr-3.5 text-xs text-navy placeholder:text-slate-400 font-medium"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-medium">Linked as proof for coding tasks</p>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-bold text-rose-600">
              {error}
            </p>
          )}
        </form>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200/60 p-5 bg-slate-50/40">
          <p className="text-[11px] text-slate-400 font-medium">
            <span className="text-red-500">*</span> required fields
          </p>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={handleSubmit}
              icon={<ArrowRightIcon className="h-4 w-4" />}
            >
              {busy ? 'Submitting…' : 'Submit Log'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
