import React, { useState } from 'react';
import { BellIcon, InfoIcon, LayersIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { DeveloperCard } from '../../components/leader/DeveloperCard';
import { DeveloperDetailPanel } from '../../components/leader/DeveloperDetailPanel';
import { ProjectModulesSection } from '../../components/project/ProjectModulesSection';
import { useDevelopers, useDeveloperDetail, useAlerts, useProjects } from '../../hooks/useLive';
import { useAuth } from '../../context/AuthContext';
import { useSocketConnected } from '../../api/socket';

export function LiveDashboard() {
  const { user } = useAuth();
  const { data, refetch } = useDevelopers();
  const { data: alertData } = useAlerts();
  const { data: projData, refetch: refetchProjects } = useProjects('mine');
  const leaderProjects = projData?.projects || [];
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const activeProject = selectedProjectId ? leaderProjects.find((p: any) => p.id === selectedProjectId) : null;

  const developers = data?.developers || [];
  const unreadAlerts = (alertData?.alerts || []).filter((a: any) => a.unread).length;
  const logsToday = developers.reduce((s: number, d: any) => s + d.logs, 0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'on-track' | 'missed' | 'commits'>('all');
  const { data: detail, refetch: refetchDetail } = useDeveloperDetail(selectedId);
  const selected = developers.find((dev) => dev.id === selectedId) ?? null;

  const visible = developers.filter((dev: any) => {
    if (filter === 'all') return true;
    if (filter === 'on-track') return dev.missed === 0;
    if (filter === 'missed') return dev.missed > 0;
    if (filter === 'commits') return dev.commits > 0;
    return true;
  });

  // auto-select first developer initially
  if (!selectedId && visible.length > 0) setSelectedId(visible[0].id);

  const pills = [
    { id: 'all', label: 'All Developers', value: developers.length, tone: 'text-navy' },
    { id: 'on-track', label: 'On Track', value: developers.filter((d: any) => d.missed === 0).length, tone: 'text-green-600' },
    { id: 'missed', label: 'Missed Logs', value: developers.filter((d: any) => d.missed > 0).length, tone: 'text-danger' },
    { id: 'commits', label: 'Commits Today', value: developers.filter((d: any) => d.commits > 0).length, tone: 'text-navy' },
    { label: 'Alerts', value: unreadAlerts, tone: 'text-danger' },
    { label: 'Logs Today', value: logsToday, tone: 'text-navy' },
  ];

  const connected = useSocketConnected();

  return (
    <>
      <PageHeader
        title="Live Dashboard"
        subtitle={activeProject ? `${activeProject.name} · ${user?.teamName || 'Team'}` : `Select Project · ${user?.teamName || 'Team'}`}
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-danger-soft px-3 py-1.5 text-xs font-bold text-danger">
              <span className={`dt-live h-1.5 w-1.5 rounded-full bg-danger ${connected ? '' : 'bg-gray-400'}`} aria-hidden="true" />
              {connected ? 'LIVE' : 'CONNECTING…'}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-white">
              <BellIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
              {unreadAlerts > 0 && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unreadAlerts}
                </span>
              )}
              <span className="sr-only">{unreadAlerts} unread alerts</span>
            </span>
          </>
        } />


      <div className="flex-1 space-y-5 p-6">
        <Banner tone="blue" icon={<InfoIcon className="h-4 w-4" />}>
          {activeProject
            ? `You are viewing ${user?.teamName} assigned to ${activeProject.name}. Updates stream in real time.`
            : `You are viewing ${user?.teamName}. Select a project below to inspect delivery progress and developer submissions by module.`}
        </Banner>

        {/* HIGHLIGHTED PROJECT SELECTION PROMPT IF NO PROJECT SELECTED */}
        {!activeProject ? (
          <div className="rounded-2xl border-2 border-brand/40 bg-gradient-to-br from-white via-brand-soft/20 to-brand-soft/40 p-6 shadow-card space-y-5 animate-in fade-in">
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
                    No project selected by default. Pick a project assigned to {user?.teamName || 'your team'} below to inspect developer submissions by module.
                  </p>
                </div>
              </div>

              {leaderProjects.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border-2 border-brand bg-white px-3.5 py-2 shadow-sm ring-4 ring-brand/10">
                  <label htmlFor="lead-select-proj-main" className="text-xs font-extrabold text-navy whitespace-nowrap flex items-center gap-1.5">
                    <LayersIcon className="h-4 w-4 text-brand" />
                    Select Project:
                  </label>
                  <select
                    id="lead-select-proj-main"
                    value=""
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-transparent text-xs font-extrabold text-brand focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>— Click to Select a Project ({leaderProjects.length}) —</option>
                    {leaderProjects.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.team || user?.teamName}) — {p.modules?.length || 0} Modules
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {leaderProjects.length > 0 ? (
              <div>
                <p className="text-xs font-bold text-navy uppercase tracking-wider mb-3">
                  Available Projects ({leaderProjects.length}):
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {leaderProjects.map((p: any) => {
                    const completedWeight = (p.modules || [])
                      .filter((m: any) => m.status === 'completed')
                      .reduce((sum: number, m: any) => sum + (m.weightPercentage || 0), 0);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProjectId(p.id)}
                        className="flex flex-col text-left justify-between rounded-xl border border-brand/30 bg-white p-4 shadow-sm hover:border-brand hover:shadow-md hover:ring-2 hover:ring-brand/30 transition-all group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-navy group-hover:text-brand transition-colors">
                              {p.name}
                            </h3>
                            <span className="text-[11px] font-extrabold text-brand bg-brand-soft px-2 py-0.5 rounded-full">
                              {completedWeight}% Done
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {p.description || 'Assigned team project'}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-[11px] font-semibold text-gray-600">
                          <span>{p.modules?.length || 0} Modules</span>
                          <span className="text-brand font-bold group-hover:underline">Open & Inspect →</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No projects found for your team.</p>
            )}
          </div>
        ) : (
          <ProjectModulesSection
            project={activeProject}
            allProjects={leaderProjects}
            onSelectProject={(id) => setSelectedProjectId(id)}
            canUpdate={true}
            onModuleUpdated={() => {
              refetchProjects();
              refetch();
            }}
          />
        )}

        <dl className="flex flex-wrap gap-3">
          {pills.map((pill) => (
            <div
              key={pill.label}
              onClick={() => 'id' in pill ? setFilter(pill.id as typeof filter) : undefined}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-card transition-colors cursor-pointer ${'id' in pill && filter === pill.id ? 'border-brand bg-brand text-white' : 'border-hairline bg-white'}`}>
              <dt className={`text-xs font-semibold ${'id' in pill && filter === pill.id ? 'text-white' : 'text-gray-500'}`}>{pill.label}</dt>
              <dd className={`text-sm font-bold tabular-nums ${'id' in pill && filter === pill.id ? 'text-white' : pill.tone}`}>{pill.value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <span className="h-2 w-2 rounded-full bg-ok" aria-hidden="true" />
              {user?.teamName || 'Team'} — {visible.length} developer{visible.length !== 1 ? 's' : ''}
            </h2>
            <ul className="space-y-3">
              {visible.map((dev: any) => (
                <DeveloperCard
                  key={dev.id}
                  developer={dev}
                  selected={dev.id === selectedId}
                  onSelect={setSelectedId} />
              ))}
              {visible.length === 0 && (
                <li className="rounded-card border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                  No developers match this filter.
                </li>
              )}
            </ul>
          </div>

          <div>
            {selected ?
            <DeveloperDetailPanel
              developer={selected}
              detail={detail}
              onClose={() => setSelectedId(null)}
              onChanged={() => {
                refetch();
                refetchDetail();
              }} /> :

            <div className="rounded-card border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <p className="text-sm font-semibold text-navy">No developer selected</p>
                <p className="mt-1 text-sm text-gray-500">
                  Pick anyone from your team to inspect their session, logs and commits.
                </p>
              </div>
            }
          </div>
        </div>
      </div>
    </>);
}
