import React, { useState } from 'react';
import {
  AlarmClockIcon,
  CheckCircle2Icon,
  FileTextIcon,
  Trash2Icon,
  XCircleIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FilterPills } from '../../components/ui/FilterPills';
import { Button } from '../../components/ui/Button';
import { useAlerts } from '../../hooks/useLive';
import { DevAlert } from '../../types';
import { api } from '../../api/client';

const kindMeta: Record<
  DevAlert['kind'],
  { icon: React.ReactNode; accentBorder: string; iconWrap: string; seenIconWrap: string; label: string }
> = {
  reminder: {
    icon: <AlarmClockIcon className="h-5 w-5" />,
    accentBorder: 'border-l-4 border-l-amber-500',
    iconWrap: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    seenIconWrap: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    label: 'Reminder'
  },
  approval: {
    icon: <CheckCircle2Icon className="h-5 w-5" />,
    accentBorder: 'border-l-4 border-l-emerald-500',
    iconWrap: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    seenIconWrap: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    label: 'Approval'
  },
  rejection: {
    icon: <XCircleIcon className="h-5 w-5" />,
    accentBorder: 'border-l-4 border-l-rose-500',
    iconWrap: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30',
    seenIconWrap: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    label: 'Rejection'
  },
  eod: {
    icon: <FileTextIcon className="h-5 w-5" />,
    accentBorder: 'border-l-4 border-l-blue-500',
    iconWrap: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30',
    seenIconWrap: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    label: 'EOD'
  }
};

import { useAuth } from '../../context/AuthContext';

export function DeveloperAlerts() {
  const { refresh: refreshAuth } = useAuth();
  const { data, refetch } = useAlerts();
  const alerts: DevAlert[] = data?.alerts || [];
  const [filter, setFilter] = useState('all');

  const visible = alerts.filter((alert: DevAlert) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return alert.unread;
    if (filter === 'reminders') return alert.kind === 'reminder' || alert.kind === 'eod';
    if (filter === 'rejections') return alert.kind === 'rejection';
    return alert.kind === 'approval';
  });

  const markAllRead = async () => {
    await api('/api/alerts/read-all', { method: 'POST' });
    refetch();
    refreshAuth();
  };

  const handleClearAll = async () => {
    if (!alerts.length) return;
    await api('/api/alerts/clear-all', { method: 'DELETE' });
    refetch();
    refreshAuth();
  };

  const handleDelete = async (id: string) => {
    await api(`/api/alerts/${id}`, { method: 'DELETE' });
    refetch();
    refreshAuth();
  };

  return (
    <>
      <PageHeader
        title="My Alerts"
        subtitle="Your notifications only — no other developer can see these"
        actions={
          <div className="flex items-center gap-2">
            {alerts.some((a: DevAlert) => a.unread) && (
              <Button variant="secondary" size="sm" onClick={markAllRead}>Mark all read</Button>
            )}
            {alerts.length > 0 && (
              <Button variant="danger" size="sm" onClick={handleClearAll} icon={<Trash2Icon className="h-3.5 w-3.5" />}>
                Clear All
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-6 sm:p-8">
        <FilterPills
          ariaLabel="Filter alerts"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: alerts.length },
            { id: 'unread', label: 'Unread', count: alerts.filter((a: DevAlert) => a.unread).length },
            { id: 'reminders', label: 'Reminders' },
            { id: 'rejections', label: 'Rejections' },
            { id: 'approvals', label: 'Approvals' }
          ]}
        />

        <ul className="space-y-4">
          {visible.map((alert: DevAlert) => {
            const meta = kindMeta[alert.kind] || kindMeta.reminder;
            return (
              <li
                key={alert.id}
                className={`glass-card flex flex-wrap items-center justify-between gap-5 rounded-3xl p-5 shadow-glass transition-all hover:shadow-xl ${
                  meta.accentBorder
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-[280px]">
                  <span
                    className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
                      alert.unread ? meta.iconWrap : meta.seenIconWrap
                    }`}
                  >
                    {meta.icon}
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white tracking-tight leading-snug">
                        {alert.title}
                      </h2>
                      {alert.unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-indigo-400 shadow-sm animate-pulse" aria-label="Unread" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-950 dark:text-slate-100 leading-relaxed">
                      {alert.body}
                    </p>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-800 dark:text-slate-300 pt-0.5">
                      {alert.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {alert.unread ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="px-4 py-2 text-xs font-bold rounded-xl shadow-md"
                      onClick={async () => {
                        await api(`/api/alerts/${alert.id}/action`, { method: 'POST', body: { action: 'Mark Seen' } });
                        refetch();
                        refreshAuth();
                      }}
                    >
                      Mark Seen
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 backdrop-blur-md">
                      Seen
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(alert.id)}
                    title="Delete Alert"
                    className="rounded-xl p-2 text-slate-500 dark:text-slate-300 hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
          {alerts.length === 0 && (
            <li className="glass-card rounded-3xl p-12 text-center shadow-glass">
              <p className="text-base font-black text-slate-900 dark:text-white">No alerts yet</p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                Reminders, approvals and rejections will appear here in real time.
              </p>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
