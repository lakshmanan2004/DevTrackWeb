import React from 'react';
import { PlayIcon, ClockIcon } from 'lucide-react';
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
      className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-glass"
    >
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
        <div className="flex items-center gap-4 min-w-[180px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 shadow-glass text-brand">
            <ClockIcon className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <p className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-navy">
              {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Active Time
            </p>
          </div>
        </div>

        <div className="min-w-[240px] flex-1 max-w-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="tracking-wide uppercase text-[11px] text-slate-500">Workday Target Progress</span>
            <span className="tabular-nums font-mono text-brand font-bold">{pct}%</span>
          </div>
          <div className="mt-2.5">
            <ProgressBar value={pct} height="md" label="Workday progress" />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {h}h {String(m).padStart(2, '0')}m tracked of 8h standard workday
          </p>
        </div>

        <div className="flex items-center gap-6">
          <dl className="flex items-center gap-6 text-xs">
            <div className="rounded-2xl border border-white/80 bg-white/50 backdrop-blur-md px-4 py-2.5 shadow-glass">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">First Seen</dt>
              <dd className="mt-0.5 font-mono font-bold text-navy text-sm">{firstSeen || '—'}</dd>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/50 backdrop-blur-md px-4 py-2.5 shadow-glass">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Missed Slots</dt>
              <dd className={`mt-0.5 font-mono font-bold text-sm ${missed ? 'text-rose-600' : 'text-emerald-600'}`}>
                {missed}
              </dd>
            </div>
          </dl>

          <Button size="lg" onClick={onLog} icon={<PlayIcon className="h-4 w-4 fill-current" />}>
            Log Work Now
          </Button>
        </div>
      </div>
    </section>
  );
}

