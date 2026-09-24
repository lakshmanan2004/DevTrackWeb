import React, { useState } from 'react';
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
import { useProjects, useProjectOverview } from '../../hooks/useLive';

const healthToneMap: Record<string, 'green' | 'yellow' | 'red' | 'blue'> = {
  'On Track': 'green',
  'Slightly Behind': 'yellow',
  Behind: 'red',
  'Delivered on time': 'blue'
};

const weekHealthToneMap = { Good: 'green', Slow: 'yellow', Behind: 'red' } as const;

export function ProjectOverview() {
  const { data } = useProjects('mine');
  const projects = data?.projects || [];
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const activeId = selectedProjectId || projects[0]?.id || '';
  const { data: overview } = useProjectOverview(activeId || null);

  const selectedProject = projects.find((p: any) => p.id === activeId);

  const donePercent = selectedProject?.progress ?? 0;
  const inProgressPercent = selectedProject ? Math.min(100 - donePercent, Math.round((selectedProject.inProgress / Math.max(1, selectedProject.tasksDone + selectedProject.inProgress)) * 100)) : 0;
  const todoPercent = Math.max(0, 100 - donePercent - inProgressPercent);

  const currentBlockers = overview?.blockers || [];
  const projectWeeks = overview?.weeks || [];

  return (
    <>
      <PageHeader
        title={selectedProject ? `${selectedProject.name} — Detailed Overview` : 'Project Overview'}
        subtitle={selectedProject
          ? `${selectedProject.team} · Led by ${selectedProject.leader} · Managed by ${selectedProject.manager} · Started ${selectedProject.started}`
          : 'Select a project'}
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-2 shadow-sm text-xs font-semibold text-navy">
              <FolderKanbanIcon className="h-4 w-4 text-brand" />
              <span className="text-gray-500">Select Project:</span>
              <select
                value={activeId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-bold text-navy focus:outline-none cursor-pointer"
              >
                {projects.map((proj: any) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.progress}% · {proj.health})
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <Banner tone="blue" icon={<InfoIcon className="h-4 w-4" />}>
          All metrics below are computed live from your teams' real work logs, tasks and blockers.
        </Banner>

        {selectedProject && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Overall Progress"
                value={`${selectedProject.progress}%`}
                hint={selectedProject.status === 'completed' ? 'Project Completed' : 'Computed from logged tasks'}
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

            <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-navy">
                    {selectedProject.name} — Progress Breakdown
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {selectedProject.team} · {selectedProject.developers} Developers · Led by {selectedProject.leader}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={healthToneMap[selectedProject.health] || 'blue'} dot>
                    {selectedProject.health}
                  </Badge>
                  <Badge tone={selectedProject.status === 'completed' ? 'green' : 'blue'}>
                    {selectedProject.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-gray-100">
                <span className="bg-ok transition-all duration-300" style={{ width: `${donePercent}%` }} aria-hidden="true" />
                <span className="bg-brand transition-all duration-300" style={{ width: `${inProgressPercent}%` }} aria-hidden="true" />
                <span className="bg-gray-300 transition-all duration-300" style={{ width: `${todoPercent}%` }} aria-hidden="true" />
              </div>

              <ul className="mt-3 flex flex-wrap gap-6 text-xs text-gray-600">
                <li className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-ok" aria-hidden="true" />
                  <span className="font-bold text-navy">{donePercent}%</span> Completed ({selectedProject.tasksDone} tasks)
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />
                  <span className="font-bold text-navy">{inProgressPercent}%</span> In Progress ({selectedProject.inProgress} active)
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-300" aria-hidden="true" />
                  <span className="font-bold text-navy">{todoPercent}%</span> Remaining
                </li>
              </ul>
            </section>
          </>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
            <div className="border-b border-hairline px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy">Weekly Delivery Breakdown</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hairline bg-canvas text-xs uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-5 py-3 font-semibold">Week</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Tasks closed</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Blockers</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectWeeks.map((week: any) => (
                  <tr key={week.label} className={week.health === 'Behind' ? 'bg-danger-soft' : ''}>
                    <td className="px-5 py-3.5 font-semibold text-navy">{week.label}</td>
                    <td className="px-3 py-3.5 tabular-nums text-gray-600">{week.tasks} tasks</td>
                    <td className="px-3 py-3.5 tabular-nums text-gray-600">
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
                    <td colSpan={4} className="px-5 py-6 text-center text-xs text-gray-500">
                      No weekly data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="h-fit rounded-card border border-hairline bg-white shadow-card">
            <h2 className="border-b border-hairline px-5 py-4 text-sm font-bold text-navy">
              Active Blockers — {currentBlockers.length}
            </h2>
            <ul className="divide-y divide-gray-100">
              {currentBlockers.length > 0 ? (
                currentBlockers.map((blocker: any) => (
                  <li key={blocker.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-navy">{blocker.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
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
                <li className="px-5 py-6 text-center text-xs text-gray-500">
                  No active blockers for this project.
                </li>
              )}
            </ul>
            <p className="border-t border-hairline bg-canvas px-5 py-3 text-xs text-gray-500">
              Contact Team Leader <span className="font-semibold text-navy">{selectedProject?.leader}</span> for resolution.
            </p>
          </section>
        </div>

        <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-navy">
                <BarChart3Icon className="h-5 w-5 text-brand" />
                All Managed Projects Overview ({projects.length})
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Click any project card below to instantly view its detailed progress metrics and breakdown.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj: any) => (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`group cursor-pointer rounded-xl border p-4 transition-all ${
                  activeId === proj.id
                    ? 'border-brand bg-brand-soft/30 ring-2 ring-brand/20 shadow-md'
                    : 'border-hairline bg-canvas hover:border-brand/50 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-navy group-hover:text-brand transition-colors">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {proj.team} · Lead: {proj.leader}
                    </p>
                  </div>
                  <Badge tone={healthToneMap[proj.health] || 'blue'} dot>
                    {proj.health}
                  </Badge>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-500">Overall Progress</span>
                    <span className="text-navy">{proj.progress}%</span>
                  </div>
                  <ProgressBar
                    value={proj.progress}
                    tone={proj.progress >= 70 ? 'green' : proj.progress >= 40 ? 'yellow' : 'red'}
                    label={`${proj.name} progress`}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-hairline/60 pt-3 text-xs text-gray-500">
                  <span>{proj.tasksDone} tasks done</span>
                  <span>{proj.blockers} blockers</span>
                  <span className="font-semibold text-brand group-hover:underline">View Details →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
