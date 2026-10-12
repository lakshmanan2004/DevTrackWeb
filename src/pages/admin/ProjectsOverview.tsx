import React, { useState } from 'react';
import {
  EyeIcon,
  InfoIcon,
  CalendarIcon,
  UsersIcon,
  UserCheckIcon,
  TargetIcon,
  Trash2Icon,
  LayersIcon,
  FolderKanbanIcon,
  CheckCircle2Icon,
  ClockIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Select } from '../../components/ui/Select';
import { useProjects } from '../../hooks/useLive';
import { Project } from '../../types';
import { api } from '../../api/client';

const statusMeta = {
  ongoing: { label: 'Ongoing', tone: 'blue', dot: 'bg-brand' },
  urgent: { label: '🚨 Urgent Sprint', tone: 'red', dot: 'bg-rose-500 animate-pulse' },
  completed: { label: 'Completed', tone: 'green', dot: 'bg-emerald-500' },
  hold: { label: 'On Hold', tone: 'yellow', dot: 'bg-amber-500' }
} as const;

const ProjectCard = React.memo(function ProjectCard({ project, onDelete }: { project: Project; onDelete?: () => void }) {
  const meta = (statusMeta as any)[project.status] || statusMeta.ongoing;
  const isCompleted = project.status === 'completed';

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to permanently delete project "${project.name}"?\n\nThis will dissolve the team and free up all assigned developers.`
      )
    ) {
      return;
    }
    try {
      await api(`/api/projects/${project.id}`, { method: 'DELETE' });
      onDelete?.();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  return (
    <div className="glass-card independent-card flex flex-col justify-between rounded-3xl p-6 space-y-5">
      {/* TOP: TITLE, STATUS BADGES & DELETE ACTION */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${meta.dot} shadow-[0_0_10px_currentColor]`}
              aria-hidden="true"
            />
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {project.name}
            </h3>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 p-1.5 h-8 w-8 rounded-xl shrink-0"
            title="Delete Project (Admin)"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>

        {/* Status and Health Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
          <Badge
            tone={
              project.health === 'On Track' || project.health === 'Delivered on time'
                ? 'green'
                : project.health === 'Slightly Behind'
                ? 'yellow'
                : 'red'
            }
          >
            {project.health}
          </Badge>
        </div>

        {/* Project Description */}
        {project.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
            {project.description}
          </p>
        )}
      </div>

      {/* MIDDLE: PROGRESS INDICATOR */}
      <div className="space-y-2 glass-subcard hover-tile rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <LayersIcon className="h-3.5 w-3.5 text-brand" />
            Project Progress
          </span>
          <span className="tabular-nums font-bold text-slate-900 dark:text-white text-xs">
            {project.progress}%
          </span>
        </div>
        <ProgressBar
          value={project.progress}
          tone={isCompleted ? 'green' : project.status === 'hold' ? 'yellow' : 'blue'}
          label={`${project.name} progress`}
        />
      </div>

      {/* BOTTOM: 2x2 METRIC GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
        {/* Leadership */}
        <div className="space-y-1 glass-subcard hover-tile p-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
            <UserCheckIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>Leadership</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white truncate">
            TL: {project.leader}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            PM: {project.manager} ({project.team})
          </p>
        </div>

        {/* Developers */}
        <div className="space-y-1 glass-subcard hover-tile p-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
            <UsersIcon className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Team Members ({project.developers})</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
            {project.developerNames && project.developerNames.length > 0
              ? project.developerNames.join(', ')
              : `${project.developers} assigned`}
          </p>
        </div>

        {/* Started Date */}
        <div className="space-y-1 glass-subcard hover-tile p-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
            <CalendarIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>Started Date</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white">
            {project.started}
          </p>
        </div>

        {/* Target / Completed Date */}
        <div className="space-y-1 glass-subcard hover-tile p-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
            <TargetIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>{project.ended ? 'Completed Date' : 'Target Date'}</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white">
            {project.ended ? project.ended : project.targetDate || 'TBD'}
          </p>
        </div>
      </div>
    </div>
  );
});

