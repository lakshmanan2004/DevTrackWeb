import React from 'react';
import { SegmentedControl, SegmentedOption } from './SegmentedControl';

export interface FilterOption extends SegmentedOption {}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FilterPills({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: FilterPillsProps) {
  return (
    <SegmentedControl
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      size={size}
      className={className}
    />
  );
}