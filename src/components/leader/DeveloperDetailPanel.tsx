import React, { useState } from 'react';
import {
  CheckIcon,
  GitBranchIcon,
  StarIcon,
  XIcon } from
'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { TaskStatusBadge } from '../ui/TaskStatusBadge';
import { isLogLate } from '../../utils/logTimeliness';
import { DailyAiConsolidatedSummary } from './DailyAiConsolidatedSummary';
import { Developer } from '../../types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';

type Tab = 'activity' | 'logs' | 'commits' | 'eod';

const tabs: {id: Tab;label: string;}[] = [
{ id: 'activity', label: 'Activity' },
{ id: 'logs', label: 'Logs' },
{ id: 'commits', label: 'Commits' },
{ id: 'eod', label: 'EOD' }];

interface DeveloperDetailPanelProps {
  developer: Developer;
  detail: any | null;
  onClose: () => void;
  onChanged: () => void;
}

export function DeveloperDetailPanel({ developer, detail, onClose, onChanged }: DeveloperDetailPanelProps) {
  const [tab, setTab] = useState<Tab>('activity');

  const logs = detail?.logs || [];
  const panelLogs = logs.slice(0, 4);

  const review = async (logId: string, action: 'approve' | 'reject') => {
    await api(`/api/logs/${logId}/review`, { method: 'POST', body: { action } });
    onChanged();
  };

  return (
    <section className="sticky top-6 rounded-card border border-hairline bg-white shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative">
            <Avatar initials={developer.initials} />
            {detail?.developer?.online && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-ok" title="Online now" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-bold text-navy">{developer.name}</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {developer.team} · {developer.project} · Last seen {developer.lastSeen}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close developer detail"
          className="rounded-md p-1.5 text-gray-400 transition-colors duration-150 ease-out hover:bg-gray-100 hover:text-gray-600">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1 border-b border-hairline px-3 pt-3" role="tablist" aria-label="Developer detail tabs">
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={`rounded-t-lg border-b-2 px-3 py-2 text-xs font-semibold transition-colors duration-150 ease-out ${
              selected ?
              'border-brand text-brand' :
              'border-transparent text-gray-500 hover:text-navy'}`
              }>
              {item.label}
            </button>);
        })}
      </div>

      <div className="space-y-5 px-5 py-5">
        {tab === 'activity' &&
        <>
            <dl className="grid grid-cols-4 gap-2">
              {[
            { label: 'Missed', value: String(detail?.developer?.missed ?? developer.missed), tone: (detail?.developer?.missed ?? developer.missed) > 0 ? 'text-danger' : 'text-green-600' },
            { label: 'Logs', value: String(detail?.developer?.logs ?? developer.logs), tone: 'text-navy' },
            { label: 'Commits', value: String(detail?.developer?.commits ?? developer.commits), tone: 'text-navy' },
            { label: 'Active', value: detail?.activeTimeLabel || '—', tone: 'text-navy' }].
            map((stat) =>
            <div key={stat.label} className="rounded-lg bg-canvas px-3 py-2.5">
                  <dt className="text-[11px] text-gray-500">{stat.label}</dt>
                  <dd className={`mt-0.5 text-sm font-bold tabular-nums ${stat.tone}`}>{stat.value}</dd>
                </div>
            )}
            </dl>

            <DailyAiConsolidatedSummary
              developerId={developer.id}
              developerName={developer.name}
            />
          </>
        }

        {(tab === 'activity' || tab === 'logs') &&
        <div>
            <h4 className="text-sm font-bold text-navy">Work Logs</h4>
            <ul className="mt-3 space-y-2.5">
              {panelLogs.map((log: any) => {
                const isLate = isLogLate(log);
                return (
            <li key={log.id} className={`rounded-lg border p-3.5 transition-all ${isLate ? 'border-amber-300 border-l-4 border-l-amber-500 bg-amber-50/20 shadow-xs' : 'border-hairline bg-white'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-gray-600">
                        {log.hourLabel}
                      </span>
                      <p className="text-sm font-semibold text-navy">{log.task}</p>
                      {isLate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-extrabold shadow-xs uppercase tracking-wide">
                          ⚠️ Late Submission
                        </span>
                      )}
                    </div>
                    <TaskStatusBadge status={log.status} />
                  </div>
                  <p className={`mt-2 text-xs ${isLate ? 'font-bold text-amber-900' : 'text-gray-500'}`}>
                    {isLate ? `Submitted Late at ${log.submittedAt}` : `Submitted ${log.submittedAt}`}
                  </p>
                  {log.review === 'approved' ?
              <Badge tone="green" className="mt-2.5">
                      <CheckIcon className="h-3.5 w-3.5" />
                      Approved
                    </Badge> :

              <div className="mt-2.5 flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        icon={<CheckIcon className="h-3.5 w-3.5" />}
                        onClick={() => review(log.id, 'approve')}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<XIcon className="h-3.5 w-3.5" />}
                        onClick={() => review(log.id, 'reject')}>
                        Reject
                      </Button>
                    </div>
              }
                </li>
              );})}
              {panelLogs.length === 0 && (
                <li className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-xs text-gray-500">
                  No logs submitted today.
                </li>
              )}
            </ul>
          </div>
        }

        {(tab === 'activity' || tab === 'commits') &&
        <div>
            <h4 className="text-sm font-bold text-navy">Commits</h4>
            <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-hairline">
              {(detail?.commits || []).map((commit: any) => (
            <li key={commit.id} className="flex items-center gap-2.5 px-3.5 py-3">
                  <GitBranchIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                  <p className="min-w-0 flex-1 truncate text-sm text-navy">{commit.message}</p>
                  <span className="shrink-0 text-[11px] tabular-nums text-gray-500">
                    {commit.time} · {commit.branch}
                  </span>
                </li>
              ))}
              {(detail?.commits || []).length === 0 && (
                <li className="px-3.5 py-4 text-center text-xs text-gray-500">No commits today.</li>
              )}
            </ul>
          </div>
        }

        {tab === 'eod' &&
        <div className="rounded-lg border border-hairline p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-navy">Latest EOD Report</h4>
              {detail?.eod && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <StarIcon className="h-3.5 w-3.5 fill-warn text-warn" aria-hidden="true" />
                  {detail.eod.rating}/5
                </span>
              )}
            </div>
            {detail?.eod ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{detail.eod.summary}</p>
                <p className="mt-3 text-xs text-gray-500">Submitted {detail.eod.time}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No EOD report on record yet.</p>
            )}
          </div>
        }
      </div>
    </section>);
}
