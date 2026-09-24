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
        className={`w-full rounded-card border border-gray-200 bg-white p-4 text-left shadow-card transition-colors duration-150 ease-out hover:border-brand ${
        selected ? 'ring-2 ring-brand' : ''}`}>
        
        <div className="flex items-center gap-3">
          <Avatar
            initials={developer.initials} />
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-navy">{developer.name}</p>
              {developer.topPerformer &&
              <StarIcon className="h-3.5 w-3.5 fill-warn text-warn" aria-label="Top performer" />
              }
            </div>
            <p className="mt-0.5 text-xs tabular-nums text-gray-500">
              {developer.logs} logs · {developer.done} done ·{' '}
              <span className={developer.missed > 0 ? 'font-semibold text-danger' : ''}>
                {developer.missed} missed
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3">
          <ProgressBar
            value={pct}
            label={`${developer.name} workday coverage`} />
          
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            Last seen {developer.lastSeen}
            {developer.commits > 0 &&
            <>
                <span aria-hidden="true">·</span>
                <GitCommitVerticalIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {developer.commits} commits
              </>
            }
          </span>
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
            developer.missed > 0 ? 'text-amber-700' : 'text-green-600'}`
            }>
            
            {developer.missed === 0 ?
            <CheckCircle2Icon className="h-3.5 w-3.5" aria-hidden="true" /> :
            <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
            }
            {developer.note}
          </span>
        </div>
      </button>
    </li>);

}