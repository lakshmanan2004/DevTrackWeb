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

export function DeveloperCard({ developer, selected, onSelect }: DeveloperCardProps) {
  const pct = Math.round(developer.activeMinutes / 480 * 100);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(developer.id)}
        aria-pressed={selected}
        className={`w-full text-left rounded-3xl p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
          selected
            ? 'glass-card border-brand/50 ring-2 ring-brand/30 shadow-glass-hover bg-white/90 translate-x-1'
            : 'glass-card hover:bg-white/80 hover:shadow-glass hover:translate-x-0.5'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <Avatar initials={developer.initials} size="md" />
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold tracking-tight text-navy">{developer.name}</p>
              {developer.topPerformer && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  <StarIcon className="h-3 w-3 fill-amber-500 text-amber-500" aria-label="Top performer" />
                  Top
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs tabular-nums text-slate-500 font-medium">
              {developer.logs} logs · {developer.done} done ·{' '}
              <span className={developer.missed > 0 ? 'font-bold text-rose-600' : 'text-slate-500'}>
                {developer.missed} missed
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3.5">
          <ProgressBar
            value={pct}
            label={`${developer.name} workday coverage`}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-medium">
            Last seen {developer.lastSeen}
            {developer.commits > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <GitCommitVerticalIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span className="font-semibold text-navy">{developer.commits} commits</span>
              </>
            )}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 font-semibold text-xs ${
              developer.missed > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {developer.missed === 0 ? (
              <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            ) : (
              <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            )}
            {developer.note}
          </span>
        </div>
      </button>
    </li>
  );
}