export function ProjectsOverview() {
  const { data, refetch } = useProjects('all');
  const projects = (data?.projects || []) as unknown as Project[];
  const [filterTab, setFilterTab] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const { ongoing, completed, hold, uniqueTeamsCount } = React.useMemo(() => {
    const ong: Project[] = [];
    const comp: Project[] = [];
    const hld: Project[] = [];
    const teamsSet = new Set<string>();

    for (const project of projects) {
      if (project.status === 'ongoing') ong.push(project);
      else if (project.status === 'completed') comp.push(project);
      else if (project.status === 'hold') hld.push(project);

      const t = (project.team && typeof project.team === 'string' && project.team.trim()
        ? project.team.trim()
        : (project.teamId && project.teamId !== '[object Object]' ? project.teamId : ''));
      if (t) teamsSet.add(t);
    }

    return {
      ongoing: ong,
      completed: comp,
      hold: hld,
      uniqueTeamsCount: teamsSet.size
    };
  }, [projects]);

  const summaryPills = React.useMemo(() => [
    { id: 'all', label: 'All Projects', value: projects.length, tone: 'text-navy dark:text-white' },
    { id: 'ongoing', label: 'Ongoing', value: ongoing.length, tone: 'text-blue-500 dark:text-blue-400' },
    { id: 'completed', label: 'Completed', value: completed.length, tone: 'text-emerald-500 dark:text-emerald-400' },
    { id: 'hold', label: 'On Hold', value: hold.length, tone: 'text-amber-500 dark:text-amber-400' },
    { id: 'teams', label: 'Total Teams', value: uniqueTeamsCount, tone: 'text-purple-500 dark:text-purple-400' }
  ], [projects.length, ongoing.length, completed.length, hold.length, uniqueTeamsCount]);

  const filteredProjects = React.useMemo(() => {
    return filterTab === 'ongoing'
      ? ongoing
      : filterTab === 'completed'
      ? completed
      : filterTab === 'hold'
      ? hold
      : filterTab === 'teams'
      ? projects.filter((p) => p.teamId || p.team)
      : projects;
  }, [filterTab, ongoing, completed, hold, projects]);

  const displayedProjects = React.useMemo(() => {
    return selectedProjectId === 'all'
      ? filteredProjects
      : filteredProjects.filter((p) => p.id === selectedProjectId);
  }, [filteredProjects, selectedProjectId]);

  const filterLabel = filterTab === 'ongoing' ? 'Ongoing ' : filterTab === 'completed' ? 'Completed ' : filterTab === 'hold' ? 'On Hold ' : filterTab === 'teams' ? 'Team ' : '';

  return (
    <>
      <PageHeader
        title="Projects Overview"
        subtitle="Company-wide project details, milestones, and administration"
      />

      <div className="flex-1 space-y-6 p-6">
        <Banner tone="grey" icon={<EyeIcon className="h-4 w-4" />}>
          Viewing and managing company-wide projects. Administrators have full system privileges to oversee and delete projects.
        </Banner>

        {/* SUMMARY STATS & FILTER CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <dl className="flex flex-wrap gap-2.5">
            {summaryPills.map((pill) => {
              const isActive = filterTab === pill.id;
              return (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    setFilterTab(pill.id);
                    setSelectedProjectId('all');
                  }}
                  className={`glass-pill rounded-2xl px-3.5 py-1.5 text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'glass-pill-active !text-white'
                      : ''
                  }`}
                >
                  <dt className={`font-semibold ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                    {pill.label}
                  </dt>
                  <dd className={`font-bold tabular-nums ${isActive ? '!text-white' : pill.tone}`}>
                    {pill.value}
                  </dd>
                </button>
              );
            })}
          </dl>

          {/* Dynamic Project Dropdown for the active filter */}
          {filteredProjects.length > 0 && (
            <div className="w-full sm:w-72">
              <Select
                size="sm"
                icon={<FolderKanbanIcon className="h-4 w-4 text-indigo-500" />}
                value={selectedProjectId}
                onChange={(val) => setSelectedProjectId(String(val))}
                options={[
                  {
                    value: 'all',
                    label: `All ${filterLabel}Projects (${filteredProjects.length})`
                  },
                  ...filteredProjects.map((p) => ({
                    value: p.id,
                    label: p.name,
                    badge: p.status === 'completed' ? 'Completed' : p.status === 'hold' ? 'On Hold' : 'Ongoing',
                    tone: p.status === 'completed' ? ('green' as const) : p.status === 'hold' ? ('yellow' as const) : ('blue' as const)
                  }))
                ]}
              />
            </div>
          )}
        </div>

        {/* RESPONSIVE PROJECT CARDS GRID */}
        {displayedProjects.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center shadow-glass space-y-3">
            <FolderKanbanIcon className="mx-auto h-10 w-10 text-slate-400" />
            <p className="text-sm font-bold text-navy dark:text-white">
              No {filterTab !== 'all' ? filterTab : ''} projects found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              There are currently no projects matching this status filter.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilterTab('all');
                setSelectedProjectId('all');
              }}
            >
              Show All Projects
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={refetch} />
            ))}
          </div>
        )}

        <Banner tone="grey" icon={<InfoIcon className="h-4 w-4" />}>
          Admin views all project status and has authorization to permanently delete and dissolve projects if required.
        </Banner>
      </div>
    </>
  );
}