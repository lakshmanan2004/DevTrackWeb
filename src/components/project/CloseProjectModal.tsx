import React, { useState } from 'react';
import {
  CheckCircle2Icon,
  ClockIcon,
  PauseCircleIcon,
  TrophyIcon,
  XIcon,
  AlertTriangleIcon,
  Trash2Icon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface CloseProjectModalProps {
  open: boolean;
  project: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CloseProjectModal({ open, project, onClose, onSuccess }: CloseProjectModalProps) {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<'completed' | 'ongoing' | 'hold'>(
    project?.status === 'completed' ? 'completed' : project?.status === 'hold' ? 'hold' : 'ongoing'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open || !project) return null;

  const canDelete = user?.role === 'admin' || user?.role === 'manager';
  const modules = project.modules || [];
  const completedModules = modules.filter((m: any) => m.status === 'completed').length;
  const totalModules = modules.length;

  const handleUpdateStatus = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/api/projects/${project.id}/status`, {
        method: 'PATCH',
        body: { status: selectedStatus }
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update project status');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete project "${project.name}"?\n\nThis will remove the project, unassign team developers so they can join other projects, and clear project work logs.`)) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api(`/api/projects/${project.id}`, { method: 'DELETE' });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-6 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-project-title"
    >
      <div className="glass-modal w-full max-w-[540px] overflow-hidden rounded-3xl shadow-2xl border border-white/30 dark:border-white/15">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/20 dark:border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-inner ${
              selectedStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-blue-500/20 text-blue-500 ring-1 ring-blue-500/30'
            }`}>
              {selectedStatus === 'completed' ? (
                <TrophyIcon className="h-5 w-5" aria-hidden="true" />
              ) : selectedStatus === 'hold' ? (
                <PauseCircleIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ClockIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div>
              <h2 id="close-project-title" className="text-base font-bold text-slate-900 dark:text-white">
                Project Delivery &amp; Status
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {project.name} · {project.team}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 px-6 py-5 text-sm">
          {/* Project Snapshot Card */}
          <div className="glass-surface rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Progress</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{project.progress}% Complete</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Modules Completed</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {completedModules} / {totalModules} Modules
                </p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar
                value={project.progress}
                tone={project.progress >= 80 ? 'green' : 'blue'}
                label="Project overall progress"
              />
            </div>
            {project.blockers > 0 && (
              <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                Note: {project.blockers} active blocker(s) reported by team.
              </p>
            )}
          </div>

          {/* Status Selection */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Target Status
            </label>
            <div className="grid gap-2.5">
              {/* Option 1: Complete / Close */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                  selectedStatus === 'completed'
                    ? 'border-emerald-500/50 bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-md backdrop-blur-md'
                    : 'glass-surface hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="project-status"
                  value="completed"
                  checked={selectedStatus === 'completed'}
                  onChange={() => setSelectedStatus('completed')}
                  className="mt-1 h-4 w-4 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Mark as Completed (Close Project)</span>
                    <Badge tone="green" dot>Completed</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Finalizes the project, sets delivery date to today, and marks all milestone modules as completed.
                  </p>
                </div>
              </label>

              {/* Option 2: Ongoing */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                  selectedStatus === 'ongoing'
                    ? 'border-blue-500/50 bg-blue-500/15 ring-2 ring-blue-500/30 shadow-md backdrop-blur-md'
                    : 'glass-surface hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="project-status"
                  value="ongoing"
                  checked={selectedStatus === 'ongoing'}
                  onChange={() => setSelectedStatus('ongoing')}
                  className="mt-1 h-4 w-4 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Keep Ongoing (Active Development)</span>
                    <Badge tone="blue" dot>Ongoing</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Project is actively worked on by developers and tracked by hourly check-ins.
                  </p>
                </div>
              </label>

              {/* Option 3: Hold */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                  selectedStatus === 'hold'
                    ? 'border-amber-500/50 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-md backdrop-blur-md'
                    : 'glass-surface hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="project-status"
                  value="hold"
                  checked={selectedStatus === 'hold'}
                  onChange={() => setSelectedStatus('hold')}
                  className="mt-1 h-4 w-4 text-amber-500 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Put Project On Hold</span>
                    <Badge tone="yellow" dot>On Hold</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Temporarily pauses project milestones and alerts.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/20 dark:border-white/10 px-6 py-4 glass-surface">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy} className="rounded-xl">
              Cancel
            </Button>
            {canDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteProject}
                disabled={busy}
                icon={<Trash2Icon className="h-4 w-4 text-rose-500" />}
                className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50 text-xs rounded-xl"
              >
                Delete Project
              </Button>
            )}
          </div>
          <button
            type="button"
            onClick={handleUpdateStatus}
            disabled={busy}
            className={`btn-glass-primary px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 ${
              selectedStatus === 'completed' ? 'from-emerald-500 to-teal-600' : ''
            }`}
          >
            {selectedStatus === 'completed' && <CheckCircle2Icon className="h-4 w-4" />}
            <span>{busy ? 'Updating…' : selectedStatus === 'completed' ? 'Confirm & Close Project' : 'Update Status'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
