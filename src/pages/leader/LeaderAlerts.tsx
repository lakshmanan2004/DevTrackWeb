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
  XIcon } from
'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Button } from '../../components/ui/Button';
import { FilterPills } from '../../components/ui/FilterPills';
import { useAlerts } from '../../hooks/useLive';
import { LeaderAlert } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const severityShell: Record<string, string> = {
  critical: 'border-red-200 bg-danger-soft',
  warning: 'border-amber-200 bg-warn-soft',
  flag: 'border-orange-200 bg-orange-50',
  seen: 'border-hairline bg-white'
};

const severityIconShell: Record<string, string> = {
  critical: 'bg-danger/15 text-danger',
  warning: 'bg-warn/15 text-amber-600',
  flag: 'bg-orange-500/15 text-orange-600',
  seen: 'bg-gray-100 text-gray-500'
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
        navigate('/leader/developers');
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
        subtitle={`${user?.teamName || 'Team'} · ${user?.projectName || ''}`}
        actions={
          <div className="flex items-center gap-2.5">
            {unread > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                icon={<CheckCheckIcon className="h-3.5 w-3.5 text-brand" />}
              >
                Mark All as Read
              </Button>
            )}
            {leaderAlerts.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
                icon={<Trash2Icon className="h-3.5 w-3.5 text-danger" />}
              >
                Clear All
              </Button>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-danger px-3 py-1.5 text-xs font-bold text-white">
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
          <div className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white shadow-md animate-in fade-in">
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
              : 'border-hairline bg-white/70 opacity-75';
            const iconStyle = isUnread
              ? severityIconShell[alert.severity] || severityIconShell.seen
              : severityIconShell.seen;

            return (
              <li
                key={alert.id}
                className={`relative rounded-card border p-5 shadow-card transition-all ${shellStyle}`}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconStyle}`}
                  >
                    {categoryIcon[alert.category] || <SirenIcon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-navy">{alert.title}</h2>
                        {isUnread ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-label="Unread" />
                        ) : (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Seen
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(alert.id, alert.who)}
                        title="Delete Alert"
                        aria-label="Delete alert"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-danger transition-colors"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-700">{alert.body}</p>
                    <p className="mt-1 text-xs text-gray-500">{alert.meta || alert.time}</p>
                  </div>
                </div>

                {alert.timeline && alert.timeline.length > 0 && (
                  <div className="mt-4 rounded-lg border border-orange-200 bg-white px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                      Timeline evidence
                    </p>
                    <ol className="mt-2 space-y-1.5">
                      {alert.timeline.map((entry, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="w-16 shrink-0 font-semibold tabular-nums text-navy">
                            {entry.at}
                          </span>
                          <span className="h-px w-6 bg-gray-300" aria-hidden="true" />
                          <span>{entry.what}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {alert.detection && (
                  <div className="mt-4 flex gap-2.5 rounded-lg bg-gray-100 px-4 py-3">
                    <BotIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Auto-detected
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">{alert.detection}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hairline/60 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {alert.actions.map((action) => {
                      const isSeenAction = action === 'Mark Seen';
                      if (isSeenAction && !isUnread) {
                        return (
                          <span key={action} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
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
                    icon={<Trash2Icon className="h-3.5 w-3.5 text-danger" />}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}

          {visible.length === 0 && (
            <li className="rounded-card border border-hairline bg-white p-10 text-center">
              <BotIcon className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-semibold text-navy">No alerts in this view</p>
              <p className="mt-1 text-xs text-gray-500">
                Automated detection runs through the workday — new alerts appear here instantly.
              </p>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
