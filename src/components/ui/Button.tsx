import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'danger' | 'purple';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-[#0077ed] to-[#0062c4] text-white shadow-glass-button hover:from-[#1a88ff] hover:to-[#006be0] border border-white/30 dark:border-white/20 shadow-md',
  secondary:
    'bg-white/75 hover:bg-white/95 text-slate-800 border border-white/90 backdrop-blur-md shadow-xs hover:shadow-md hover:border-white dark:bg-slate-800/85 dark:hover:bg-slate-700/95 dark:text-slate-100 dark:border-white/15 dark:hover:border-white/30 dark:shadow-glass',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 border border-transparent dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
  outline:
    'bg-white/50 hover:bg-white/80 text-slate-800 border border-slate-200/80 backdrop-blur-sm shadow-2xs hover:shadow-xs dark:bg-slate-900/60 dark:hover:bg-slate-800/80 dark:text-slate-200 dark:border-white/20 dark:hover:border-blue-400/40 dark:hover:text-white',
  success:
    'bg-gradient-to-b from-[#34c759] to-[#28a745] text-white shadow-sm hover:from-[#3cd665] hover:to-[#2cb04b] border border-white/30 shadow-emerald-500/25',
  danger:
    'bg-gradient-to-b from-[#ff3b30] to-[#e0241b] text-white shadow-sm hover:from-[#ff5147] hover:to-[#eb2b22] border border-white/30 shadow-red-500/25',
  purple:
    'bg-gradient-to-b from-[#af52de] to-[#9333ea] text-white shadow-sm hover:from-[#ba64e4] hover:to-[#9d3bed] border border-white/30 shadow-purple-500/25'
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
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 cursor-pointer ${
        variants[variant]
      } ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}