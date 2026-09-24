import React, { useState } from 'react';
import {
  AlarmClockIcon,
  CheckCircle2Icon,
  FileTextIcon,
  XCircleIcon } from
'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FilterPills } from '../../components/ui/FilterPills';
import { Button } from '../../components/ui/Button';
import { useAlerts } from '../../hooks/useLive';
import { DevAlert } from '../../types';
import { api } from '../../api/client';

const kindMeta: Record<
  DevAlert['kind'],
  {icon: React.ReactNode;wrap: string;iconWrap: string;label: string;}> =
{
  reminder: {
    icon: <AlarmClockIcon className="h-4 w-4" />,
    wrap: 'border-amber-200 bg-warn-soft',
    iconWrap: 'bg-warn/15 text-amber-600',
    label: 'Reminder'
  },
  approval: {
    icon: <CheckCircle2Icon className="h-4 w-4" />,
    wrap: 'border-green-200 bg-ok-soft',
    iconWrap: 'bg-ok/15 text-green-600',
    label: 'Approval'
  },
  rejection: {
    icon: <XCircleIcon className="h-4 w-4" />,
    wrap: 'border-red-200 bg-danger-soft',
    iconWrap: 'bg-danger/15 text-danger',
    label: 'Rejection'
  },
  eod: {
    icon: <FileTextIcon className="h-4 w-4" />,
    wrap: 'border-hairline bg-white',
    iconWrap: 'bg-gray-100 text-gray-500',
    label: 'EOD'
  }
};

export function DeveloperAlerts() {
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
  };

  return (
    <>
      <PageHeader
        title="My Alerts"
        subtitle="Your notifications only — no other developer can see these"
        actions={
          alerts.some((a: DevAlert) => a.unread) ? (
            <Button variant="secondary" size="sm" onClick={markAllRead}>Mark all read</Button>
          ) : undefined
        } />


      <div className="flex-1 space-y-5 p-6">
        <FilterPills
          ariaLabel="Filter alerts"
          value={filter}
          onChange={setFilter}
          options={[
          { id: 'all', label: 'All', count: alerts.length },
          { id: 'unread', label: 'Unread', count: alerts.filter((a: DevAlert) => a.unread).length },
          { id: 'reminders', label: 'Reminders' },
          { id: 'rejections', label: 'Rejections' },
          { id: 'approvals', label: 'Approvals' }]
          } />


        <ul className="space-y-3">
          {visible.map((alert: DevAlert) => {
            const meta = kindMeta[alert.kind] || kindMeta.reminder;
            return (
              <li
                key={alert.id}
                className={`flex flex-wrap items-center gap-4 rounded-card border p-4 shadow-card ${
                alert.unread ? meta.wrap : 'border-hairline bg-white'}`
                }>
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconWrap}`}>
                  {meta.icon}
                </span>
                <div className="min-w-[200px] flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-navy">{alert.title}</h2>
                    {alert.unread &&
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-label="Unread" />
                    }
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{alert.body}</p>
                  <p className="mt-1 text-xs text-gray-400">{alert.time}</p>
                </div>
                {alert.unread ?
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    await api(`/api/alerts/${alert.id}/action`, { method: 'POST', body: { action: 'Mark Seen' } });
                    refetch();
                  }}>
                    Mark Seen
                  </Button> :

                <span className="text-xs font-semibold text-gray-400">Seen</span>
                }
              </li>);
          })}
          {alerts.length === 0 && (
            <li className="rounded-card border border-hairline bg-white p-10 text-center">
              <p className="text-sm font-semibold text-navy">No alerts yet</p>
              <p className="mt-1 text-xs text-gray-500">Reminders, approvals and rejections will appear here in real time.</p>
            </li>
          )}
        </ul>
      </div>
    </>);

}
