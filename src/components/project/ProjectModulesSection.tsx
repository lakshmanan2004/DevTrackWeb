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
  FileTextIcon,
  XIcon,
  TimerIcon,
  AlertCircleIcon,
  InfoIcon,
  UsersIcon,
  SparklesIcon,
  CalendarIcon
} from 'lucide-react';
import { Project, ProjectModule, ModuleSubmittedLog } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { DeveloperCalendarModal } from '../leader/DeveloperCalendarModal';
import { api, fileUrl } from '../../api/client';

interface ProjectModulesSectionProps {
  project?: Project | null;
  allProjects?: Project[];
  onSelectProject?: (projectId: string) => void;
  developers?: any[];
  canUpdate?: boolean;
  onModuleUpdated?: () => void;
}

export function ProjectModulesSection({
  project,
  allProjects = [],
  onSelectProject,
  developers = [],
  canUpdate = true,
  onModuleUpdated
}: ProjectModulesSectionProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('');
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});
  const [activeScreenshot, setActiveScreenshot] = useState<{ url: string; title: string } | null>(null);
  const [selectedCalendarDev, setSelectedCalendarDev] = useState<{ id: string; name: string; initials?: string; email?: string; team?: string } | null>(null);
  const [error, setError] = useState('');

  if (!project) {
    return (
      <section className="rounded-2xl border-2 border-brand/40 bg-gradient-to-br from-white via-brand-soft/20 to-brand-soft/40 p-6 shadow-card space-y-4 animate-in fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand/20 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-md ring-4 ring-brand/20">
              <LayersIcon className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-navy">
                ⚡ Select a Project to Inspect Modules & Delivery Progress
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                No project selected by default. Pick a project from the dropdown to inspect developer submissions by module.
              </p>
            </div>
          </div>

          {allProjects && allProjects.length > 0 && onSelectProject && (
            <div className="flex items-center gap-2 rounded-xl border-2 border-brand bg-white px-3.5 py-2 shadow-sm ring-4 ring-brand/10">
              <label htmlFor="pms-project-select-empty" className="text-xs font-extrabold text-navy whitespace-nowrap flex items-center gap-1.5">
                <LayersIcon className="h-4 w-4 text-brand" />
                Select Project:
              </label>
              <select
                id="pms-project-select-empty"
                value=""
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-brand focus:outline-none cursor-pointer"
              >
                <option value="" disabled>— Click to Select a Project ({allProjects.length}) —</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.team || 'Team'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="py-8 text-center text-sm text-gray-500 font-medium">
          Please select a project from the dropdown above to inspect its delivery progress, module milestones, and developer submissions.
        </div>
      </section>
    );
  }

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

  const assignedDevsList = project.developerNames && project.developerNames.length > 0
    ? project.developerNames
    : developers.map((d: any) => d.name || d.stat?.name || '').filter(Boolean);

  return (
    <>
      <section className="rounded-2xl border-2 border-brand/30 bg-white p-6 shadow-card space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <LayersIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-navy">
                  ⚡ {project.name} — Modules & Delivery Progress
                </h2>
                <Badge tone="purple">{modules.length} Modules</Badge>
                <Badge tone={completedWeight >= 70 ? 'green' : completedWeight >= 40 ? 'yellow' : 'blue'}>
                  {completedWeight}% Completed
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                Project progress is calculated strictly from Team Leader completed modules ({completedWeight}% completed). Work logs do not alter project progress.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {allProjects && allProjects.length > 1 && onSelectProject && (
              <div className="flex items-center gap-2 rounded-xl border-2 border-brand bg-brand-soft/30 px-3.5 py-1.5 shadow-sm ring-2 ring-brand/20">
                <label htmlFor="pms-project-select" className="text-xs font-extrabold text-navy whitespace-nowrap flex items-center gap-1.5">
                  <LayersIcon className="h-4 w-4 text-brand" />
                  Select Project:
                </label>
                <select
                  id="pms-project-select"
                  value={project.id}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="bg-white rounded-lg px-2.5 py-1 text-xs font-bold text-brand border border-brand/30 shadow-xs focus:outline-none cursor-pointer"
                >
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.team || 'Team'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* HIGHLIGHTED ABOUT THE PROJECT & WHO IS DOING THIS PROJECT */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* ABOUT THE PROJECT CARD */}
          <div className="rounded-xl border-2 border-brand/20 bg-gradient-to-br from-brand-soft/30 to-blue-50/40 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-brand uppercase tracking-wider flex items-center gap-1.5">
                <InfoIcon className="h-4 w-4 text-brand" />
                About the Project
              </h3>
              <Badge tone={project.status === 'completed' ? 'green' : 'blue'}>
                {project.status.toUpperCase()}
              </Badge>
            </div>

            <p className="text-sm font-bold text-navy">
              {project.name}
            </p>
            <p className="text-xs text-gray-700 leading-relaxed">
              {project.description || 'Dedicated academic portal and product delivery platform for staff and students.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-brand/10 text-[11px] font-semibold text-gray-600">
              {project.started && <span>Started: <strong className="text-navy">{project.started}</strong></span>}
              {project.targetDate && <span>· Target: <strong className="text-navy">{project.targetDate}</strong></span>}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-brand font-bold hover:underline"
                >
                  <GithubIcon className="h-3 w-3" /> Repository ↗
                </a>
              )}
            </div>
          </div>

          {/* WHO IS DOING THIS PROJECT CARD */}
          <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-brand-soft/20 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4 text-purple-600" />
                Who is Doing this Project
              </h3>
              <span className="text-[11px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                {assignedDevsList.length} Developer{assignedDevsList.length !== 1 ? 's' : ''} Assigned
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-500">Team:</span>
                <span className="font-extrabold text-navy">Team {project.team || 'VStudy'}</span>
              </div>
              {project.leader && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-500">Leader:</span>
                  <span className="font-extrabold text-brand">{project.leader}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-1 border-t border-purple-100">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Assigned Developers:
                </p>
                <span className="text-[10px] font-medium text-purple-700">
                  💡 Click any developer to view their calendar
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {assignedDevsList.length > 0 ? (
                  assignedDevsList.map((devName: string, idx: number) => {
                    const devObj = (developers || []).find((d: any) => d.name === devName || d.stat?.name === devName || d.id === devName || d._id === devName);
                    const devId = devObj?.id || devObj?._id || devObj?.stat?.id || '';
                    const devInitial = devObj?.initials || devObj?.stat?.initials || devName.slice(0, 2).toUpperCase();
                    const devEmail = devObj?.email || devObj?.stat?.email || '';

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setSelectedCalendarDev({
                            id: devId,
                            name: devName,
                            initials: devInitial,
                            email: devEmail,
                            team: project.team
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-2.5 py-1 text-xs font-bold text-navy shadow-xs hover:border-brand hover:bg-brand-soft/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                        title={`Click to view ${devName}'s monthly task & activity calendar`}
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-extrabold text-white group-hover:ring-2 group-hover:ring-brand/40 transition-all">
                          {devInitial}
                        </span>
                        <span className="group-hover:text-brand group-hover:underline">{devName}</span>
                        {devObj?.online && (
                          <span className="h-2 w-2 rounded-full bg-ok" title="Online now" />
                        )}
                        <CalendarIcon className="h-3.5 w-3.5 text-purple-400 group-hover:text-brand transition-colors ml-0.5" />
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-500 italic">No developers assigned yet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COMPLETION PROGRESS */}
        <div className="space-y-2 rounded-xl border border-hairline bg-canvas/60 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
            <span className="font-bold text-navy">Completion Progress</span>
            <span className="text-navy font-bold">{completedWeight}% of 100%</span>
          </div>
          <ProgressBar
            value={completedWeight}
            tone={completedWeight >= 70 ? 'green' : completedWeight >= 40 ? 'yellow' : 'red'}
            label={`${project.name} module completion`}
          />
        </div>

        {/* HIGHLIGHTED MODULE PROOF INSPECTION DROPDOWN BAR */}
        {modules.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-brand/40 bg-gradient-to-r from-brand-soft/40 via-purple-50 to-brand-soft/20 p-4 shadow-sm ring-2 ring-brand/10">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-xs ring-2 ring-brand/20">
                <EyeIcon className="h-5 w-5" />
              </div>
              <div>
                <label htmlFor="pms-module-inspect-dropdown" className="text-xs font-extrabold text-navy flex items-center gap-1.5">
                  Inspect Developer Submissions by Module:
                </label>
                <p className="text-[11px] text-gray-500">
                  Select a module below to inspect work logs, developer proof screenshots & commit references.
                </p>
              </div>
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
                className="rounded-xl border-2 border-brand bg-white px-3.5 py-2 text-xs font-bold text-navy shadow-sm focus:ring-2 focus:ring-brand/30 focus:outline-none cursor-pointer"
              >
                <option value="">— Show All Modules ({modules.length}) —</option>
                {modules.map((m) => {
                  const approvedDoneLogs = (m.submittedLogs || []).filter(
                    (log) => (log.status === 'done' || log.status === 'completed') && log.review === 'approved'
                  );
                  const count = approvedDoneLogs.length || m.logsCount || 0;
                  return (
                    <option key={m.id || m.name} value={m.id}>
                      {m.name} ({count} approved completed log{count !== 1 ? 's' : ''})
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
                className="rounded-lg bg-white border border-brand/30 px-3 py-1.5 text-xs font-bold text-brand shadow-xs hover:bg-brand-soft transition-colors"
              >
                Reset Module Filter
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
              const approvedDoneLogs = (m.submittedLogs || []).filter(
                (log) => (log.status === 'done' || log.status === 'completed') && log.review === 'approved'
              );
              const logsCount = approvedDoneLogs.length || m.logsCount || 0;

              return (
                <div key={m.id} className="p-4 transition-colors hover:bg-white space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-navy">{m.name}</span>
                        <Badge tone="purple">{m.weightPercentage}% Weight</Badge>
                        <Badge tone={logsCount > 0 ? 'green' : 'grey'}>
                          {logsCount} Completed & Approved Logs
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
                        {isExpanded ? 'Hide Approved Proof' : `Inspect Submitted Proof (${logsCount})`}
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
                                <span className="pointer-events-none absolute right-0 top-full mt-1.5 z-30 hidden w-56 rounded-xl bg-navy p-2.5 text-[11px] font-semibold text-white shadow-xl group-hover:block border border-gray-700 animate-in fade-in">
                                  🔒 Cannot complete: At least 1 completed &amp; TL-approved work log must be submitted for this module first.
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
                          Completed &amp; Approved Work Logs under "{m.name}"
                        </h4>
                        <span className="text-[11px] font-bold text-brand">
                          Total {logsCount} Approved Submissions · {m.totalMinutes || 0} mins active
                        </span>
                      </div>

                      {approvedDoneLogs.length > 0 ? (
                        <div className="space-y-3">
                          {approvedDoneLogs.map((log: ModuleSubmittedLog) => (
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
                                  <Badge tone="green">
                                    COMPLETED &amp; APPROVED
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
                                    log.attachmentUrl.split('?')[0].toLowerCase().endsWith('.pdf') ? (
                                      <a
                                        href={fileUrl(log.attachmentUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-900 hover:bg-red-100 transition-colors"
                                      >
                                        <FileTextIcon className="h-4 w-4 text-red-600" />
                                        <span className="underline">Document Proof (PDF)</span>
                                        <span className="rounded bg-red-200 text-red-800 px-1.5 py-0.5 text-[10px] font-bold">Open PDF ↗</span>
                                      </a>
                                    ) : (
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
                                    )
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
                            No completed and approved work logs under "{m.name}" yet.
                          </p>
                          <p className="mt-0.5 text-[11px] text-amber-700">
                            Only tasks marked Done/Completed by developers and Approved by the Team Leader appear here as verified module proof.
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

      {/* DEVELOPER CALENDAR MODAL */}
      {selectedCalendarDev && (
        <DeveloperCalendarModal
          isOpen={!!selectedCalendarDev}
          onClose={() => setSelectedCalendarDev(null)}
          developer={selectedCalendarDev}
        />
      )}
    </>
  );
}
