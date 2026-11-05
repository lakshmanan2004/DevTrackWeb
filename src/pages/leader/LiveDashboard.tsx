import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BellIcon, SparklesIcon, RadioIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { DeveloperCard } from '../../components/leader/DeveloperCard';
import { DeveloperDetailPanel } from '../../components/leader/DeveloperDetailPanel';
import { ProjectModulesSection } from '../../components/project/ProjectModulesSection';
import { AiExecutiveDigestModal } from '../../components/common/AiExecutiveDigestModal';
import { useDevelopers, useDeveloperDetail, useAlerts, useProjects } from '../../hooks/useLive';
import { useAuth } from '../../context/AuthContext';
import { useSocketConnected, onSocketEvent } from '../../api/socket';

const CommandDeckRadar = lazy(() =>
  import('../../components/leader/CommandDeckRadar').then((m) => ({ default: m.CommandDeckRadar }))
);

export function LiveDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const devParam = searchParams.get('dev') || searchParams.get('developer');

  const { data, refetch } = useDevelopers();
  const { data: alertData } = useAlerts();
  const { data: projData, refetch: refetchProjects } = useProjects('mine');
  const leaderProjects = projData?.projects || [];
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const activeProject = selectedProjectId
    ? leaderProjects.find((p: any) => p.id === selectedProjectId)
    : null;

  const developers = data?.developers || [];
  const unreadAlerts = (alertData?.alerts || []).filter((a: any) => a.unread).length;
  const logsToday = developers.reduce((s: number, d: any) => s + d.logs, 0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'on-track' | 'missed' | 'commits'>('all');
  const [aiDigestOpen, setAiDigestOpen] = useState(false);
  const [showRadar, setShowRadar] = useState<boolean>(() => {
    const saved = localStorage.getItem('devtrack_leader_show_radar');
    return saved !== null ? saved === 'true' : true;
  });
  const [lastApprovedLogAt, setLastApprovedLogAt] = useState<number | undefined>(undefined);

  const toggleRadar = (val: boolean) => {
    setShowRadar(val);
    localStorage.setItem('devtrack_leader_show_radar', String(val));
  };

  const { data: detail, refetch: refetchDetail } = useDeveloperDetail(selectedId);
  const selected = developers.find((dev) => dev.id === selectedId) ?? null;

  // Listen to live socket approval events to trigger Mission Cleared radar animation
  useEffect(() => {
    const off = onSocketEvent('log:review', (payload: any) => {
      if (payload?.review === 'approved' || payload?.action === 'approve') {
        setLastApprovedLogAt(Date.now());
      }
    });
    return () => off();
  }, []);

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
    { id: 'all', label: 'All Developers', value: developers.length, tone: 'text-navy dark:text-white' },
    {
      id: 'on-track',
      label: 'On Track',
      value: developers.filter((d: any) => d.missed === 0).length,
      tone: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'missed',
      label: 'Missed Logs',
      value: developers.filter((d: any) => d.missed > 0).length,
      tone: 'text-rose-600 dark:text-rose-400'
    },
    {
      id: 'commits',
      label: 'Commits Today',
      value: developers.filter((d: any) => d.commits > 0).length,
      tone: 'text-navy dark:text-white'
    },
    { label: 'Alerts', value: unreadAlerts, tone: 'text-rose-600 dark:text-rose-400' },
    { label: 'Logs Today', value: logsToday, tone: 'text-navy dark:text-white' }
  ];

  const connected = useSocketConnected();

  return (
    <>
      <PageHeader
        title="Live Dashboard"
        subtitle="Real-time developer attendance, orbital radar telemetry, and active work monitoring"
        actions={
          <>
            {/* View Mode Toggle: Radar Deck vs Developer Cards */}
            <div className="flex items-center gap-1 rounded-2xl p-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300/70 dark:border-white/15 shadow-sm">
              <button
                type="button"
                onClick={() => toggleRadar(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  showRadar
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Orbital Command Deck Radar view"
              >
                <RadioIcon className="h-3.5 w-3.5" />
                <span>Radar Deck</span>
              </button>
              <button
                type="button"
                onClick={() => toggleRadar(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !showRadar
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Hide Radar and view Developer Cards only"
              >
                <UsersIcon className="h-3.5 w-3.5" />
                <span>Developer Cards</span>
              </button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAiDigestOpen(true)}
              className="!bg-gradient-to-r !from-indigo-600/10 !to-purple-600/10 hover:!from-indigo-600/20 hover:!to-purple-600/20 !border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold"
              icon={<SparklesIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
            >
              AI Executive Digest
            </Button>
            <span className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-danger-soft px-3 py-1.5 text-xs font-bold text-danger">
              <span
                className={`dt-live h-1.5 w-1.5 rounded-full bg-danger ${connected ? '' : 'bg-gray-400'}`}
                aria-hidden="true"
              />
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
        }
      />

      <div className="flex-1 space-y-5 p-6">
        {/* COMMAND DECK RADAR (LAZY-LOADED) */}
        {showRadar && (
          <Suspense
            fallback={
              <div className="glass-card rounded-3xl p-16 text-center shadow-glass flex flex-col items-center justify-center min-h-[380px]">
                <div className="h-8 w-8 rounded-full border-2 border-brand/30 border-t-brand animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-500">Calibrating Command Deck Radar...</p>
              </div>
            }
          >
            <CommandDeckRadar
              developers={developers}
              selectedDeveloperId={selectedId}
              onSelectDeveloper={(id) => {
                setSelectedId(id);
              }}
              lastApprovedLogAt={lastApprovedLogAt}
            />
          </Suspense>
        )}

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
          {pills.map((pill) => {
            const isClickable = 'id' in pill;
            const isSelected = isClickable && filter === pill.id;
            return (
              <div
                key={pill.label}
                onClick={() => (isClickable ? setFilter(pill.id as typeof filter) : undefined)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                className={`glass-pill rounded-2xl px-4 py-2 ${
                  isClickable ? 'cursor-pointer' : '!cursor-default'
                } ${isSelected ? 'glass-pill-active !text-white' : ''}`}
              >
                <dt
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {pill.label}
                </dt>
                <dd className={`text-sm font-bold tabular-nums ${isSelected ? 'text-white' : pill.tone}`}>
                  {pill.value}
                </dd>
              </div>
            );
          })}
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

            <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-2 space-y-3 custom-scrollbar">
              <ul className="space-y-3 p-0.5">
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

          <div id="developer-detail-panel" className="sticky top-20">
            {selected ? (
              <DeveloperDetailPanel
                developer={selected}
                detail={detail}
                onClose={() => setSelectedId(null)}
                onChanged={() => {
                  setLastApprovedLogAt(Date.now());
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

      <AiExecutiveDigestModal
        open={aiDigestOpen}
        onClose={() => setAiDigestOpen(false)}
        defaultProjectId={selectedProjectId || ''}
      />
    </>
  );
}
