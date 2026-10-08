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
    <section className="glass-card sticky top-6 rounded-3xl border border-white/80 p-0 shadow-glass overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 px-6 py-5">
        <div className="flex items-center gap-3.5">
          <span className="relative">
            <Avatar initials={developer.initials} size="md" />
            {detail?.developer?.online && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" title="Online now" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-black tracking-tight text-navy">{developer.name}</h2>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {developer.team} · {developer.project} · Last seen {developer.lastSeen}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close developer detail"
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200/60 px-4 pt-3 pb-2" role="tablist" aria-label="Developer detail tabs">
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                selected
                  ? 'btn-glass-primary !text-white shadow-sm scale-[1.02]'
                  : 'text-slate-500 hover:text-navy hover:bg-white/40'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-5 p-6">
        {tab === 'activity' && (
          <>
            <dl className="grid grid-cols-4 gap-2.5">
              {[
                { label: 'Missed', value: String(detail?.developer?.missed ?? developer.missed), tone: (detail?.developer?.missed ?? developer.missed) > 0 ? 'text-rose-600 font-black' : 'text-emerald-600' },
                { label: 'Logs', value: String(detail?.developer?.logs ?? developer.logs), tone: 'text-navy font-bold' },
                { label: 'Commits', value: String(detail?.developer?.commits ?? developer.commits), tone: 'text-navy font-bold' },
                { label: 'Active', value: detail?.activeTimeLabel || '—', tone: 'text-navy font-bold' }
              ].map((stat) => (
                <div key={stat.label} className="glass-surface rounded-2xl border border-white/60 p-3 text-center shadow-2xs">
                  <dt className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{stat.label}</dt>
                  <dd className={`mt-1 text-sm tabular-nums ${stat.tone}`}>{stat.value}</dd>
                </div>
              ))}
            </dl>

            <DailyAiConsolidatedSummary
              developerId={developer.id}
              developerName={developer.name}
            />
          </>
        )}

        {(tab === 'activity' || tab === 'logs') && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Work Logs</h4>
            <ul className="mt-3 space-y-3">
              {panelLogs.map((log: any) => {
                const isLate = isLogLate(log);
                return (
                  <li
                    key={log.id}
                    className={`glass-surface rounded-2xl border p-4 shadow-glass transition-all ${
                      isLate
                        ? 'border-amber-300/80 bg-amber-50/40'
                        : 'border-white/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-100/80 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-slate-600 border border-slate-200/60">
                          {log.hourLabel}
                        </span>
                        <p className="text-xs font-bold text-navy">{log.task}</p>
                        {isLate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                            ⚠️ Late Submission
                          </span>
                        )}
                      </div>
                      <TaskStatusBadge status={log.status} />
                    </div>
                    <p className={`mt-2 text-xs font-medium ${isLate ? 'font-bold text-amber-900' : 'text-slate-500'}`}>
                      {isLate ? `Submitted Late at ${log.submittedAt}` : `Submitted ${log.submittedAt}`}
                    </p>
                    {log.review === 'approved' ? (
                      <Badge tone="green" className="mt-3">
                        <CheckIcon className="h-3.5 w-3.5" />
                        Approved
                      </Badge>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          icon={<CheckIcon className="h-3.5 w-3.5" />}
                          onClick={() => review(log.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<XIcon className="h-3.5 w-3.5" />}
                          onClick={() => review(log.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
              {panelLogs.length === 0 && (
                <li className="glass-surface rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                  No logs submitted today.
                </li>
              )}
            </ul>
          </div>
        )}

        {(tab === 'activity' || tab === 'commits') && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Commits</h4>
            <ul className="glass-surface mt-3 divide-y divide-slate-200/60 rounded-2xl border border-white/80 overflow-hidden shadow-2xs">
              {(detail?.commits || []).map((commit: any) => (
                <li key={commit.id} className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/40 transition-colors">
                  <GitBranchIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <p className="min-w-0 flex-1 truncate text-xs font-bold text-navy">{commit.message}</p>
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-400 font-medium">
                    {commit.time} · {commit.branch}
                  </span>
                </li>
              ))}
              {(detail?.commits || []).length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-slate-400 font-medium">No commits today.</li>
              )}
            </ul>
          </div>
        )}

        {tab === 'eod' && (
          <div className="glass-surface rounded-2xl border border-white/80 p-5 shadow-glass">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest EOD Report</h4>
              {detail?.eod && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                  <StarIcon className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                  {detail.eod.rating}/5
                </span>
              )}
            </div>
            {detail?.eod ? (
              <>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 font-normal">{detail.eod.summary}</p>
                <p className="mt-3 text-[11px] text-slate-400 font-medium">Submitted {detail.eod.time}</p>
              </>
            ) : (
              <p className="mt-3 text-xs text-slate-400 font-medium">No EOD report on record yet.</p>
            )}
          </div>
        )}
      </div>
    </section>);
}
