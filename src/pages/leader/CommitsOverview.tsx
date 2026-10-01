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
            <div className="flex items-center gap-1 rounded-xl border border-hairline bg-white p-1 shadow-card">
              <button
                type="button"
                onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                className="rounded-lg p-1.5 text-navy hover:bg-gray-100 transition-colors"
                title="Previous day"
                aria-label="Previous day"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  isToday
                    ? 'bg-brand text-white shadow-2xs'
                    : 'text-navy hover:bg-gray-100'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  isYesterday
                    ? 'bg-brand text-white shadow-2xs'
                    : 'text-navy hover:bg-gray-100'
                }`}
              >
                Yesterday
              </button>

              <div className="h-4 w-px bg-gray-200 mx-0.5" />

              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-navy cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                <CalendarIcon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                <input
                  type="date"
                  max={todayStr}
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="bg-transparent text-xs font-bold text-navy outline-none cursor-pointer"
                />
              </label>

              <button
                type="button"
                disabled={isToday}
                onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
                className={`rounded-lg p-1.5 transition-colors ${
                  isToday
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-navy hover:bg-gray-100'
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
                className="inline-flex items-center gap-1 rounded-xl border border-hairline bg-white px-3 py-2 text-xs font-bold text-brand shadow-card hover:bg-gray-50 transition-colors"
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search commit message, sha, branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-xl border border-hairline bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-navy placeholder:text-gray-400 shadow-card focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {developers.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-1.5 shadow-card">
                <label htmlFor="commit-dev-filter" className="text-xs font-bold text-navy flex items-center gap-1">
                  <UsersIcon className="h-3.5 w-3.5 text-gray-400" />
                  Developer:
                </label>
                <select
                  id="commit-dev-filter"
                  value={devFilter}
                  onChange={(e) => setDevFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-brand focus:outline-none cursor-pointer"
                >
                  <option value="">All Developers ({developers.length})</option>
                  {developers.map((dev: any) => (
                    <option key={dev.id || dev._id} value={dev.name}>
                      {dev.name} {byDev[dev.name] ? `(${byDev[dev.name]})` : '(0)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <span className="text-xs font-semibold text-gray-500">
            Showing <strong className="text-navy">{teamCommits.length}</strong> of {rawTeamCommits.length} commit{rawTeamCommits.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h2 className="text-sm font-bold text-navy">
                {isToday ? "Today's commits" : `Commits on ${formatDisplayDate(selectedDate)}`}
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {teamCommits.length} {teamCommits.length === 1 ? 'commit' : 'commits'}
              </span>
            </div>
            <ol className="divide-y divide-gray-100">
              {teamCommits.map((commit: any) => (
                <li key={commit.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                  <Avatar initials={commit.initials || '··'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{commit.message}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-semibold text-navy">{commit.dev}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600">
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
                      className="shrink-0 text-[11px] font-semibold text-brand hover:underline"
                    >
                      view
                    </a>
                  )}
                  <code className="shrink-0 rounded bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-600 border border-gray-200">
                    {commit.sha}
                  </code>
                </li>
              ))}
              {teamCommits.length === 0 && (
                <li className="px-5 py-12 text-center text-xs text-gray-500">
                  <CalendarIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  {isToday
                    ? 'No commits logged today yet.'
                    : `No commits found for ${formatDisplayDate(selectedDate)}.`}
                </li>
              )}
            </ol>
          </section>

          <section className="h-fit rounded-card border border-hairline bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h2 className="text-sm font-bold text-navy">Per developer</h2>
              <span className="text-[11px] text-gray-400">
                {isToday ? 'Today' : selectedDate}
              </span>
            </div>
            <ul className="divide-y divide-gray-100">
              {developers.map((dev: any) => (
                <li
                  key={dev.id}
                  onClick={() => setDevFilter(devFilter === dev.name ? '' : dev.name)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                    devFilter === dev.name ? 'bg-brand/5 ring-1 ring-inset ring-brand/20' : 'hover:bg-slate-50'
                  }`}
                >
                  <Avatar
                    initials={dev.initials}
                    size="sm"
                    tone={byDev[dev.name] > 0 ? 'blue' : 'grey'}
                  />

                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-navy">
                    {dev.name}
                    {devFilter === dev.name && (
                      <span className="ml-1.5 text-[10px] font-bold text-brand uppercase">Filtered</span>
                    )}
                  </p>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      byDev[dev.name] > 0 ? 'text-navy' : 'text-danger'
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
