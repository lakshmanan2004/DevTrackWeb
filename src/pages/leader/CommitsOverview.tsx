import React from 'react';
import { CheckCircle2Icon, GitBranchIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/ui/StatCard';
import { useCommits, useDevelopers } from '../../hooks/useLive';
import { useAuth } from '../../context/AuthContext';

export function CommitsOverview() {
  const { user } = useAuth();
  const { data } = useCommits();
  const { data: devData } = useDevelopers();
  const teamCommits = data?.team || [];
  const developers = devData?.developers || [];

  const branches = new Set(teamCommits.map((c: any) => c.branch));
  const byDev: Record<string, number> = {};
  for (const c of teamCommits) byDev[c.dev] = (byDev[c.dev] || 0) + 1;
  const topCommitter = Object.entries(byDev).sort((a, b) => b[1] - a[1])[0];
  const zeroCommitDevs = developers.filter((d: any) => !byDev[d.name]);

  const dateLabel = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <PageHeader
        title="Commits Overview"
        subtitle={`${user?.teamName || 'Team'} · ${user?.projectName || ''} · ${dateLabel}`} />


      <div className="flex-1 space-y-5 p-6">
        <Banner tone="green" icon={<CheckCircle2Icon className="h-4 w-4" />} title="Live commit feed">
          Commits stream in as developers log them — {teamCommits.length} commits across{' '}
          {Object.keys(byDev).length} developers today
        </Banner>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Commits today" value={String(teamCommits.length)} hint="Across your team" tone="blue" />
          <StatCard
            label="Top committer"
            value={topCommitter ? topCommitter[0] : '—'}
            hint={topCommitter ? `${topCommitter[1]} commits` : 'No commits yet'}
            tone="green" />
          <StatCard label="Branches touched" value={String(branches.size)} hint="branches active today" tone="purple" />
          <StatCard
            label="Devs with 0 commits"
            value={String(zeroCommitDevs.length)}
            hint={zeroCommitDevs.map((d: any) => d.name.split(' ')[0]).join(', ') || 'All devs committed'}
            tone="red" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
            <h2 className="border-b border-hairline px-5 py-4 text-sm font-bold text-navy">
              Today&apos;s commits
            </h2>
            <ol className="divide-y divide-gray-100">
              {teamCommits.map((commit: any) =>
              <li key={commit.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar initials={commit.initials || '··'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{commit.message}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <span>{commit.dev}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <GitBranchIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {commit.branch}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{commit.time}</span>
                    </p>
                  </div>
                  {commit.url && (
                    <a href={commit.url} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] font-semibold text-brand hover:underline">
                      view
                    </a>
                  )}
                  <code className="shrink-0 rounded bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-600">
                    {commit.sha}
                  </code>
                </li>
              )}
              {teamCommits.length === 0 && (
                <li className="px-5 py-8 text-center text-xs text-gray-500">
                  No commits logged today yet.
                </li>
              )}
            </ol>
          </section>

          <section className="h-fit rounded-card border border-hairline bg-white shadow-card">
            <h2 className="border-b border-hairline px-5 py-4 text-sm font-bold text-navy">
              Per developer
            </h2>
            <ul className="divide-y divide-gray-100">
              {developers.map((dev: any) =>
              <li key={dev.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar
                  initials={dev.initials}
                  size="sm"
                  tone={byDev[dev.name] > 0 ? 'blue' : 'grey'} />

                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-navy">{dev.name}</p>
                  <span
                  className={`text-sm font-bold tabular-nums ${
                  byDev[dev.name] > 0 ? 'text-navy' : 'text-danger'}`
                  }>
                    {byDev[dev.name] || 0}
                  </span>
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </>);

}
