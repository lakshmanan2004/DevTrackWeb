import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  BotIcon,
  CheckIcon,
  CheckCircle2Icon,
  CheckCheckIcon,
  EyeIcon,
  FileTextIcon,
  FlagIcon,
  MessageSquareIcon,
  SirenIcon,
  Trash2Icon,
  XIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Button } from '../../components/ui/Button';
import { FilterPills } from '../../components/ui/FilterPills';
import { useAlerts } from '../../hooks/useLive';
import { LeaderAlert } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const severityShell: Record<string, string> = {
  critical: 'border-rose-500/60 dark:border-rose-500/40 bg-rose-500/15 dark:bg-rose-950/45 shadow-[0_4px_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20 backdrop-blur-2xl',
  warning: 'border-amber-500/60 dark:border-amber-500/40 bg-amber-500/15 dark:bg-amber-950/45 shadow-[0_4px_20px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/20 backdrop-blur-2xl',
  flag: 'border-orange-500/60 dark:border-orange-500/40 bg-orange-500/15 dark:bg-orange-950/45 shadow-[0_4px_20px_rgba(249,115,22,0.12)] ring-1 ring-orange-500/20 backdrop-blur-2xl',
  seen: 'border-white/80 dark:border-white/15 bg-white/80 dark:bg-slate-900/70 shadow-glass backdrop-blur-2xl'
};

const severityIconShell: Record<string, string> = {
  critical: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
  flag: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',
  seen: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-white/20'
};

const categoryIcon: Record<string, React.ReactNode> = {
  'Missed Log': <SirenIcon className="h-4 w-4" />,
  'Batch Submit': <FlagIcon className="h-4 w-4" />,
  'EOD Missing': <FileTextIcon className="h-4 w-4" />
};

const actionIcon: Record<string, React.ReactNode> = {
  'Send Reminder': <MessageSquareIcon className="h-3.5 w-3.5" />,
  'Mark Seen': <CheckIcon className="h-3.5 w-3.5" />,
  'Reject All': <XIcon className="h-3.5 w-3.5" />
};

