import React, { useEffect } from 'react';
import {
  XIcon,
  SparklesIcon,
  TrophyIcon,
  FlameIcon,
  RocketIcon,
  CheckCheckIcon,
  SunriseIcon,
  MoonIcon,
  ShieldCheckIcon,
  GitBranchIcon,
  AwardIcon,
  QuoteIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { BadgeDefinition, triggerConfettiBurst } from '../../utils/gamification';

function BadgeIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'RocketIcon':
      return <RocketIcon className={className} />;
    case 'FlameIcon':
      return <FlameIcon className={className} />;
    case 'CheckCheckIcon':
      return <CheckCheckIcon className={className} />;
    case 'SunriseIcon':
      return <SunriseIcon className={className} />;
    case 'MoonIcon':
      return <MoonIcon className={className} />;
    case 'ShieldCheckIcon':
      return <ShieldCheckIcon className={className} />;
    case 'GitBranchIcon':
      return <GitBranchIcon className={className} />;
    default:
      return <AwardIcon className={className} />;
  }
}

interface AchievementCelebrationModalProps {
  badge: (BadgeDefinition & { unlocked: boolean; unlockedAt: string | null }) | null;
  onClose: () => void;
}

export function AchievementCelebrationModal({ badge, onClose }: AchievementCelebrationModalProps) {
  useEffect(() => {
    if (badge && badge.unlocked) {
      // Color blast! Double burst for celebration
      triggerConfettiBurst();
      const secondBurst = setTimeout(() => {
        triggerConfettiBurst();
      }, 250);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(secondBurst);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [badge, onClose]);

  if (!badge) return null;

  const formattedDate = badge.unlockedAt
    ? new Date(badge.unlockedAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Unlocked';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/20 shadow-2xl relative overflow-hidden text-center transition-transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close celebration popup"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {/* Celebratory Banner */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-4 shadow-2xs">
          <SparklesIcon className="h-3.5 w-3.5" />
          <span>Achievement Unlocked!</span>
        </div>

        {/* Big Animated Badge Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/15 dark:bg-brand/25 border-2 border-brand/40 text-brand dark:text-blue-400 shadow-glass">
          <BadgeIcon name={badge.icon} className="h-10 w-10" />
        </div>

        {/* Title & XP */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-4 tracking-tight">
          {badge.title}
        </h3>

        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="rounded-full bg-brand/10 dark:bg-brand/20 text-brand dark:text-blue-400 px-3 py-0.5 text-xs font-black border border-brand/25">
            +{badge.xpReward} XP Earned
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            • {formattedDate}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {badge.description}
        </p>

        {/* Motivation Card */}
        {badge.motivation && (
          <div className="mt-5 p-4 rounded-2xl bg-brand/5 dark:bg-brand/10 border border-brand/20 dark:border-brand/30 text-left shadow-2xs">
            <div className="flex items-start gap-2.5">
              <QuoteIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Engineering Motivation
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  &ldquo;{badge.motivation}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 flex flex-col gap-2">
          <Button
            size="md"
            onClick={onClose}
            className="w-full justify-center text-sm font-bold shadow-glass cursor-pointer"
          >
            Keep Building 🚀
          </Button>
        </div>
      </div>
    </div>
  );
}

