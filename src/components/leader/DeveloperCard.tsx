import React from 'react';
import { AlertTriangleIcon, CheckCircle2Icon, GitCommitVerticalIcon, StarIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ProgressBar } from '../ui/ProgressBar';
import { Developer } from '../../types';

interface DeveloperCardProps {
  developer: Developer;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const DeveloperCard = React.memo(function DeveloperCard({ developer, selected, onSelect }: DeveloperCardProps) {
  const pct = Math.round(developer.activeMinutes / 480 * 100);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(developer.id)}
        aria-pressed={selected}
        className={`w-full text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
          selected
            ? 'glass-card border-brand/50 ring-2 ring-brand/40 shadow-glass-hover bg-brand/10 dark:bg-brand/20 translate-x-0.5'
            : 'bg-white/60 dark:bg-white/5 border border-hairline hover:bg-white/90 dark:hover:bg-white/10 hover:shadow-glass hover:translate-x-0.5'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <Avatar initials={developer.initials} size="md" />
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold tracking-tight text-navy dark:text-white">{developer.name}</p>
              {developer.leave && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300">
                  {developer.leave.type === 'full_day' ? '🌴 Leave' : '⛅ Half-Day'}
                </span>
              )}
              {developer.topPerformer && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300">
                  <StarIcon className="h-3 w-3 fill-amber-500 text-amber-500" aria-label="Top performer" />
                  Top
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs tabular-nums text-slate-600 dark:text-slate-400 font-medium">
              {developer.logs} logs · {developer.done} done ·{' '}
              <span className={developer.missed > 0 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}>
                {developer.missed} missed
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3">
          <ProgressBar
            value={pct}
            label={`${developer.name} workday coverage`}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-medium">
            Last seen {developer.lastSeen}
            {developer.commits > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <GitCommitVerticalIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span className="font-semibold text-navy dark:text-white">{developer.commits} commits</span>
              </>
            )}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 font-bold text-xs ${
              developer.missed > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {developer.missed === 0 ? (
              <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : (
              <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            )}
            {developer.note}
          </span>
        </div>
      </button>
    </li>
  );
});