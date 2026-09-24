import React from 'react';
import { PlayIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

interface ActiveTimerCardProps {
  onLog: () => void;
  activeMinutes: number;
  firstSeen: string | null;
  missed: number;
}

const WORKDAY_MINUTES = 480;

export function ActiveTimerCard({ onLog, activeMinutes, firstSeen, missed }: ActiveTimerCardProps) {
  const pct = Math.min(100, Math.round((activeMinutes / WORKDAY_MINUTES) * 100));
  const h = Math.floor(activeMinutes / 60);
  const m = activeMinutes % 60;

  return (
    <section
      aria-label="Active session timer"
      className="rounded-card border border-blue-100 bg-brand-soft p-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <div className="min-w-[140px]">
          <p className="font-mono text-4xl font-semibold leading-none tracking-tight text-navy">
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
          </p>
          <p className="mt-2 text-xs text-blue-900/70">total active time today</p>
        </div>

        <div className="min-w-[220px] flex-1">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
            <span>Workday progress</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={pct} height="md" label="Workday progress" />
          </div>
          <p className="mt-2 text-xs text-blue-900/70">
            {h}h {String(m).padStart(2, '0')}m of 8h workday
          </p>
        </div>

        <dl className="flex gap-6 text-xs">
          <div>
            <dt className="text-blue-900/70">First seen</dt>
            <dd className="mt-1 font-bold text-navy">{firstSeen || '—'}</dd>
          </div>
          <div>
            <dt className="text-blue-900/70">Missed</dt>
            <dd className={`mt-1 font-bold ${missed ? 'text-danger' : 'text-green-600'}`}>{missed}</dd>
          </div>
        </dl>

        <Button size="lg" onClick={onLog} icon={<PlayIcon className="h-4 w-4" />}>
          Log Work Now
        </Button>
      </div>
    </section>);
}
