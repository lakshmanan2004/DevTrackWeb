import React, { useState } from 'react';
import { AlertTriangleIcon, UserIcon, CalendarIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Banner } from '../../components/ui/Banner';
import { Select } from '../../components/ui/Select';
import { useWeeklyReport, useDevelopers } from '../../hooks/useLive';

const MAX_HOURS = 8;
const TARGET = 6;

function user_weekLabel(week: number) {
  if (week === 0) return 'This week';
  if (week === 1) return 'Last week';
  return `${week} weeks ago`;
}

export function WeeklyReports() {
  const { data: devData } = useDevelopers();
  const developers = devData?.developers || [];
  const [developer, setDeveloper] = useState('');
  const [week, setWeek] = useState(0);

  const devId = developer || developers[0]?.id || '';
  const { data: report } = useWeeklyReport(devId, week);

  const weeklyRows = report?.rows || [];

  return (
    <>
      <PageHeader
        title="Weekly Reports"
        subtitle={`Weekly performance metrics, attendance summaries, and EOD reports · ${report?.developer?.name || 'Developer'} (${user_weekLabel(week)})`}
        actions={
          <div className="flex items-center gap-2.5">
            <div className="w-48">
              <Select
                size="sm"
                fullWidth
                value={devId}
                onChange={(val) => setDeveloper(val)}
                icon={<UserIcon className="h-3.5 w-3.5" />}
                options={developers.map((dev: any) => ({
                  value: dev.id,
                  label: dev.name,
                  badge: dev.role || 'Developer'
                }))}
                searchable
              />
            </div>
            <div className="w-36">
              <Select
                size="sm"
                fullWidth
                value={week}
                onChange={(val) => setWeek(Number(val))}
                icon={<CalendarIcon className="h-3.5 w-3.5" />}
                options={[
                  { value: 0, label: 'This week' },
                  { value: 1, label: 'Last week' },
                  { value: 2, label: '2 weeks ago' }
                ]}
              />
            </div>
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Logs" value={String(report?.totals?.logs ?? 0)} hint="5 working days" tone="grey" />
          <StatCard
            label="Completed"
            value={String(report?.totals?.completed ?? 0)}
            hint={`${report?.totals?.completedPct ?? 0}% of logged tasks`}
            tone="green"
          />
          <StatCard label="EOD Reports" value={report?.totals?.eodReports || '0/5'} hint="submitted this week" tone="yellow" />
        </div>

        <section className="glass-card rounded-3xl p-6 shadow-glass">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-navy dark:text-white">Work Hours Per Day</h2>
            <span className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="h-px w-6 border-t-2 border-dashed border-rose-400" aria-hidden="true" />
              Target {TARGET}h
            </span>
          </div>

          <div className="relative mt-6 h-52">
            <div
              className="absolute inset-x-0 border-t-2 border-dashed border-rose-400/80"
              style={{ bottom: `${(TARGET / MAX_HOURS) * 100}%` }}
              aria-hidden="true"
            />

            <ul className="flex h-full items-end gap-6">
              {weeklyRows.map((row: any) => {
                const below = row.hours < TARGET;
                return (
                  <li key={row.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        below ? 'text-amber-500 dark:text-amber-400' : 'text-navy dark:text-white'
                      }`}
                    >
                      {row.hours}h
                    </span>
                    <div
                      className={`w-full max-w-[64px] rounded-t-xl transition-all shadow-sm ${
                        below
                          ? 'bg-gradient-to-t from-amber-500 to-orange-400'
                          : 'bg-gradient-to-t from-indigo-500 to-violet-400'
                      }`}
                      style={{ height: `${Math.max(4, (row.hours / MAX_HOURS) * 100)}%` }}
                    />

                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{row.day}</span>
                  </li>
                );
              })}
              {weeklyRows.length === 0 && (
                <li className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  No data for this week yet.
                </li>
              )}
            </ul>
          </div>
        </section>

        {report?.note && (
          <Banner tone="yellow" icon={<AlertTriangleIcon className="h-4 w-4" />}>
            {report.note}
          </Banner>
        )}

        <section className="glass-card overflow-hidden rounded-3xl shadow-glass">
          <h2 className="border-b border-hairline px-6 py-4 text-sm font-bold text-navy dark:text-white">
            Daily breakdown
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs uppercase tracking-wide text-slate-400">
                <th scope="col" className="px-6 py-3.5 font-semibold">Day</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">Logs</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">Done</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">Blocked</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">Missed</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">Commits</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">EOD</th>
                <th scope="col" className="px-6 py-3.5 text-right font-semibold">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {weeklyRows.map((row: any) => {
                const bad = row.missed > 0 || !row.eod;
                return (
                  <tr key={row.date} className={bad ? 'bg-rose-500/10 dark:bg-rose-500/15' : 'hover:bg-slate-500/5 transition-colors'}>
                    <td className="px-6 py-3.5 font-semibold text-navy dark:text-white">
                      {row.day} <span className="text-xs font-normal text-slate-400">{row.date}</span>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">{row.logs}</td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">{row.done}</td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">{row.blocked}</td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`font-semibold tabular-nums ${
                          row.missed > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'
                        }`}
                      >
                        {row.missed}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">{row.commits}</td>
                    <td className="px-3 py-3.5">
                      <span className={`text-xs font-bold ${row.eod ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {row.eod ? 'Submitted' : 'Missing'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${bad ? 'bg-rose-500 shadow-rose-500/50' : 'bg-emerald-500 shadow-emerald-500/50'} shadow-sm`}
                        aria-label={bad ? 'Needs review' : 'Healthy'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

