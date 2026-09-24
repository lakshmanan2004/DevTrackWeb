import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'danger' | 'purple';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-blue-700 border border-transparent',
  secondary: 'bg-white text-navy border border-hairline hover:bg-gray-50',
  ghost: 'bg-transparent text-gray-600 border border-transparent hover:bg-gray-100',
  outline: 'bg-white text-navy border border-hairline hover:bg-gray-50',
  success: 'bg-ok text-white hover:bg-green-600 border border-transparent',
  danger: 'bg-white text-danger border border-red-200 hover:bg-danger-soft',
  purple: 'bg-pm text-white hover:bg-violet-700 border border-transparent'
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-sm'
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${
      variants[variant]} ${
      sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}>
      
      {icon}
      {children}
    </button>);

}