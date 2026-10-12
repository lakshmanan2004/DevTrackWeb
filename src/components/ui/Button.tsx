import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'danger' | 'purple';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-[#1683FF]/90 to-[#0066DB]/95 text-white shadow-[0_4px_16px_rgba(22,131,255,0.32)] backdrop-blur-md hover:from-[#3595FF] hover:to-[#1683FF] hover:shadow-[0_6px_22px_rgba(22,131,255,0.42)] hover:-translate-y-0.5 border border-white/35 dark:border-white/20',
  secondary:
    'bg-white/50 hover:bg-white/75 text-slate-800 border border-white/60 backdrop-blur-md hover:border-white/85 shadow-2xs hover:shadow-md hover:-translate-y-0.5 dark:!bg-white/[0.08] dark:hover:!bg-white/[0.14] dark:!text-[#F5F5F5] dark:border-white/15 dark:hover:border-white/25 dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 border border-transparent dark:text-slate-200 dark:hover:!bg-white/[0.06] dark:hover:!text-[#F5F5F5] dark:hover:border-white/10 dark:hover:-translate-y-0.5',
  outline:
    'bg-white/40 hover:bg-white/70 text-slate-800 border border-white/50 backdrop-blur-md hover:border-white/70 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 dark:!bg-white/[0.04] dark:hover:!bg-white/[0.10] dark:text-[#F5F5F5] dark:border-white/12 dark:hover:border-white/25 dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)]',
  success:
    'bg-gradient-to-b from-[#34c759] to-[#28a745] text-white shadow-sm hover:from-[#3cd665] hover:to-[#2cb04b] hover:shadow-md hover:shadow-emerald-500/35 hover:-translate-y-0.5 border border-white/30 shadow-emerald-500/25',
  danger:
    'bg-gradient-to-b from-[#ff3b30] to-[#e0241b] text-white shadow-sm hover:from-[#ff5147] hover:to-[#eb2b22] hover:shadow-md hover:shadow-red-500/35 hover:-translate-y-0.5 border border-white/30 shadow-red-500/25',
  purple:
    'bg-gradient-to-b from-[#af52de] to-[#9333ea] text-white shadow-sm hover:from-[#ba64e4] hover:to-[#9d3bed] hover:shadow-md hover:shadow-purple-500/35 hover:-translate-y-0.5 border border-white/30 shadow-purple-500/25'
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs font-semibold rounded-xl whitespace-nowrap w-auto',
  md: 'h-10 px-5 text-xs font-bold rounded-xl whitespace-nowrap w-auto',
  lg: 'h-11 px-6 text-sm font-bold rounded-xl whitespace-nowrap w-auto'
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
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 cursor-pointer ${
        variants[variant]
      } ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}