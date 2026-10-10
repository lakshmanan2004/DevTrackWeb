import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const devParam = searchParams.get('dev') || searchParams.get('developer');

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

  useEffect(() => {
    if (devParam && developers.length > 0) {
      const match = developers.find(
        (d: any) =>
          d.id === devParam ||
          d.name?.toLowerCase() === devParam.toLowerCase() ||
          d.name?.toLowerCase().includes(devParam.toLowerCase())
      );
      if (match) {
        setSelectedId(match.id);
        setFilter('all');
      }
    }
  }, [devParam, developers]);

  const visible = developers.filter((dev: any) => {
    if (filter === 'all') return true;
    if (filter === 'on-track') return dev.missed === 0;
    if (filter === 'missed') return dev.missed > 0;
    if (filter === 'commits') return dev.commits > 0;
    return true;
  });

  // auto-select first developer initially if none selected
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
        subtitle="Real-time developer attendance, hourly check-in timeline, and active work monitoring"
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

        <dl className="flex flex-wrap gap-2.5">
          {pills.map((pill) => (
            <div
              key={pill.label}
              onClick={() => 'id' in pill ? setFilter(pill.id as typeof filter) : undefined}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 shadow-glass transition-all duration-200 cursor-pointer ${
                'id' in pill && filter === pill.id
                  ? 'btn-glass-primary !text-white border-transparent'
                  : 'border-white/80 bg-white/70 backdrop-blur-md hover:bg-white/90'
              }`}
            >
              <dt className={`text-xs font-semibold ${'id' in pill && filter === pill.id ? 'text-white' : 'text-slate-500'}`}>{pill.label}</dt>
              <dd className={`text-sm font-bold tabular-nums ${'id' in pill && filter === pill.id ? 'text-white' : pill.tone}`}>{pill.value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)] items-start">
          <section className="glass-card rounded-3xl p-5 sm:p-6 shadow-glass flex flex-col">
            <div className="flex items-center justify-between border-b border-hairline pb-3.5 mb-4">
              <div>
                <h2 className="text-sm font-bold text-navy dark:text-white">Team Developers</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time status & activity
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand dark:text-blue-300 border border-brand/20">
                {visible.length} {visible.length === 1 ? 'Developer' : 'Developers'}
              </span>
            </div>

            <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              <ul className="space-y-3">
                {visible.map((dev: any) => (
                  <DeveloperCard
                    key={dev.id}
                    developer={dev}
                    selected={dev.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
                {visible.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No developers match this filter.
                  </li>
                )}
              </ul>
            </div>
          </section>

          <div className="sticky top-20">
            {selected ? (
              <DeveloperDetailPanel
                developer={selected}
                detail={detail}
                onClose={() => setSelectedId(null)}
                onChanged={() => {
                  refetch();
                  refetchDetail();
                }}
              />
            ) : (
              <div className="glass-card rounded-3xl border border-dashed border-slate-300 dark:border-white/10 px-6 py-16 text-center shadow-glass">
                <p className="text-sm font-bold text-navy dark:text-white">No developer selected</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Pick anyone from your team to inspect their session, logs, and live timelines.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
