import React from 'react';

interface ProgressBarProps {
  value: number;
  tone?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  height?: 'sm' | 'md';
  label?: string;
}

const tones = {
  blue: 'bg-brand',
  green: 'bg-ok',
  yellow: 'bg-warn',
  red: 'bg-danger',
  purple: 'bg-pm'
};

export function ProgressBar({ value, tone = 'blue', height = 'sm', label }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full overflow-hidden rounded-full bg-gray-100 ${height === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
      
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-out ${tones[tone]}`}
        style={{ width: `${value}%` }} />
      
    </div>);

}