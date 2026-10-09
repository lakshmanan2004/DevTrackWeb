import React, { useState } from 'react';
import {
  BellIcon,
  AlertTriangleIcon,
  UserXIcon,
  SendIcon,
  PlusIcon,
  CheckCircle2Icon,
  CheckCheckIcon,
  Trash2Icon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FilterPills } from '../../components/ui/FilterPills';
import { AssignTaskModal } from '../../components/common/AssignTaskModal';
import { useAlerts, useLive } from '../../hooks/useLive';
import { api } from '../../api/client';

export function ManagerAlerts() {
  const { data, refetch } = useAlerts();
  const { data: dir } = useLive<{ users: any[] }>('/api/directory', [], 0);
  const devOptions = (dir?.users || [])
    .filter((u: any) => u.role === 'developer')
    .map((u: any) => ({ id: u.id, name: u.name, team: u.teamName, project: '' }));
  const alerts = data?.alerts || [];
  const [filter, setFilter] = useState('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetDevId, setTargetDevId] = useState<string | undefined>();
  const [toastMessage, setToastMessage] = useState('');

  const unreadCount = alerts.filter((a: any) => a.unread).length;

  const handleDismiss = async (id: string) => {
    await api(`/api/alerts/${id}/action`, { method: 'POST', body: { action: 'Mark Seen' } });
    refetch();
  };

  const handleDelete = async (id: string) => {
    await api(`/api/alerts/${id}`, { method: 'DELETE' });
    refetch();
    setToastMessage('Alert deleted.');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleMarkAllRead = async () => {
    if (!unreadCount) return;
    await api('/api/alerts/read-all', { method: 'POST' });
    refetch();
    setToastMessage('All alerts marked as read.');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleClearAll = async () => {
    if (!alerts.length) return;
    await api('/api/alerts/clear-all', { method: 'DELETE' });
    refetch();
    setToastMessage('All alerts cleared.');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSendPing = async (alert: any) => {
    await api(`/api/alerts/${alert.id}/action`, { method: 'POST', body: { action: 'Send Reminder' } });
    setToastMessage(`Ping & reminder notification sent to ${alert.who}!`);
    setTimeout(() => setToastMessage(''), 2500);
    refetch();
  };

  const filteredAlerts = filter === 'all'
    ? alerts
    : filter === 'idle'
    ? alerts.filter((a: any) => a.category === 'Idle')
    : alerts.filter((a: any) => a.category === 'Missed Check-in');

  return (
    <>
      <PageHeader
        title="Developer Idle Alerts"
        subtitle="Real-time activity monitoring & alerts for your projects"
        actions={
          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                icon={<CheckCheckIcon className="h-3.5 w-3.5 text-brand dark:text-indigo-400" />}
              >
                Mark All as Read
              </Button>
            )}
            {alerts.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
                icon={<Trash2Icon className="h-3.5 w-3.5 text-rose-500" />}
              >
                Clear All
              </Button>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
              <BellIcon className="h-3.5 w-3.5" />
              {unreadCount} Active Alerts
            </span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-5 p-6">
        <Banner tone="yellow" icon={<AlertTriangleIcon className="h-4 w-4 text-amber-500" />}>
          Automated session heartbeats detect when developers are idle or miss check-ins. You can ping developers or assign tasks directly — they receive it instantly.
        </Banner>

        {toastMessage && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-600/90 p-3.5 text-xs font-bold text-white shadow-glass backdrop-blur-md animate-in fade-in">
            <CheckCircle2Icon className="h-4 w-4" />
            {toastMessage}
          </div>
        )}

        <FilterPills
          ariaLabel="Filter alerts"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All Alerts', count: alerts.length },
            { id: 'idle', label: 'Idle Developers', count: alerts.filter((a: any) => a.category === 'Idle').length },
            { id: 'missed', label: 'Missed Check-ins', count: alerts.filter((a: any) => a.category === 'Missed Check-in').length }
          ]}
        />

        <div className="space-y-4">
          {filteredAlerts.map((alert: any) => {
            const isUnread = alert.unread;
            const isIdle = alert.category === 'Idle';
            const accentBorder = isUnread
              ? (isIdle ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-rose-500')
              : 'border-l-4 border-l-slate-400/40 dark:border-l-slate-600/40';
            const iconStyle = isUnread
              ? (isIdle
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30')
              : (isIdle
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20');

            return (
              <div
                key={alert.id}
                className={`glass-card rounded-3xl p-5 shadow-glass transition-all hover:shadow-xl ${accentBorder}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ${iconStyle}`}>
                      <UserXIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white tracking-tight leading-snug">{alert.who} — {alert.category}</h3>
                        <Badge tone={isIdle ? 'amber' : 'red'}>
                          {isIdle ? `Idle ${alert.idleTime}` : 'Critical'}
                        </Badge>
                        {isUnread ? (
                          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-indigo-400 shadow-sm animate-pulse" aria-label="Unread" />
                        ) : (
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 backdrop-blur-md">
                            Seen
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-800 dark:text-slate-300">
                        {alert.meta || alert.time} · Last Active: {alert.lastActive || 'unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Pushed via Socket.IO</span>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      title="Delete Alert"
                      aria-label="Delete Alert"
                      className="rounded-xl p-2 text-slate-500 dark:text-slate-300 hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              <p className="glass-surface mt-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 p-3.5 rounded-2xl">
                <span className="font-bold text-navy dark:text-white">Detection Log:</span> {alert.body}
                {alert.detection ? ` — ${alert.detection}` : ''}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSendPing(alert)}
                    icon={<SendIcon className="h-3.5 w-3.5" />}
                    className="btn-glass-primary !from-indigo-600 !to-violet-600 text-white font-bold border-none"
                  >
                    Send Ping Reminder
                  </Button>
                  <Button
                    size="sm"
                    variant="purple"
                    onClick={() => {
                      setTargetDevId(alert.developerId || undefined);
                      setAssignModalOpen(true);
                    }}
                    icon={<PlusIcon className="h-3.5 w-3.5" />}
                    className="btn-glass-primary !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 text-white font-bold border-none"
                  >
                    Assign Pending Task
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="text-xs font-semibold text-slate-400 hover:text-navy dark:hover:text-white hover:underline transition-colors"
                  >
                    Dismiss Alert
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(alert.id)}
                    icon={<Trash2Icon className="h-3.5 w-3.5 text-rose-500" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
          {filteredAlerts.length === 0 && (
            <div className="glass-card rounded-3xl p-10 text-center shadow-glass">
              <CheckCircle2Icon className="mx-auto h-8 w-8 text-emerald-400" />
              <h3 className="mt-2 text-sm font-bold text-navy dark:text-white">No Active Idle Alerts</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All developers on your managed teams are active or on schedule.</p>
            </div>
          )}
        </div>
      </div>

      <AssignTaskModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        defaultDeveloperId={targetDevId}
        assignerRole="PM"
        assignerName="Project Manager"
        developers={devOptions}
      />
    </>
  );
}
