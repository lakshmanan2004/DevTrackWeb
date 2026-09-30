import React from 'react';
import { EyeIcon, InfoIcon, CalendarIcon, UsersIcon, UserCheckIcon, TargetIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useProjects } from '../../hooks/useLive';
import { Project } from '../../types';
import { api } from '../../api/client';

const statusMeta = {
  ongoing: { label: 'Ongoing', tone: 'blue', dot: 'bg-brand' },
  completed: { label: 'Completed', tone: 'green', dot: 'bg-ok' },
  hold: { label: 'On Hold', tone: 'yellow', dot: 'bg-warn' }
} as const;

function ProjectCard({ project, onDelete }: { project: Project; onDelete?: () => void }) {
  const meta = statusMeta[project.status];

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete project "${project.name}"?\n\nThis will dissolve the team and free up all assigned developers.`)) {
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
    <li className="p-5 transition-colors hover:bg-slate-50/50">
      <div className="flex flex-col gap-4">
        {/* Header: Title, Status & Health */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
              <h3 className="text-base font-bold text-navy">{project.name}</h3>
              <Badge tone={meta.tone} dot className="shrink-0">
                {meta.label}
              </Badge>
              <Badge 
                tone={project.health === 'On Track' || project.health === 'Delivered on time' ? 'green' : project.health === 'Slightly Behind' ? 'yellow' : 'red'} 
                className="shrink-0 text-[11px]"
              >
                {project.health}
              </Badge>
            </div>
            {project.description && (
              <p className="text-xs text-gray-600 max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Progress Indicator & Delete Action */}
          <div className="flex items-center gap-3">
            <div className="w-full sm:w-48 shrink-0 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-navy">
                <span>Progress</span>
                <span className="tabular-nums font-bold">{project.progress}%</span>
              </div>
              <ProgressBar
                value={project.progress}
                tone={project.status === 'completed' ? 'green' : project.status === 'hold' ? 'yellow' : 'blue'}
                label={`${project.name} progress`}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 shrink-0"
              title="Delete Project (Admin)"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-hairline bg-slate-50/60 p-3.5 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {/* Team Leader & Manager */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-gray-500">
              <UserCheckIcon className="h-3.5 w-3.5 text-brand" />
              <span>Leadership</span>
            </div>
            <div className="text-navy">
              <p className="font-semibold">TL: <span className="font-bold">{project.leader}</span></p>
              <p className="text-gray-500 text-[11px]">PM: {project.manager} ({project.team})</p>
            </div>
          </div>

          {/* Assigned Developers */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-1">
            <div className="flex items-center gap-1.5 font-semibold text-gray-500">
              <UsersIcon className="h-3.5 w-3.5 text-purple-600" />
              <span>Developers ({project.developers})</span>
            </div>
            <p className="font-medium text-navy line-clamp-2 leading-tight">
              {project.developerNames ? project.developerNames.join(', ') : `${project.developers} members assigned`}
            </p>
          </div>

          {/* Started Date */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-gray-500">
              <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>Started Date</span>
            </div>
            <p className="font-bold text-navy">{project.started}</p>
          </div>

          {/* Target / Completion Date */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-gray-500">
              <TargetIcon className="h-3.5 w-3.5 text-emerald-600" />
              <span>{project.ended ? 'Completed Date' : 'Target Date'}</span>
            </div>
            <p className="font-bold text-navy">
              {project.ended ? project.ended : project.targetDate || 'TBD'}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

export function ProjectsOverview() {
  const { data, refetch } = useProjects('all');
  const projects = (data?.projects || []) as unknown as Project[];
  const ongoing = projects.filter((project) => project.status === 'ongoing');
  const completed = projects.filter((project) => project.status === 'completed');
  const hold = projects.filter((project) => project.status === 'hold');

  const pills = [
    { label: 'Ongoing', value: ongoing.length, tone: 'text-brand' },
    { label: 'Completed', value: completed.length, tone: 'text-green-600' },
    { label: 'On Hold', value: hold.length, tone: 'text-amber-600' },
    { label: 'Total Teams', value: new Set(projects.map((p) => p.teamId)).size, tone: 'text-navy' }
  ];

  return (
    <>
      <PageHeader title="Projects Overview" subtitle="Company-wide project details and management" />

      <div className="flex-1 space-y-5 p-6">
        <Banner tone="grey" icon={<EyeIcon className="h-4 w-4" />}>
          Viewing and managing company-wide projects. Administrators have full system privileges to oversee and delete projects.
        </Banner>

        <dl className="flex flex-wrap gap-3">
          {pills.map((pill) => (
            <div
              key={pill.label}
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 shadow-card"
            >
              <dt className="text-xs font-semibold text-gray-500">{pill.label}</dt>
              <dd className={`text-sm font-bold tabular-nums ${pill.tone}`}>{pill.value}</dd>
            </div>
          ))}
        </dl>

        <section className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
          <h2 className="border-b border-hairline px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
            Ongoing Projects ({ongoing.length})
          </h2>
          <ul className="divide-y divide-gray-100">
            {ongoing.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={refetch} />
            ))}
          </ul>
        </section>

        <section className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
          <h2 className="border-b border-hairline px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
            Completed Projects ({completed.length})
          </h2>
          <ul className="divide-y divide-gray-100">
            {completed.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={refetch} />
            ))}
          </ul>
        </section>

        <section className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
          <h2 className="border-b border-hairline px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
            On Hold ({hold.length})
          </h2>
          <ul className="divide-y divide-gray-100">
            {hold.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={refetch} />
            ))}
          </ul>
        </section>

        <Banner tone="grey" icon={<InfoIcon className="h-4 w-4" />}>
          Admin views all project status and has authorization to permanently delete and dissolve projects if required.
        </Banner>
      </div>
    </>
  );
}