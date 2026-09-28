import React, { useState } from 'react';
import {
  CheckCircle2Icon,
  ClockIcon,
  LayersIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  GithubIcon,
  ImageIcon,
  XIcon,
  TimerIcon,
  AlertCircleIcon
} from 'lucide-react';
import { Project, ProjectModule, ModuleSubmittedLog } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { api, fileUrl } from '../../api/client';

interface ProjectModulesSectionProps {
  project: Project;
  allProjects?: Project[];
  onSelectProject?: (projectId: string) => void;
  canUpdate?: boolean;
  onModuleUpdated?: () => void;
}

export function ProjectModulesSection({
  project,
  allProjects = [],
  onSelectProject,
  canUpdate = true,
  onModuleUpdated
}: ProjectModulesSectionProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('');
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});
  const [activeScreenshot, setActiveScreenshot] = useState<{ url: string; title: string } | null>(null);
  const [error, setError] = useState('');

  const modules = project.modules || [];
  const completedWeight = modules
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + (m.weightPercentage || 0), 0);

  const toggleExpand = (moduleId: string) => {
    setExpandedModuleIds((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const updateStatus = async (moduleId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    setError('');
    setUpdatingId(moduleId);
    try {
      await api(`/api/projects/${project.id}/modules/${moduleId}`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      if (onModuleUpdated) onModuleUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update module status');
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleModules = selectedModuleFilter
    ? modules.filter((m) => m.id === selectedModuleFilter || m.name === selectedModuleFilter)
    : modules;

  return (
    <>
      <section className="rounded-card border border-hairline bg-white p-5 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-navy">
                <LayersIcon className="h-5 w-5 text-brand" />
                {project?.name ? `${project.name} — Modules & Delivery Progress` : 'Project Modules & Delivery Progress'} ({modules.length})
              </h2>
              {project?.name && (
                <Badge tone="purple">Project: {project.name}</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Project progress is calculated strictly from Team Leader completed modules ({completedWeight}% completed). Work logs do not alter project progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {allProjects && allProjects.length > 1 && onSelectProject && (
              <div className="flex items-center gap-2 rounded-xl border border-hairline bg-canvas px-3 py-1.5 shadow-xs">
                <label htmlFor="pms-project-select" className="text-xs font-bold text-navy whitespace-nowrap">Select Project:</label>
                <select
                  id="pms-project-select"
                  value={project.id}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="bg-transparent text-xs font-bold text-brand focus:outline-none cursor-pointer"
                >
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.team})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Badge tone={completedWeight >= 70 ? 'green' : completedWeight >= 40 ? 'yellow' : 'blue'}>
              Overall Progress: {completedWeight}%
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
            <span>Completion Progress</span>
            <span className="text-navy">{completedWeight}% of 100%</span>
          </div>
          <ProgressBar
            value={completedWeight}
            tone={completedWeight >= 70 ? 'green' : completedWeight >= 40 ? 'yellow' : 'red'}
            label={`${project.name} module completion`}
          />
        </div>

        {/* MODULE PROOF INSPECTION DROPDOWN BAR */}
        {modules.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand-soft/20 p-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="pms-module-inspect-dropdown" className="text-xs font-bold text-navy flex items-center gap-1.5">
                <EyeIcon className="h-4 w-4 text-brand shrink-0" />
                Inspect Dev Submissions by Module:
              </label>
              <select
                id="pms-module-inspect-dropdown"
                value={selectedModuleFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedModuleFilter(val);
                  if (val) {
                    setExpandedModuleIds({ [val]: true });
                  } else {
                    setExpandedModuleIds({});
                  }
                }}
                className="rounded-lg border border-brand/40 bg-white px-3 py-1.5 text-xs font-bold text-navy shadow-xs focus:border-brand focus:outline-none cursor-pointer"
              >
                <option value="">— Show All Modules ({modules.length}) —</option>
                {modules.map((m) => {
                  const count = m.submittedLogs?.length || m.logsCount || 0;
                  return (
                    <option key={m.id || m.name} value={m.id}>
                      {m.name} ({count} dev log{count !== 1 ? 's' : ''} submitted)
                    </option>
                  );
                })}
              </select>
            </div>
            {selectedModuleFilter && (
              <button
                type="button"
                onClick={() => {
                  setSelectedModuleFilter('');
                  setExpandedModuleIds({});
                }}
                className="text-[11px] font-bold text-brand hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
            {error}
          </p>
        )}

        {visibleModules.length > 0 ? (
          <div className="divide-y divide-gray-100 rounded-xl border border-hairline bg-canvas/40 overflow-hidden">
            {visibleModules.map((m) => {
              const isCompleted = m.status === 'completed';
              const isInProgress = m.status === 'in_progress';
              const isBusy = updatingId === m.id;
              const isExpanded = !!expandedModuleIds[m.id];
              const logsCount = m.submittedLogs?.length || m.logsCount || 0;

              return (
                <div key={m.id} className="p-4 transition-colors hover:bg-white space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-navy">{m.name}</span>
                        <Badge tone="purple">{m.weightPercentage}% Weight</Badge>
                        <Badge tone={logsCount > 0 ? 'blue' : 'grey'}>
                          {logsCount} Dev Logs Submitted
                        </Badge>
                        {isCompleted && (
                          <Badge tone="green" dot>
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2Icon className="h-3 w-3" /> Completed
                            </span>
                          </Badge>
                        )}
                        {isInProgress && (
                          <Badge tone="yellow" dot>
                            <span className="inline-flex items-center gap-1">
                              <PlayCircleIcon className="h-3 w-3" /> In Progress
                            </span>
                          </Badge>
                        )}
                        {m.status === 'todo' && (
                          <Badge tone="grey" dot>
                            <span className="inline-flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" /> To Do
                            </span>
                          </Badge>
                        )}
                      </div>
                      {m.description && (
                        <p className="text-xs text-gray-600">{m.description}</p>
                      )}
                      {isCompleted && m.completedAt && (
                        <p className="text-[11px] text-gray-400">
                          ✓ Marked completed on {m.completedAt}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleExpand(m.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
                          isExpanded
                            ? 'border-brand bg-brand-soft text-brand'
                            : 'border-hairline bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <EyeIcon className="h-3.5 w-3.5 text-brand" />
                        {isExpanded ? 'Hide Dev Proof' : `Inspect Submitted Proof (${logsCount})`}
                        {isExpanded ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
                      </button>

                      {canUpdate && (
                        <>
                          {m.status !== 'todo' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => updateStatus(m.id, 'todo')}
                            >
                              Reset To Do
                            </Button>
                          )}
                          {m.status !== 'in_progress' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => updateStatus(m.id, 'in_progress')}
                            >
                              Mark In Progress
                            </Button>
                          )}
                          {!isCompleted && (
                            <div className="relative group inline-block">
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isBusy || logsCount === 0}
                                onClick={() => updateStatus(m.id, 'completed')}
                                icon={<ShieldCheckIcon className="h-3.5 w-3.5" />}
                                className={logsCount === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400 border-gray-400 hover:bg-gray-400' : ''}
                              >
                                {isBusy ? 'Updating...' : 'Mark Completed'}
                              </Button>
                              {logsCount === 0 && (
                                <span className="pointer-events-none absolute right-0 top-full mt-1.5 z-30 hidden w-52 rounded-xl bg-navy p-2.5 text-[11px] font-semibold text-white shadow-xl group-hover:block border border-gray-700 animate-in fade-in">
                                  🔒 Cannot complete: Developers must submit at least 1 work log under this module first.
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* EXPANDABLE SUBMITTED PROOF SECTION FOR TL / PM */}
                  {isExpanded && (
                    <div className="mt-3 rounded-xl border border-brand/30 bg-brand-soft/20 p-4 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-brand/20 pb-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
                          <EyeIcon className="h-4 w-4 text-brand" />
                          Developer Work Logs & Proof Grouped under "{m.name}"
                        </h4>
                        <span className="text-[11px] font-bold text-brand">
                          Total {logsCount} Submissions · {m.totalMinutes || 0} mins active
                        </span>
                      </div>

                      {m.submittedLogs && m.submittedLogs.length > 0 ? (
                        <div className="space-y-3">
                          {m.submittedLogs.map((log: ModuleSubmittedLog) => (
                            <div
                              key={log.id}
                              className="rounded-lg border border-hairline bg-white p-3.5 shadow-card transition-all hover:shadow-md"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-hairline pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                                    {log.initials || log.developerName.slice(0, 2).toUpperCase()}
                                  </span>
                                  <div>
                                    <span className="text-xs font-bold text-navy">{log.developerName}</span>
                                    <span className="ml-2 text-[11px] text-gray-500">{log.submittedAt}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600">
                                    <TimerIcon className="h-3 w-3 text-amber-600" /> {log.activeMinutes} mins
                                  </span>
                                  <Badge tone={log.review === 'approved' ? 'green' : log.review === 'rejected' ? 'red' : 'yellow'}>
                                    {log.review.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>

                              <div className="mt-2 space-y-2">
                                {log.task && (
                                  <p className="text-xs font-bold text-navy">
                                    Task: <span className="text-brand">{log.task}</span>
                                  </p>
                                )}
                                <p className="text-xs text-navy leading-relaxed bg-canvas p-2.5 rounded-lg border border-hairline">
                                  "{log.description}"
                                </p>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                  {log.attachmentUrl ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveScreenshot({
                                          url: fileUrl(log.attachmentUrl!),
                                          title: `${log.developerName} — ${m.name} Proof`
                                        })
                                      }
                                      className="group relative inline-flex items-center gap-2 rounded-lg border border-hairline bg-gray-900 p-1 pr-3 text-xs font-bold text-white hover:border-brand"
                                    >
                                      <img
                                        src={fileUrl(log.attachmentUrl)}
                                        alt="Proof preview"
                                        className="h-10 w-16 object-cover rounded"
                                      />
                                      <span className="flex items-center gap-1 text-[11px]">
                                        <ImageIcon className="h-3.5 w-3.5 text-brand" /> View Screenshot Proof
                                      </span>
                                    </button>
                                  ) : (
                                    <span className="text-[11px] italic text-gray-400">No screenshot attached</span>
                                  )}

                                  {log.commitUrl && (
                                    <a
                                      href={log.commitUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-800"
                                    >
                                      <GithubIcon className="h-3.5 w-3.5 text-sky-400" />
                                      View Commit Diff
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-4 text-center">
                          <p className="text-xs font-semibold text-amber-900 flex items-center justify-center gap-1.5">
                            <AlertCircleIcon className="h-4 w-4 text-amber-600" />
                            No work logs submitted under "{m.name}" yet.
                          </p>
                          <p className="mt-0.5 text-[11px] text-amber-700">
                            Developers must select this module when checking in. Team Leads can verify all proof here before marking completed.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
            No modules created for this project yet.
          </div>
        )}
      </section>

      {/* FULL SCREENSHOT EXPAND MODAL */}
      {activeScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-gray-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-gray-800 pb-2 text-white">
              <span className="text-sm font-semibold">{activeScreenshot.title}</span>
              <button
                onClick={() => setActiveScreenshot(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <img
              src={activeScreenshot.url}
              alt="Full proof preview"
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
