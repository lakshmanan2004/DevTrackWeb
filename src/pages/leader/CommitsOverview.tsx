import React, { useState } from 'react';
import {
  CalendarIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GitBranchIcon,
  RotateCcwIcon,
  UsersIcon,
  SearchIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/ui/StatCard';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Select } from '../../components/ui/Select';
import { useCommits, useDevelopers } from '../../hooks/useLive';
import { useAuth } from '../../context/AuthContext';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDate = (dateStr: string, days: number) => {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export function CommitsOverview() {
  const { user } = useAuth();
  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [devFilter, setDevFilter] = useState('');

  const isToday = selectedDate === todayStr;
  const yesterdayStr = shiftDate(todayStr, -1);
  const isYesterday = selectedDate === yesterdayStr;

  const { data } = useCommits(selectedDate);
  const { data: devData } = useDevelopers();
  const rawTeamCommits = data?.team || [];
  const developers = devData?.developers || [];

  const branches = new Set(rawTeamCommits.map((c: any) => c.branch));
  const byDev: Record<string, number> = {};
  for (const c of rawTeamCommits) byDev[c.dev] = (byDev[c.dev] || 0) + 1;
  const topCommitter = Object.entries(byDev).sort((a, b) => b[1] - a[1])[0];
  const zeroCommitDevs = developers.filter((d: any) => !byDev[d.name]);

  const teamCommits = rawTeamCommits.filter((c: any) => {
    if (devFilter && c.dev !== devFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = String(c.message || '').toLowerCase().includes(q);
      const matchSha = String(c.sha || '').toLowerCase().includes(q);
      const matchDev = String(c.dev || '').toLowerCase().includes(q);
      const matchBranch = String(c.branch || '').toLowerCase().includes(q);
      if (!matchMsg && !matchSha && !matchDev && !matchBranch) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="Commits Overview"
        subtitle="Track code commits, repository branch activity, and developer contributions by date"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick date pill buttons */}
            <div className="glass-surface flex items-center gap-1 rounded-2xl p-1 shadow-glass">
              <button
                type="button"
                onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                className="rounded-xl p-1.5 text-navy dark:text-white hover:bg-slate-500/10 transition-colors"
                title="Previous day"
                aria-label="Previous day"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <SegmentedControl
                size="sm"
                options={[
                  { id: todayStr, label: 'Today' },
                  { id: yesterdayStr, label: 'Yesterday' }
                ]}
                value={selectedDate === todayStr ? todayStr : selectedDate === yesterdayStr ? yesterdayStr : ''}
                onChange={(val) => {
                  if (val) setSelectedDate(val);
                }}
              />

              <div className="h-4 w-px bg-slate-400/20 mx-0.5" />

              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-navy dark:text-white cursor-pointer hover:bg-slate-500/10 rounded-xl transition-colors">
                <CalendarIcon className="h-3.5 w-3.5 text-brand dark:text-indigo-400" aria-hidden="true" />
                <input
                  type="date"
                  max={todayStr}
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="bg-transparent text-xs font-bold text-navy dark:text-white outline-none cursor-pointer"
                />
              </label>

              <button
                type="button"
                disabled={isToday}
                onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
                className={`rounded-xl p-1.5 transition-colors ${
                  isToday
                    ? 'text-slate-400 opacity-40 cursor-not-allowed'
                    : 'text-navy dark:text-white hover:bg-slate-500/10'
                }`}
                title="Next day"
                aria-label="Next day"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="glass-surface inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-bold text-brand dark:text-indigo-400 shadow-glass hover:bg-slate-500/10 transition-colors"
              >
                <RotateCcwIcon className="h-3.5 w-3.5" />
                Back to Today
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        <Banner
          tone={isToday ? 'green' : 'blue'}
          icon={<CheckCircle2Icon className="h-4 w-4" />}
          title={isToday ? 'Live commit feed' : `Commit archive — ${formatDisplayDate(selectedDate)}`}
        >
          {isToday
            ? `Commits stream in as developers log them — ${rawTeamCommits.length} commit${rawTeamCommits.length === 1 ? '' : 's'} across ${Object.keys(byDev).length} developer${Object.keys(byDev).length === 1 ? '' : 's'} today.`
            : `Showing recorded commits for ${formatDisplayDate(selectedDate)} — ${rawTeamCommits.length} commit${rawTeamCommits.length === 1 ? '' : 's'} across ${Object.keys(byDev).length} developer${Object.keys(byDev).length === 1 ? '' : 's'}.`}
        </Banner>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={isToday ? 'Commits today' : 'Commits on date'}
            value={String(rawTeamCommits.length)}
            hint={isToday ? 'Across your team' : formatDisplayDate(selectedDate)}
            tone="blue"
          />
          <StatCard
            label="Top committer"
            value={topCommitter ? topCommitter[0] : '—'}
            hint={topCommitter ? `${topCommitter[1]} commit${topCommitter[1] === 1 ? '' : 's'}` : 'No commits on date'}
            tone="green"
          />
          <StatCard
            label="Branches touched"
            value={String(branches.size)}
            hint={isToday ? 'branches active today' : 'branches active on date'}
            tone="purple"
          />
          <StatCard
            label="Devs with 0 commits"
            value={String(zeroCommitDevs.length)}
            hint={zeroCommitDevs.length === 0 ? 'All developers committed' : `Out of ${developers.length} developers`}
            tone="red"
          />
        </div>

        {/* Filter Toolbar for developer / search */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search commit message, sha, branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-64 rounded-2xl py-2 pl-9 pr-3 text-xs font-medium text-navy dark:text-white placeholder:text-slate-400 shadow-glass focus:outline-none"
              />
            </div>

            {developers.length > 0 && (
              <div className="w-60">
                <Select
                  size="sm"
                  fullWidth
                  value={devFilter}
                  onChange={(val) => setDevFilter(val)}
                  icon={<UsersIcon className="h-3.5 w-3.5" />}
                  placeholder={`All Developers (${developers.length})`}
                  options={[
                    { value: '', label: `All Developers (${developers.length})` },
                    ...developers.map((dev: any) => ({
                      value: dev.name,
                      label: dev.name,
                      badge: byDev[dev.name] ? `${byDev[dev.name]} commits` : '0 commits'
                    }))
                  ]}
                  searchable
                />
              </div>
            )}
          </div>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <strong className="text-navy dark:text-white">{teamCommits.length}</strong> of {rawTeamCommits.length} commit{rawTeamCommits.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="glass-card overflow-hidden rounded-3xl shadow-glass">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <h2 className="text-sm font-bold text-navy dark:text-white">
                {isToday ? "Today's commits" : `Commits on ${formatDisplayDate(selectedDate)}`}
              </h2>
              <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-bold text-navy dark:text-slate-200">
                {teamCommits.length} {teamCommits.length === 1 ? 'commit' : 'commits'}
              </span>
            </div>
            <ol className="divide-y divide-hairline">
              {teamCommits.map((commit: any) => (
                <li key={commit.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-500/5 transition-colors">
                  <Avatar initials={commit.initials || '··'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy dark:text-white">{commit.message}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-navy dark:text-slate-200">{commit.dev}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                        <GitBranchIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        {commit.branch}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{commit.time}</span>
                    </p>
                  </div>
                  {commit.url && (
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-[11px] font-semibold text-brand dark:text-indigo-400 hover:underline"
                    >
                      view
                    </a>
                  )}
                  <code className="shrink-0 rounded-lg glass-surface px-2 py-1 font-mono text-[11px] text-slate-600 dark:text-slate-300 border border-hairline">
                    {commit.sha}
                  </code>
                </li>
              ))}
              {teamCommits.length === 0 && (
                <li className="px-6 py-12 text-center text-xs text-slate-400">
                  <CalendarIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  {isToday
                    ? 'No commits logged today yet.'
                    : `No commits found for ${formatDisplayDate(selectedDate)}.`}
                </li>
              )}
            </ol>
          </section>

          <section className="glass-card h-fit rounded-3xl shadow-glass overflow-hidden">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <h2 className="text-sm font-bold text-navy dark:text-white">Per developer</h2>
              <span className="text-[11px] text-slate-400">
                {isToday ? 'Today' : selectedDate}
              </span>
            </div>
            <ul className="divide-y divide-hairline">
              {developers.map((dev: any) => (
                <li
                  key={dev.id}
                  onClick={() => setDevFilter(devFilter === dev.name ? '' : dev.name)}
                  className={`flex items-center gap-3 px-6 py-3.5 cursor-pointer transition-colors ${
                    devFilter === dev.name ? 'bg-brand/10 dark:bg-brand/20 border-l-4 border-brand' : 'hover:bg-slate-500/5'
                  }`}
                >
                  <Avatar
                    initials={dev.initials}
                    size="sm"
                    tone={byDev[dev.name] > 0 ? 'blue' : 'grey'}
                  />

                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-navy dark:text-white">
                    {dev.name}
                    {devFilter === dev.name && (
                      <span className="ml-1.5 text-[10px] font-bold text-brand dark:text-indigo-400 uppercase">Filtered</span>
                    )}
                  </p>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      byDev[dev.name] > 0 ? 'text-navy dark:text-white' : 'text-rose-500 dark:text-rose-400'
                    }`}
                  >
                    {byDev[dev.name] || 0}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
