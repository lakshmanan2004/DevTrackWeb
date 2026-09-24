import React from 'react';

type PresenceStatus = 'online' | 'offline';

const tones: Record<PresenceStatus, string> = {
  online: 'bg-ok',
  offline: 'bg-offline'
};

export const presenceLabel: Record<PresenceStatus, string> = {
  online: 'Online',
  offline: 'Offline'
};

interface StatusDotProps {
  status: PresenceStatus;
  withLabel?: boolean;
  className?: string;
}

export function StatusDot({ status, withLabel = false, className = '' }: StatusDotProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 ${className}`}>
      <span className={`h-2 w-2 rounded-full ${tones[status]}`} aria-hidden="true" />
      {withLabel && presenceLabel[status]}
      {!withLabel && <span className="sr-only">{presenceLabel[status]}</span>}
    </span>);

}