import React, { useState } from 'react';
import { CloseProjectModal } from '../../components/project/CloseProjectModal';
import { Link } from 'react-router-dom';
import {
  BarChart3Icon,
  CalendarIcon,
  PlusIcon,
  TrophyIcon,
  UserCogIcon,
  UsersIcon } from
'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useProjects } from '../../hooks/useLive';
import { useAuth } from '../../context/AuthContext';

const healthTone = {
  'On Track': 'green',
  'Slightly Behind': 'yellow',
  Behind: 'red',
  'Delivered on time': 'green'
} as const;

export function MyProjects() {
  const { user } = useAuth();
  const { data, refetch } = useProjects('mine');
  const myProjects = data?.projects || [];
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedProjectForClose, setSelectedProjectForClose] = useState<any>(null);

  const summary = [
  { label: 'Total', value: myProjects.length, tone: 'text-navy' },
  { label: 'Ongoing', value: myProjects.filter((p: any) => p.status === 'ongoing').length, tone: 'text-brand' },
  { label: 'Completed', value: myProjects.filter((p: any) => p.status === 'completed').length, tone: 'text-green-600' },
  { label: 'Teams', value: new Set(myProjects.map((p: any) => p.teamId)).size, tone: 'text-pm' }];


  return (
    <>
      <PageHeader
        title="My Projects"
        subtitle={`${user?.name} · Project Manager`}
        actions={
        <Link to="/manager/create">
            <Button icon={<PlusIcon className="h-4 w-4" />}>Create New Project</Button>
          </Link>
        } />


      <div className="flex-1 space-y-5 p-6">
        <dl className="flex flex-wrap gap-3">
          {summary.map((item) =>
          <div
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 shadow-card">
              <dt className="text-xs font-semibold text-gray-500">{item.label}</dt>
              <dd className={`text-sm font-bold tabular-nums ${item.tone}`}>{item.value}</dd>
            </div>
          )}
        </dl>

        {myProjects.length === 0 && (
          <div className="rounded-card border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm font-semibold text-navy">No projects yet</p>
            <p className="mt-1 text-sm text-gray-500">Create your first project and team from the Create Project page.</p>
          </div>
        )}

        <ul className="space-y-4">
          {myProjects.map((project: any) => {
            const completed = project.status === 'completed';
            return (
              <li
                key={project.id}
                className={`rounded-card border border-hairline border-l-4 bg-white p-5 shadow-card ${
                completed ? 'border-l-ok bg-gray-50' : 'border-l-brand-light'}`
                }>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-base font-bold text-navy">{project.name}</h2>
                      <Badge tone={completed ? 'green' : 'blue'} dot>
                        {completed ? 'Completed' : project.status === 'hold' ? 'On Hold' : 'Ongoing'}
                      </Badge>
                    </div>
                    <dl className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-600">
                      <div className="inline-flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                        <dt className="sr-only">Duration</dt>
                        <dd>
                          {project.started}
                          {project.ended ? ` – ${project.ended}` : project.targetDate ? ` → target ${project.targetDate}` : ''}
                        </dd>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <UserCogIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                        <dt className="sr-only">Team Leader</dt>
                        <dd>{project.leader}</dd>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <UsersIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                        <dt className="sr-only">Team</dt>
                        <dd>
                          {project.team} · {project.developers} developers
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedProjectForClose(project);
                        setCloseModalOpen(true);
                      }}
                    >
                      {completed ? 'Status / Reopen' : 'Close Project'}
                    </Button>
                    <Link to="/manager/overview">
                      <Button size="sm" icon={<BarChart3Icon className="h-3.5 w-3.5" />}>
                        {completed ? 'View Report' : 'View Progress'}
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                    <span>{project.progress}% complete</span>
                    {completed ?
                    <span className="inline-flex items-center gap-1.5 text-green-600">
                        <TrophyIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        Delivered on time
                      </span> :

                    <Badge tone={healthTone[project.health as keyof typeof healthTone]} dot>
                        {project.health}
                      </Badge>
                    }
                  </div>
                  <div className="mt-2">
                    <ProgressBar
                      value={project.progress}
                      tone={completed ? 'green' : 'blue'}
                      height="md"
                      label={`${project.name} progress`} />
                  </div>
                </div>

                {!completed &&
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-hairline pt-4 sm:grid-cols-4">
                    {[
                  { label: 'Tasks Done', value: project.tasksDone, tone: 'text-navy' },
                  { label: 'Blockers This Week', value: project.blockers, tone: 'text-danger' },
                  { label: 'Active Devs', value: project.activeDevs, tone: 'text-green-600' },
                  { label: 'In Progress', value: project.inProgress, tone: 'text-brand' }].
                  map((stat) =>
                  <div key={stat.label}>
                        <dd className={`text-xl font-bold tabular-nums ${stat.tone}`}>{stat.value}</dd>
                        <dt className="mt-0.5 text-xs text-gray-500">{stat.label}</dt>
                      </div>
                  )}
                  </dl>
                }
              </li>);
          })}
        </ul>
        <CloseProjectModal
          open={closeModalOpen}
          project={selectedProjectForClose}
          onClose={() => setCloseModalOpen(false)}
          onSuccess={refetch}
        />
      </div>
    </>);

}
