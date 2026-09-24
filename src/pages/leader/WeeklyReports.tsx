import React, { useState } from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Banner } from '../../components/ui/Banner';
import { useWeeklyReport, useDevelopers } from '../../hooks/useLive';

const MAX_HOURS = 8;
const TARGET = 6;

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
        subtitle={`${report?.developer?.name || 'Team'} · ${user_weekLabel(week)}`}
        actions={
        <>
            <label className="sr-only" htmlFor="wr-dev">
              Developer
            </label>
            <select
            id="wr-dev"
            value={devId}
            onChange={(event) => setDeveloper(event.target.value)}
            className="h-9 rounded-lg border border-hairline bg-white px-3 text-sm font-semibold text-navy">
              {developers.map((dev: any) =>
            <option key={dev.id} value={dev.id}>
                  {dev.name}
                </option>
            )}
            </select>
            <label className="sr-only" htmlFor="wr-week">
              Week
            </label>
            <select
            id="wr-week"
            value={week}
            onChange={(event) => setWeek(Number(event.target.value))}
            className="h-9 rounded-lg border border-hairline bg-white px-3 text-sm font-semibold text-navy">
              <option value={0}>This week</option>
              <option value={1}>Last week</option>
              <option value={2}>2 weeks ago</option>
            </select>
          </>
        } />


      <div className="flex-1 space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Logs" value={String(report?.totals?.logs ?? 0)} hint="5 working days" tone="grey" />
          <StatCard
            label="Completed"
            value={String(report?.totals?.completed ?? 0)}
            hint={`${report?.totals?.completedPct ?? 0}% of logged tasks`}
            tone="green" />
          <StatCard label="EOD Reports" value={report?.totals?.eodReports || '0/5'} hint="submitted this week" tone="yellow" />
        </div>

        <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-navy">Work Hours Per Day</h2>
            <span className="inline-flex items-center gap-2 text-xs text-gray-500">
              <span className="h-px w-6 border-t-2 border-dashed border-danger" aria-hidden="true" />
              Target {TARGET}h
            </span>
          </div>

          <div className="relative mt-6 h-52">
            <div
              className="absolute inset-x-0 border-t-2 border-dashed border-danger"
              style={{ bottom: `${TARGET / MAX_HOURS * 100}%` }}
              aria-hidden="true" />

            <ul className="flex h-full items-end gap-6">
              {weeklyRows.map((row: any) => {
                const below = row.hours < TARGET;
                return (
                  <li key={row.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                      below ? 'text-amber-600' : 'text-navy'}`
                      }>
                      {row.hours}h
                    </span>
                    <div
                      className={`w-full max-w-[64px] rounded-t-md ${below ? 'bg-warn' : 'bg-brand'}`}
                      style={{ height: `${Math.max(2, row.hours / MAX_HOURS * 100)}%` }} />

                    <span className="text-xs font-semibold text-gray-500">{row.day}</span>
                  </li>);
              })}
              {weeklyRows.length === 0 && (
                <li className="flex h-full w-full items-center justify-center text-xs text-gray-500">
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

        <section className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
          <h2 className="border-b border-hairline px-5 py-4 text-sm font-bold text-navy">
            Daily breakdown
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-canvas text-xs uppercase tracking-wide text-gray-500">
                <th scope="col" className="px-5 py-3 font-semibold">Day</th>
                <th scope="col" className="px-3 py-3 font-semibold">Logs</th>
                <th scope="col" className="px-3 py-3 font-semibold">Done</th>
                <th scope="col" className="px-3 py-3 font-semibold">Blocked</th>
                <th scope="col" className="px-3 py-3 font-semibold">Missed</th>
                <th scope="col" className="px-3 py-3 font-semibold">Commits</th>
                <th scope="col" className="px-3 py-3 font-semibold">EOD</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {weeklyRows.map((row: any) => {
                const bad = row.missed > 0 || !row.eod;
                return (
                  <tr key={row.date} className={bad ? 'bg-danger-soft' : ''}>
                    <td className="px-5 py-3.5 font-semibold text-navy">
                      {row.day} <span className="text-xs font-normal text-gray-500">{row.date}</span>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-gray-600">{row.logs}</td>
                    <td className="px-3 py-3.5 tabular-nums text-gray-600">{row.done}</td>
                    <td className="px-3 py-3.5 tabular-nums text-gray-600">{row.blocked}</td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`font-semibold tabular-nums ${
                        row.missed > 0 ? 'text-danger' : 'text-green-600'}`
                        }>
                        {row.missed}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-gray-600">{row.commits}</td>
                    <td className="px-3 py-3.5">
                      <span className={`text-xs font-bold ${row.eod ? 'text-green-600' : 'text-danger'}`}>
                        {row.eod ? 'Submitted' : 'Missing'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${bad ? 'bg-danger' : 'bg-ok'}`
                        }
                        aria-label={bad ? 'Needs review' : 'Healthy'} />
                    </td>
                  </tr>);
              })}
            </tbody>
          </table>
        </section>
      </div>
    </>);
}

function user_weekLabel(week: number) {
  if (week === 0) return 'This week';
  if (week === 1) return 'Last week';
  return `${week} weeks ago`;
}
