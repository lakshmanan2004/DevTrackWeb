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
import { ReviewLogFeedbackModal } from './ReviewLogFeedbackModal';
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
  const [selectedReviewLog, setSelectedReviewLog] = useState<any | null>(null);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject'>('approve');
  const [isReviewing, setIsReviewing] = useState(false);
  const [overrideReviews, setOverrideReviews] = useState<Record<string, { review: string; reviewNote?: string }>>({});

  const rawLogs = detail?.logs || [];
  const logs = rawLogs.map((item: any) => {
    const logId = item.id || item._id;
    const override = overrideReviews[logId];
    if (override) {
      return { ...item, review: override.review, reviewNote: override.reviewNote || item.reviewNote };
    }
    return item;
  });
  const panelLogs = logs.slice(0, 8);

  const handleOpenReview = (log: any, mode: 'approve' | 'reject') => {
    setSelectedReviewLog(log);
    setReviewMode(mode);
  };

  const handleExecuteReview = async (action: 'approve' | 'changes_requested' | 'reject', note: string) => {
    if (!selectedReviewLog) return;
    const logId = selectedReviewLog.id || selectedReviewLog._id;
    setIsReviewing(true);
    const newReview = action;
    setOverrideReviews((prev) => ({
      ...prev,
      [logId]: { review: newReview, reviewNote: note || '' }
    }));
    try {
      await api(`/api/logs/${logId}/review`, {
        method: 'POST',
        body: { action, note: note || '', reviewNote: note || '' }
      });
      setSelectedReviewLog(null);
      onChanged();
    } catch (err: any) {
      console.error('Failed to review log:', err);
      setOverrideReviews((prev) => {
        const copy = { ...prev };
        delete copy[logId];
        return copy;
      });
      throw err;
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <section className="glass-card sticky top-6 rounded-3xl border border-white/80 dark:border-white/10 p-0 shadow-glass overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 px-6 py-5">
        <div className="flex items-center gap-3.5">
          <span className="relative">
            <Avatar initials={developer.initials} size="md" />
            {detail?.developer?.online && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500 shadow-sm" title="Online now" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-black tracking-tight text-navy dark:text-white">{developer.name}</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {developer.team} · {developer.project} · Last seen {developer.lastSeen}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close developer detail"
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200/60 dark:border-white/10 px-4 pt-3 pb-2" role="tablist" aria-label="Developer detail tabs">
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
                  : 'text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/50'
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
                { label: 'Missed', value: String(detail?.developer?.missed ?? developer.missed), tone: (detail?.developer?.missed ?? developer.missed) > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Logs', value: String(detail?.developer?.logs ?? developer.logs), tone: 'text-navy dark:text-white font-bold' },
                { label: 'Commits', value: String(detail?.developer?.commits ?? developer.commits), tone: 'text-navy dark:text-white font-bold' },
                { label: 'Active', value: detail?.activeTimeLabel || '—', tone: 'text-navy dark:text-white font-bold' }
              ].map((stat) => (
                <div key={stat.label} className="glass-surface rounded-2xl border border-white/60 dark:border-white/10 p-3 text-center shadow-2xs">
                  <dt className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400">{stat.label}</dt>
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
                    className={`glass-surface rounded-2xl border p-3.5 shadow-glass transition-all ${
                      isLate
                        ? 'border-amber-300/80 dark:border-amber-500/30'
                        : 'border-white/80 dark:border-white/10'
                    }`}
                  >
                    {/* ROW 1: [Hour] Title ... [Late Badge] [Status Badge] */}
                    <div className="flex items-center justify-between gap-2.5 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700/80 px-2.5 py-1 text-xs font-black tabular-nums text-slate-800 dark:text-white border border-slate-300/60 dark:border-white/10">
                          {log.hourLabel}
                        </span>
                        <p className="truncate text-xs sm:text-sm font-bold text-navy dark:text-white" title={log.task}>
                          {log.task}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isLate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
                            ⚠️ Late
                          </span>
                        )}
                        <TaskStatusBadge status={log.status} />
                      </div>
                    </div>

                    {/* ROW 2: Submitted time (left) + Action Button / Approved Badge (right) */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/40 dark:border-white/10">
                      <span className={`text-[11px] font-medium ${isLate ? 'font-bold text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isLate ? `Submitted Late at ${log.submittedAt}` : `Submitted ${log.submittedAt}`}
                      </span>

                      <div className="shrink-0">
                        {log.review === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <CheckIcon className="h-3.5 w-3.5" />
                            Approved
                          </span>
                        ) : log.review === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                            <XIcon className="h-3.5 w-3.5" />
                            Rejected
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="success"
                              className="!py-1 !px-2.5 !text-xs !rounded-xl"
                              icon={<CheckIcon className="h-3.5 w-3.5" />}
                              onClick={() => handleOpenReview(log, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="!py-1 !px-2.5 !text-xs !rounded-xl"
                              icon={<XIcon className="h-3.5 w-3.5" />}
                              onClick={() => handleOpenReview(log, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
              {panelLogs.length === 0 && (
                <li className="glass-surface rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-6 text-center text-xs text-slate-400">
                  No logs submitted today.
                </li>
              )}
            </ul>
          </div>
        )}

        {(tab === 'activity' || tab === 'commits') && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Commits</h4>
            <ul className="glass-surface mt-3 divide-y divide-slate-200/60 dark:divide-white/10 rounded-2xl border border-white/80 dark:border-white/10 overflow-hidden shadow-2xs">
              {(detail?.commits || []).map((commit: any) => (
                <li key={commit.id} className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                  <GitBranchIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <p className="min-w-0 flex-1 truncate text-xs font-bold text-navy dark:text-white">{commit.message}</p>
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
          <div className="glass-surface rounded-2xl border border-white/80 dark:border-white/10 p-5 shadow-glass">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest EOD Report</h4>
              {detail?.eod && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <StarIcon className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                  {detail.eod.rating}/5
                </span>
              )}
            </div>
            {detail?.eod ? (
              <>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">{detail.eod.summary}</p>
                <p className="mt-3 text-[11px] text-slate-400 font-medium">Submitted {detail.eod.time}</p>
              </>
            ) : (
              <p className="mt-3 text-xs text-slate-400 font-medium">No EOD report on record yet.</p>
            )}
          </div>
        )}
      </div>

      {selectedReviewLog && (
        <ReviewLogFeedbackModal
          isOpen={!!selectedReviewLog}
          onClose={() => setSelectedReviewLog(null)}
          log={{
            ...selectedReviewLog,
            developerName: selectedReviewLog.developerName || developer.name,
            developerInitials: selectedReviewLog.developerInitials || developer.initials,
            developerEmail: selectedReviewLog.developerEmail || (developer as any).email
          }}
          mode={reviewMode}
          onReview={handleExecuteReview}
          busy={isReviewing}
        />
      )}
    </section>
  );
}
