import React, { useState, Suspense, lazy } from 'react';
import { CloseProjectModal } from '../../components/project/CloseProjectModal';
import { Link } from 'react-router-dom';
import {
  BarChart3Icon,
  CalendarIcon,
  PlusIcon,
  TrophyIcon,
  UserCogIcon,
  UsersIcon,
  Trash2Icon,
  FolderKanbanIcon,
  DownloadIcon,
  OrbitIcon,
  ListIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Select } from '../../components/ui/Select';
import { ExportTimesheetModal } from '../../components/common/ExportTimesheetModal';
import { useProjects } from '../../hooks/useLive';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

const GalaxyMap = lazy(() =>
  import('../../components/manager/GalaxyMap').then((m) => ({ default: m.GalaxyMap }))
);

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
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedProjectForClose, setSelectedProjectForClose] = useState<any>(null);

  const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed' | 'teams'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'galaxy' | 'list'>(() => {
    const saved = localStorage.getItem('devtrack_manager_projects_view');
    return saved === 'list' || saved === 'galaxy' ? saved : 'galaxy';
  });

  const handleSetViewMode = (mode: 'galaxy' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('devtrack_manager_projects_view', mode);
  };

  const handleDeleteProject = async (project: any) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete project "${project.name}"?\n\nThis will dissolve the team and free up developers.`
      )
    ) {
      return;
    }
    try {
      await api(`/api/projects/${project.id}`, { method: 'DELETE' });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const ongoingCount = myProjects.filter(
    (p: any) => p.status === 'ongoing' || (p.status !== 'completed' && p.status !== 'hold')
  ).length;
  const completedCount = myProjects.filter((p: any) => p.status === 'completed').length;
  const teamProjectsCount = new Set(
    myProjects
      .map((p: any) =>
        p.team && typeof p.team === 'string' && p.team.trim()
          ? p.team.trim()
          : p.teamId && p.teamId !== '[object Object]'
          ? p.teamId
          : ''
      )
      .filter(Boolean)
  ).size;

  const summary = [
    { id: 'all' as const, label: 'Total', value: myProjects.length, tone: 'text-navy dark:text-white' },
    { id: 'ongoing' as const, label: 'Ongoing', value: ongoingCount, tone: 'text-brand dark:text-indigo-400' },
    { id: 'completed' as const, label: 'Completed', value: completedCount, tone: 'text-emerald-500 dark:text-emerald-400' },
    { id: 'teams' as const, label: 'Teams', value: teamProjectsCount, tone: 'text-violet-500 dark:text-violet-400' }
  ];

  const filteredProjects = myProjects.filter((project: any) => {
    if (filter === 'ongoing') {
      return project.status === 'ongoing' || (project.status !== 'completed' && project.status !== 'hold');
    }
    if (filter === 'completed') {
      return project.status === 'completed';
    }
    if (filter === 'teams') {
      return Boolean(project.team || project.teamId);
    }
    return true;
  });

  const displayedProjects =
    selectedProjectId === 'all'
      ? filteredProjects
      : filteredProjects.filter((p: any) => p.id === selectedProjectId);

  const filterLabel =
    filter === 'ongoing' ? 'Ongoing ' : filter === 'completed' ? 'Completed ' : filter === 'teams' ? 'Team ' : '';

  return (
    <>
      <PageHeader
        title="My Projects"
        subtitle={`${user?.name} · Project Manager`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExportModalOpen(true)}
              icon={<DownloadIcon className="h-4 w-4 text-blue-600 dark:text-sky-400" />}
            >
              Export Timesheet
            </Button>
            <Link to="/manager/create">
              <Button
                icon={<PlusIcon className="h-4 w-4" />}
                className="btn-glass-primary !from-indigo-600 !to-violet-600 text-white font-bold border-none"
              >
                Create New Project
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <dl className="flex flex-wrap gap-3">
            {summary.map((item) => {
              const isActive = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setFilter(item.id);
                    setSelectedProjectId('all');
                  }}
                  className={`glass-pill rounded-2xl px-4 py-2 text-left cursor-pointer ${
                    isActive ? 'glass-pill-active !text-white' : ''
                  }`}
                >
                  <dt
                    className={`text-xs font-semibold ${
                      isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </dt>
                  <dd className={`text-sm font-bold tabular-nums ${isActive ? '!text-white' : item.tone}`}>
                    {item.value}
                  </dd>
                </button>
              );
            })}
          </dl>

          {/* Right Controls: View Toggle (Galaxy Map vs List) + Project Select */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-2xl p-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300/70 dark:border-white/15 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setSelectedProjectId('all');
                  handleSetViewMode('galaxy');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'galaxy'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-pressed={viewMode === 'galaxy'}
                title="Interactive SVG Galaxy Map"
              >
                <OrbitIcon className="h-3.5 w-3.5" />
                <span>Galaxy Map</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-pressed={viewMode === 'list'}
                title="Accessible standard list view"
              >
                <ListIcon className="h-3.5 w-3.5" />
                <span>List View</span>
              </button>
            </div>

            {/* Dynamic Project Dropdown for active filter */}
            {filteredProjects.length > 0 && (
              <div className="w-full sm:w-64">
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
                    ...filteredProjects.map((p: any) => ({
                      value: p.id,
                      label: p.name,
                      badge: p.status === 'completed' ? 'Completed' : 'Ongoing',
                      tone: p.status === 'completed' ? ('green' as const) : ('blue' as const)
                    }))
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {myProjects.length === 0 && (
          <div className="glass-card rounded-3xl p-12 text-center shadow-glass">
            <p className="text-sm font-semibold text-navy dark:text-white">No projects yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create your first project and team from the Create Project page.
            </p>
          </div>
        )}

        {myProjects.length > 0 && displayedProjects.length === 0 && (
          <div className="glass-card rounded-3xl p-10 text-center shadow-glass space-y-3">
            <p className="text-sm font-bold text-navy dark:text-white">
              No{' '}
              {filter === 'ongoing'
                ? 'ongoing'
                : filter === 'completed'
                ? 'completed'
                : filter === 'teams'
                ? 'team'
                : ''}{' '}
              projects found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              There are currently no projects matching this filter criteria.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilter('all');
                setSelectedProjectId('all');
              }}
            >
              Show All Projects
            </Button>
          </div>
        )}

        {/* GALAXY MAP VIEW */}
        {filteredProjects.length > 0 && viewMode === 'galaxy' && (
          <Suspense
            fallback={
              <div className="glass-card rounded-3xl p-16 text-center shadow-glass flex flex-col items-center justify-center min-h-[460px]">
                <div className="h-8 w-8 rounded-full border-2 border-brand/30 border-t-brand animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-500">Initializing Galaxy Map...</p>
              </div>
            }
          >
            <GalaxyMap
              projects={filteredProjects}
              onSelectProject={(project) => {
                setSelectedProjectId(project.id);
                handleSetViewMode('list');
              }}
              onCloseProjectModal={(p) => {
                setSelectedProjectForClose(p);
                setCloseModalOpen(true);
              }}
            />
          </Suspense>
        )}

        {/* STANDARD LIST VIEW (ACCESSIBLE FALLBACK) */}
        {displayedProjects.length > 0 && viewMode === 'list' && (
          <ul className="space-y-4">
            {displayedProjects.map((project: any) => {
              const completed = project.status === 'completed';
              return (
                <li
                  key={project.id}
                  className="glass-card project-container-card rounded-3xl p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          to={`/manager/overview?projectId=${project.id}`}
                          className="hover:underline"
                        >
                          <h2 className="text-base font-bold text-navy dark:text-white hover:text-brand transition-colors">
                            {project.name}
                          </h2>
                        </Link>
                        <Badge
                          tone={
                            completed
                              ? 'green'
                              : project.status === 'urgent'
                              ? 'red'
                              : project.status === 'hold'
                              ? 'amber'
                              : 'blue'
                          }
                          dot
                        >
                          {completed
                            ? 'Completed'
                            : project.status === 'urgent'
                            ? '🚨 Urgent Sprint'
                            : project.status === 'hold'
                            ? 'On Hold'
                            : 'Ongoing'}
                        </Badge>
                      </div>
                      <dl className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <div className="inline-flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          <dt className="sr-only">Duration</dt>
                          <dd>
                            {project.started}
                            {project.ended
                              ? ` – ${project.ended}`
                              : project.targetDate
                              ? ` → target ${project.targetDate}`
                              : ''}
                          </dd>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <UserCogIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          <dt className="sr-only">Team Leader</dt>
                          <dd>{project.leader}</dd>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <UsersIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
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
                      <Link to={`/manager/overview?projectId=${project.id}`}>
                        <Button size="sm" icon={<BarChart3Icon className="h-3.5 w-3.5" />}>
                          {completed ? 'View Report' : 'View Progress'}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProject(project)}
                        className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50"
                        title="Delete Project"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>{project.progress}% complete</span>
                      {completed ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
                          <TrophyIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          Delivered on time
                        </span>
                      ) : (
                        <Badge tone={healthTone[project.health as keyof typeof healthTone]} dot>
                          {project.health}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        value={project.progress}
                        tone={completed ? 'green' : 'blue'}
                        height="md"
                        label={`${project.name} progress`}
                      />
                    </div>
                  </div>

                  {!completed && (
                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-hairline pt-4 sm:grid-cols-4">
                      {[
                        { label: 'Tasks Done', value: project.tasksDone, tone: 'text-navy dark:text-white' },
                        { label: 'Blockers This Week', value: project.blockers, tone: 'text-rose-500 dark:text-rose-400' },
                        { label: 'Active Devs', value: project.activeDevs, tone: 'text-emerald-500 dark:text-emerald-400' },
                        { label: 'In Progress', value: project.inProgress, tone: 'text-brand dark:text-indigo-400' }
                      ].map((stat) => (
                        <div key={stat.label} className="glass-surface glass-hover-card rounded-2xl p-3">
                          <dd className={`text-xl font-bold tabular-nums ${stat.tone}`}>{stat.value}</dd>
                          <dt className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{stat.label}</dt>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <CloseProjectModal
          open={closeModalOpen}
          project={selectedProjectForClose}
          onClose={() => setCloseModalOpen(false)}
          onSuccess={refetch}
        />
        <ExportTimesheetModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
      </div>
    </>
  );
}
