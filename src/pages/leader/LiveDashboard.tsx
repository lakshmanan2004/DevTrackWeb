import React, { useState } from 'react';
import { BellIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
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
        subtitle={activeProject ? `${activeProject.name} · ${user?.teamName || 'Team'}` : (user?.teamName || 'Team')}
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

        <ProjectModulesSection
          project={activeProject}
          allProjects={leaderProjects}
          onSelectProject={(id) => setSelectedProjectId(id)}
          developers={developers}
          canUpdate={true}
          onModuleUpdated={() => {
            refetchProjects();
            refetch();
          }}
        />

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
