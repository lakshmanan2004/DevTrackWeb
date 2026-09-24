import React from 'react';
import {
  FolderKanbanIcon,
  GitBranchIcon,
  UserIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useProjects } from '../../hooks/useLive';
import { useAuth } from '../../context/AuthContext';

export function MyProjects() {
  const { user } = useAuth();
  const { data } = useProjects('mine');
  const projects = data?.projects || [];

  return (
    <>
      <PageHeader
        title="My Projects"
        subtitle={`Projects assigned to ${user?.name || 'you'} (${user?.teamName || 'Team'})`}
      />

      <div className="flex-1 space-y-5 p-6">
        <Banner tone="blue" icon={<FolderKanbanIcon className="h-4 w-4" />}>
          Below are the projects you are actively involved in. All work logs, commits, and daily goals automatically link to your assigned project.
        </Banner>

        <div className="grid gap-6">
          {projects.map((proj: any) => (
            <article
              key={proj.id}
              className="rounded-card border border-hairline bg-white p-6 shadow-card space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-navy">{proj.name}</h2>
                    <Badge tone={proj.status === 'completed' ? 'green' : 'blue'}>
                      {proj.status.toUpperCase()}
                    </Badge>
                    <Badge tone={proj.health === 'Behind' ? 'red' : proj.health === 'Slightly Behind' ? 'yellow' : 'green'}>
                      {proj.health}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                    {proj.description || 'No project description provided.'}
                  </p>
                </div>

                {proj.repoUrl && (
                  <a
                    href={proj.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3.5 py-2 text-xs font-semibold text-brand hover:bg-gray-100 transition-colors"
                  >
                    <GitBranchIcon className="h-4 w-4 text-gray-500" />
                    <span>View Repository</span>
                    <ExternalLinkIcon className="h-3 w-3 text-gray-400" />
                  </a>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-canvas p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <UserIcon className="h-3.5 w-3.5 text-brand" />
                    <span>Project Manager</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-navy">{proj.manager || 'Unassigned'}</p>
                </div>

                <div className="rounded-xl bg-canvas p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <UsersIcon className="h-3.5 w-3.5 text-brand" />
                    <span>Team Lead</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-navy">{proj.leader || 'Unassigned'}</p>
                </div>

                <div className="rounded-xl bg-canvas p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <CalendarIcon className="h-3.5 w-3.5 text-brand" />
                    <span>Timeline</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-navy">
                    {proj.started} {proj.targetDate ? `➔ ${proj.targetDate}` : ''}
                  </p>
                </div>

                <div className="rounded-xl bg-canvas p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <UsersIcon className="h-3.5 w-3.5 text-brand" />
                    <span>Team ({proj.team || 'Team'})</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-navy">{proj.developers} Developers</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-500">Project Completion Progress</span>
                  <span className="text-brand font-bold">{proj.progress}%</span>
                </div>
                <ProgressBar value={proj.progress} tone={proj.progress >= 75 ? 'green' : 'blue'} label="Project completion" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-4 text-xs text-gray-500">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-green-700">
                    <CheckCircle2Icon className="h-4 w-4" />
                    {proj.tasksDone} tasks completed
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                    <AlertTriangleIcon className="h-4 w-4" />
                    {proj.blockers} active blockers
                  </span>
                </div>

                {proj.developerNames && proj.developerNames.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">Developers:</span>
                    <span className="text-gray-600">{proj.developerNames.join(', ')}</span>
                  </div>
                )}
              </div>
            </article>
          ))}

          {projects.length === 0 && (
            <div className="rounded-card border border-dashed border-gray-300 bg-white p-12 text-center">
              <FolderKanbanIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-semibold text-navy">No Projects Assigned Yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Ask your Project Manager or Admin to assign you to a project team.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
