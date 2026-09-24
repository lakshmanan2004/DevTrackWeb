import React, { useEffect, useState } from 'react';
import { ActivityIcon, BellIcon, BellRingIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAlerts } from '../../hooks/useLive';
import { onSocketEvent } from '../../api/socket';

interface BrowserNotificationPermissionValue {
  denied: boolean;
  granted: boolean;
  default: boolean;
}

// Live reminder card backed by real alerts + real browser notifications.
export function RealtimeAlertsCard() {
  const { data, refetch } = useAlerts();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const alerts = (data?.alerts || []).filter(
    (a: any) => a.unread && (a.kind === 'reminder' || a.kind === 'eod' || a.kind === 'rejection' || a.kind === 'approval')
  );

  // Real browser notifications when an alert arrives over the socket.
  useEffect(() => {
    const off = onSocketEvent('alert:new', () => {
      refetch();
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        // give the refetch a moment, then surface the newest unread alert
        setTimeout(async () => {
          try {
            const token = localStorage.getItem('devtrack_token');
            const res = await fetch('/api/alerts', {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const json = await res.json();
            const newest = (json.alerts || []).find((a: any) => a.unread);
            if (newest) {
              new Notification('DevTrack — ' + newest.title, {
                body: newest.body || 'You have a new alert in DevTrack',
                icon: '/vite.svg'
              });
            }
          } catch {
            /* notification is best-effort */
          }
        }, 600);
      }
    });
    return off;
  }, [refetch]);

  const enable = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification('DevTrack reminders enabled', {
        body: 'You will get a browser reminder before each check-in is due.'
      });
    }
  };

  const permState: BrowserNotificationPermissionValue = {
    denied: permission === 'denied',
    granted: permission === 'granted',
    default: permission === 'default'
  };

  return (
    <section
      aria-label="Real-time reminders"
      className="rounded-card border border-hairline bg-white p-5 shadow-card">

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-navy">Live reminders</h2>
          <p className="mt-1 text-xs text-gray-500">
            Check-in reminders, approvals and rejections — pushed in real time.
          </p>
        </div>
        {permState.granted ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1.5 text-xs font-bold text-green-700">
            <BellRingIcon className="h-3.5 w-3.5" /> Browser on
          </span>
        ) : permState.denied || permState.default ? (
          <Button size="sm" variant="secondary" onClick={enable} icon={<BellIcon className="h-3.5 w-3.5" />}>
            Enable browser reminders
          </Button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2.5">
        {alerts.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas p-3.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-soft">
              <ActivityIcon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            </span>
            <p className="text-xs text-gray-500">
              No active reminders right now — you are all caught up.
            </p>
          </div>
        )}
        {alerts.slice(0, 3).map((alert: any) => (
          <div
            key={alert.id}
            className={`rounded-lg border p-3.5 ${
              alert.kind === 'rejection'
                ? 'border-red-200 bg-danger-soft'
                : alert.kind === 'approval'
                ? 'border-green-200 bg-ok-soft'
                : 'border-amber-200 bg-warn-soft'
            }`}>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-navy">{alert.title}</p>
              <span className="ml-auto text-[11px] text-gray-500">{alert.time}</span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-gray-800">{alert.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-hairline pt-3 text-xs leading-relaxed text-gray-500">
        {permission === 'granted'
          ? 'Browser notifications are on — they appear even when this tab is in the background.'
          : 'Enable browser reminders to get notified even when the DevTrack tab is in the background.'}
      </p>
    </section>);
}
