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
                icon: '/Simats-logo.png'
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
      className="glass-card rounded-3xl border border-white/80 p-6 shadow-glass"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
        <div>
          <h2 className="text-sm font-black tracking-tight text-navy">Live Reminders</h2>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Check-in reminders, approvals and rejections — pushed in real time.
          </p>
        </div>
        {permState.granted ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <BellRingIcon className="h-3.5 w-3.5" /> Browser on
          </span>
        ) : permState.denied || permState.default ? (
          <Button size="sm" variant="secondary" onClick={enable} icon={<BellIcon className="h-3.5 w-3.5" />}>
            Enable browser reminders
          </Button>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {alerts.length === 0 && (
          <div className="glass-surface flex items-center gap-3 rounded-2xl border border-white/60 p-4 shadow-2xs">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 border border-brand/20">
              <ActivityIcon className="h-4 w-4 text-brand" aria-hidden="true" />
            </span>
            <p className="text-xs text-slate-500 font-medium">
              No active reminders right now — you are all caught up.
            </p>
          </div>
        )}
        {alerts.slice(0, 3).map((alert: any) => (
          <div
            key={alert.id}
            className={`glass-surface rounded-2xl border p-4 shadow-glass transition-all ${
              alert.kind === 'rejection'
                ? 'border-rose-300/80 bg-rose-50/30'
                : alert.kind === 'approval'
                ? 'border-emerald-300/80 bg-emerald-50/30'
                : 'border-amber-300/80 bg-amber-50/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-navy">{alert.title}</p>
              <span className="ml-auto text-[10px] text-slate-400 font-medium">{alert.time}</span>
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-600 leading-relaxed">{alert.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-slate-200/60 pt-3 text-[11px] leading-relaxed text-slate-400 font-medium">
        {permission === 'granted'
          ? 'Browser notifications are on — they appear even when this tab is in the background.'
          : 'Enable browser reminders to get notified even when the DevTrack tab is in the background.'}
      </p>
    </section>);
}
