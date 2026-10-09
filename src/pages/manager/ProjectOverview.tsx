import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2Icon, TrophyIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CloseProjectModal } from '../../components/project/CloseProjectModal';
import {
  InfoIcon,
  FolderKanbanIcon,
  BarChart3Icon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Select } from '../../components/ui/Select';
import { ProjectModulesSection } from '../../components/project/ProjectModulesSection';
import { useProjects, useProjectOverview } from '../../hooks/useLive';

const healthToneMap: Record<string, 'green' | 'yellow' | 'red' | 'blue'> = {
  'On Track': 'green',
  'Slightly Behind': 'yellow',
  Behind: 'red',
  'Delivered on time': 'blue'
};

const weekHealthToneMap = { Good: 'green', Slow: 'yellow', Behind: 'red' } as const;

export function ProjectOverview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId') || '';
  const { data, refetch } = useProjects('mine');
  const projects = data?.projects || [];
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId);

  useEffect(() => {
    if (urlProjectId) {
      setSelectedProjectId(urlProjectId);
    } else if (!selectedProjectId && projects.length === 1) {
      setSelectedProjectId(projects[0].id);
    }
  }, [urlProjectId, projects, selectedProjectId]);

  const activeId = selectedProjectId || urlProjectId || (projects.length === 1 ? projects[0]?.id : '');
  const { data: overview, refetch: refetchOverview } = useProjectOverview(activeId || null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  const selectedProject = projects.find((p: any) => p.id === activeId);

  const handleSelectProject = (val: string) => {
    setSelectedProjectId(val);
    if (val) {
      setSearchParams({ projectId: val });
    } else {
      setSearchParams({});
    }
  };

  const modules = selectedProject?.modules || [];
  const donePercent = selectedProject?.progress ?? 0;
  const inProgressModuleWeight = modules
    .filter((m: any) => m.status === 'in_progress')
    .reduce((sum: number, m: any) => sum + (m.weightPercentage || 0), 0);

  const inProgressPercent = selectedProject
    ? selectedProject.status === 'completed'
      ? 0
      : inProgressModuleWeight > 0
        ? Math.min(100 - donePercent, inProgressModuleWeight)
        : selectedProject.inProgress > 0
          ? Math.min(100 - donePercent, Math.min(15, selectedProject.inProgress * 5))
          : 0
    : 0;

  const todoPercent = Math.max(0, 100 - donePercent - inProgressPercent);

  const currentBlockers = overview?.blockers || [];
  const projectWeeks = overview?.weeks || [];

  const handleModuleUpdated = () => {
    refetch();
    refetchOverview();
  };

  return (
    <>
      <PageHeader
        title={selectedProject ? `${selectedProject.name} — Detailed Overview` : 'Project Overview'}
        subtitle={selectedProject
          ? `${selectedProject.team} · Led by ${selectedProject.leader} · Managed by ${selectedProject.manager} · Started ${selectedProject.started}`
          : 'Select a project to inspect delivery metrics, module breakdown, and weekly progress'}
        actions={
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Select
                size="sm"
                fullWidth
                value={activeId}
                onChange={(val) => handleSelectProject(val)}
                placeholder="— Select a Project —"
                icon={<FolderKanbanIcon className="h-3.5 w-3.5" />}
                options={projects.map((proj: any) => ({
                  value: proj.id,
                  label: proj.name,
                  badge: `${proj.progress}% · ${proj.health}`
                }))}
                searchable
              />
            </div>

            {activeId && projects.length > 1 && (
              <button
                type="button"
                onClick={() => handleSelectProject('')}
                className="rounded-xl border border-hairline dark:border-white/10 bg-white/70 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                Clear
              </button>
            )}

            {selectedProject && (
              <Button
                size="sm"
                variant={selectedProject.status === 'completed' ? 'secondary' : 'primary'}
                className={selectedProject.status === 'completed' ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                onClick={() => setCloseModalOpen(true)}
                icon={selectedProject.status === 'completed' ? <TrophyIcon className="h-4 w-4 text-emerald-600" /> : <CheckCircle2Icon className="h-4 w-4" />}
              >
                {selectedProject.status === 'completed' ? 'Project Completed (Manage)' : 'Close Project'}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 p-6">
        <Banner tone="blue" icon={<InfoIcon className="h-4 w-4" />}>
          All project metrics and progress percentages are computed live from team leader completed modules.
        </Banner>

        {!selectedProject ? (
          <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-12 text-center shadow-glass space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-sky-400">
              <FolderKanbanIcon className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-navy dark:text-white">Select a Project to Inspect</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              Please select a project from the dropdown above or click any project card below to inspect its live milestone delivery, module breakdown, weekly progress, and blockers.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Overall Progress"
                value={`${selectedProject.progress}%`}
                hint={selectedProject.status === 'completed' ? 'Project Completed' : 'Computed from completed modules'}
                tone={selectedProject.progress >= 70 ? 'green' : selectedProject.progress >= 40 ? 'purple' : 'yellow'}
              />
              <StatCard
                label="Tasks Completed"
                value={String(selectedProject.tasksDone)}
                hint={`${selectedProject.inProgress} in progress · ${selectedProject.activeDevs} devs active`}
                tone="green"
              />
              <StatCard
                label="Blockers & Dependencies"
                value={String(selectedProject.blockers)}
                hint={selectedProject.blockers > 0 ? 'Requires attention' : 'No blockers'}
                tone={selectedProject.blockers > 0 ? 'red' : 'green'}
              />
              <StatCard
                label="Team & Developers"
                value={`${selectedProject.developers} Devs`}
                hint={`${selectedProject.team} · Lead: ${selectedProject.leader}`}
                tone="blue"
              />
            </div>

            {/* PROJECT MODULES & WEIGHTED DELIVERY TRACKER */}
            <ProjectModulesSection
              project={selectedProject}
              canUpdate={true}
              onModuleUpdated={handleModuleUpdated}
            />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-glass">
            <div className="border-b border-hairline dark:border-white/10 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy dark:text-white">Weekly Delivery Breakdown</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hairline dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/60 text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  <th scope="col" className="px-5 py-3 font-semibold">Week</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Tasks closed</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Blockers</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {projectWeeks.map((week: any) => (
                  <tr key={week.label} className={week.health === 'Behind' ? 'bg-danger-soft dark:bg-rose-950/30' : ''}>
                    <td className="px-5 py-3.5 font-semibold text-navy dark:text-white">{week.label}</td>
                    <td className="px-3 py-3.5 tabular-nums text-gray-600 dark:text-slate-300">{week.tasks} tasks</td>
                    <td className="px-3 py-3.5 tabular-nums text-gray-600 dark:text-slate-300">
                      {week.blockers} blocker{week.blockers === 1 ? '' : 's'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge tone={weekHealthToneMap[week.health as keyof typeof weekHealthToneMap]} dot>
                        {week.health}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {projectWeeks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-xs text-gray-500 dark:text-slate-400">
                      No weekly data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="h-fit overflow-hidden rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-glass">
            <h2 className="border-b border-hairline dark:border-white/10 px-5 py-4 text-sm font-bold text-navy dark:text-white">
              Active Blockers — {currentBlockers.length}
            </h2>
            <ul className="divide-y divide-gray-100 dark:divide-white/10">
              {currentBlockers.length > 0 ? (
                currentBlockers.map((blocker: any) => (
                  <li key={blocker.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-navy dark:text-white">{blocker.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                          {blocker.since} · {blocker.team}
                        </p>
                      </div>
                      <Badge tone={blocker.state === 'Unresolved' ? 'red' : 'yellow'} dot>
                        {blocker.state}
                      </Badge>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-5 py-6 text-center text-xs text-gray-500 dark:text-slate-400">
                  No active blockers for this project.
                </li>
              )}
            </ul>
            <p className="border-t border-hairline dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/60 px-5 py-3 text-xs text-gray-500 dark:text-slate-400">
              Contact Team Leader <span className="font-semibold text-navy dark:text-white">{selectedProject?.leader}</span> for resolution.
            </p>
          </section>
        </div>
        </>
      )}

      <CloseProjectModal
        open={closeModalOpen}
        project={selectedProject}
        onClose={() => setCloseModalOpen(false)}
        onSuccess={() => {
          refetch();
          refetchOverview();
        }}
      />
    </div>
  </>
);
}
