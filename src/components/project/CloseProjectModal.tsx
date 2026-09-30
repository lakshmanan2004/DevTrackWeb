import React, { useState } from 'react';
import {
  CheckCircle2Icon,
  ClockIcon,
  PauseCircleIcon,
  TrophyIcon,
  XIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { api } from '../../api/client';

interface CloseProjectModalProps {
  open: boolean;
  project: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CloseProjectModal({ open, project, onClose, onSuccess }: CloseProjectModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<'completed' | 'ongoing' | 'hold'>(
    project?.status === 'completed' ? 'completed' : 'completed'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open || !project) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/50 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-project-title"
    >
      <div className="w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-pop">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              selectedStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-soft text-brand'
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
              <h2 id="close-project-title" className="text-base font-bold text-navy">
                Project Delivery & Status
              </h2>
              <p className="text-xs text-gray-500">
                {project.name} · {project.team}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 px-6 py-5 text-sm">
          {/* Project Snapshot Card */}
          <div className="rounded-xl border border-hairline bg-canvas p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500">Current Progress</span>
                <p className="text-lg font-bold text-navy">{project.progress}% Complete</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-500">Modules Completed</span>
                <p className="text-sm font-bold text-navy">
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
              <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-danger">
                <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                Note: {project.blockers} active blocker(s) reported by team.
              </p>
            )}
          </div>

          {/* Status Selection */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Select Target Status
            </label>
            <div className="grid gap-2.5">
              {/* Option 1: Complete / Close */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  selectedStatus === 'completed'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/30 shadow-xs'
                    : 'border-hairline bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="project-status"
                  value="completed"
                  checked={selectedStatus === 'completed'}
                  onChange={() => setSelectedStatus('completed')}
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy text-sm">Mark as Completed (Close Project)</span>
                    <Badge tone="green" dot>Completed</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Finalizes the project, sets delivery date to today, and marks all milestone modules as completed.
                  </p>
                </div>
              </label>

              {/* Option 2: Ongoing */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  selectedStatus === 'ongoing'
                    ? 'border-brand bg-brand-soft/40 ring-2 ring-brand/30 shadow-xs'
                    : 'border-hairline bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="project-status"
                  value="ongoing"
                  checked={selectedStatus === 'ongoing'}
                  onChange={() => setSelectedStatus('ongoing')}
                  className="mt-1 h-4 w-4 text-brand focus:ring-brand"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy text-sm">Keep Ongoing (Active Development)</span>
                    <Badge tone="blue" dot>Ongoing</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Project is actively worked on by developers and tracked by hourly check-ins.
                  </p>
                </div>
              </label>

              {/* Option 3: Hold */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  selectedStatus === 'hold'
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/30 shadow-xs'
                    : 'border-hairline bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="project-status"
                  value="hold"
                  checked={selectedStatus === 'hold'}
                  onChange={() => setSelectedStatus('hold')}
                  className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy text-sm">Put Project On Hold</span>
                    <Badge tone="yellow" dot>On Hold</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Temporarily pauses project milestones and alerts.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-hairline bg-canvas px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={busy}
            icon={selectedStatus === 'completed' ? <CheckCircle2Icon className="h-4 w-4" /> : undefined}
            className={selectedStatus === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
          >
            {busy ? 'Updating…' : selectedStatus === 'completed' ? 'Confirm & Close Project' : 'Update Status'}
          </Button>
        </div>
      </div>
    </div>
  );
}