export function LeaderAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, refetch } = useAlerts();
  const leaderAlerts: LeaderAlert[] = (data?.alerts || []).filter((a: any) => a.category);
  const [filter, setFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const unread = leaderAlerts.filter((a: LeaderAlert) => a.unread).length;

  const visible = leaderAlerts.filter((alert: LeaderAlert) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return alert.unread;
    return alert.category === filter;
  });

  const act = async (alert: LeaderAlert, action: string) => {
    try {
      await api(`/api/alerts/${alert.id}/action`, { method: 'POST', body: { action } });
      refetch();
      if (action.startsWith('View')) {
        if (alert.developerId) {
          navigate(`/leader?dev=${alert.developerId}`);
        } else if (alert.who) {
          navigate(`/leader?dev=${encodeURIComponent(alert.who)}`);
        } else {
          navigate('/leader');
        }
        return;
      }
      if (action === 'Review Logs') {
        navigate('/leader/approvals');
        return;
      }
      if (action === 'Send Reminder') {
        showToast(`Reminder notification sent to ${alert.who || 'developer'}!`);
      } else if (action === 'Mark Seen') {
        showToast(`Alert for ${alert.who || 'developer'} marked as seen.`);
      }
    } catch (err: any) {
      console.error('Action error:', err);
    }
  };

  const handleDelete = async (alertId: string, who?: string) => {
    try {
      await api(`/api/alerts/${alertId}`, { method: 'DELETE' });
      refetch();
      showToast(`Alert ${who ? `for ${who}` : ''} deleted.`);
    } catch (err: any) {
      console.error('Delete alert error:', err);
    }
  };

  const handleClearAll = async () => {
    if (!leaderAlerts.length) return;
    try {
      await api('/api/alerts/clear-all', { method: 'DELETE' });
      refetch();
      showToast('All alerts cleared successfully.');
    } catch (err: any) {
      console.error('Clear all error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!unread) return;
    try {
      await api('/api/alerts/read-all', { method: 'POST' });
      refetch();
      showToast('All alerts marked as read.');
    } catch (err: any) {
      console.error('Mark all read error:', err);
    }
  };

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="Monitor missed check-ins, delayed submissions, and actionable developer alerts"
        actions={
          <div className="flex items-center gap-2.5">
            {unread > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                icon={<CheckCheckIcon className="h-3.5 w-3.5 text-brand dark:text-indigo-400" />}
              >
                Mark All as Read
              </Button>
            )}
            {leaderAlerts.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
                icon={<Trash2Icon className="h-3.5 w-3.5 text-rose-500" />}
              >
                Clear All
              </Button>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              <BellIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {unread} unread
            </span>
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        <Banner tone="red" icon={<BotIcon className="h-4 w-4" />}>
          All alerts are auto-generated. The server checks every hour for missed logs, flags batch
          submissions and monitors EOD reports — pushed to this page in real time.
        </Banner>

        {toastMessage && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-600/90 px-4 py-3 text-xs font-bold text-white shadow-glass backdrop-blur-md animate-in fade-in">
            <CheckCircle2Icon className="h-4 w-4" />
            {toastMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterPills
            ariaLabel="Filter alerts"
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'All', count: leaderAlerts.length },
              { id: 'unread', label: 'Unread', count: unread },
              { id: 'Missed Log', label: 'Missed Log' },
              { id: 'Batch Submit', label: 'Batch Submit' },
              { id: 'EOD Missing', label: 'EOD Missing' }
            ]}
          />
        </div>

        <ul className="space-y-4">
          {visible.map((alert: LeaderAlert) => {
            const isUnread = alert.unread;
            const shellStyle = isUnread
              ? severityShell[alert.severity] || severityShell.seen
              : severityShell.seen;
            const iconStyle = isUnread
              ? severityIconShell[alert.severity] || severityIconShell.seen
              : severityIconShell.seen;

            return (
              <li
                key={alert.id}
                className={`relative rounded-3xl border p-5 shadow-glass backdrop-blur-xl transition-all hover:shadow-xl ${shellStyle}`}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconStyle}`}
                  >
                    {categoryIcon[alert.category] || <SirenIcon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">{alert.title}</h2>
                        {isUnread ? (
                          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-indigo-400 shadow-xs" aria-label="Unread" />
                        ) : (
                          <span className="rounded-lg bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                            Seen
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(alert.id, alert.who)}
                        title="Delete Alert"
                        aria-label="Delete alert"
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-950 dark:text-slate-100 leading-relaxed">{alert.body}</p>
                    <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-800 dark:text-slate-300">{alert.meta || alert.time}</p>
                  </div>
                </div>

                {alert.timeline && alert.timeline.length > 0 && (
                  <div className="glass-surface mt-4 rounded-2xl border border-orange-500/30 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-500 dark:text-orange-400">
                      Timeline evidence
                    </p>
                    <ol className="mt-2 space-y-1.5">
                      {alert.timeline.map((entry, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                          <span className="w-16 shrink-0 font-semibold tabular-nums text-navy dark:text-white">
                            {entry.at}
                          </span>
                          <span className="h-px w-6 bg-slate-400/30" aria-hidden="true" />
                          <span>{entry.what}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {alert.detection && (
                  <div className="glass-surface mt-4 flex gap-2.5 rounded-2xl p-4">
                    <BotIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Auto-detected
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{alert.detection}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {alert.actions.map((action) => {
                      const isSeenAction = action === 'Mark Seen';
                      if (isSeenAction && !isUnread) {
                        return (
                          <span key={action} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                            Seen
                          </span>
                        );
                      }
                      return (
                        <Button
                          key={action}
                          size="sm"
                          variant={
                            action.startsWith('View') || action === 'Review Logs'
                              ? 'primary'
                              : action === 'Reject All'
                              ? 'danger'
                              : 'secondary'
                          }
                          icon={
                            action.startsWith('View') || action === 'Review Logs' ? (
                              <EyeIcon className="h-3.5 w-3.5" />
                            ) : (
                              actionIcon[action]
                            )
                          }
                          onClick={() => act(alert, action)}
                        >
                          {action}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(alert.id, alert.who)}
                    icon={<Trash2Icon className="h-3.5 w-3.5 text-rose-500" />}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}

          {visible.length === 0 && (
            <li className="glass-card rounded-3xl p-10 text-center shadow-glass">
              <BotIcon className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-navy dark:text-white">No alerts in this view</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Automated detection runs through the workday — new alerts appear here instantly.
              </p>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
