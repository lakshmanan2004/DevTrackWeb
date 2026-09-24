import React from 'react';

type AvatarTone = 'blue' | 'purple' | 'red' | 'green' | 'grey' | 'amber';

const tones: Record<AvatarTone, string> = {
  blue: 'bg-brand-light text-white',
  purple: 'bg-pm text-white',
  red: 'bg-danger text-white',
  green: 'bg-ok text-white',
  grey: 'bg-offline text-white',
  amber: 'bg-warn text-white'
};

const sizes = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-16 w-16 text-xl'
};

interface AvatarProps {
  initials: string;
  tone?: AvatarTone;
  size?: keyof typeof sizes;
  className?: string;
}

export function Avatar({ initials, tone = 'blue', size = 'md', className = '' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-wide ${tones[tone]} ${sizes[size]} ${className}`}>
      
      {initials}
    </span>);

}