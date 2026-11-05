import React, { useEffect, useState, useRef } from 'react';
import { TrophyIcon, XIcon, SparklesIcon, CheckIcon } from 'lucide-react';
import { useGamification } from '../../hooks/useLive';
import { triggerConfettiBurst, acknowledgeBadge, BadgeDefinition } from '../../utils/gamification';

export function AchievementToast() {
  const { data: gamification, refetch } = useGamification();
  const [activeUnlock, setActiveUnlock] = useState<BadgeDefinition | null>(null);
  const [visible, setVisible] = useState(false);
  const handledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unacknowledged = gamification?.newUnlocks || [];
    if (unacknowledged.length > 0) {
      const nextBadge = unacknowledged[0];
      if (!handledIdsRef.current.has(nextBadge.id)) {
        handledIdsRef.current.add(nextBadge.id);
        setActiveUnlock(nextBadge);
        setVisible(true);

        // Fire lazy-loaded confetti (respects lite-mode and prefers-reduced-motion)
        triggerConfettiBurst();

        // Auto dismiss after 6 seconds
        const timer = setTimeout(() => {
          handleDismiss(nextBadge.id);
        }, 6000);

        return () => clearTimeout(timer);
      }
    }
  }, [gamification?.newUnlocks]);

  const handleDismiss = async (badgeId: string) => {
    setVisible(false);
    setTimeout(async () => {
      setActiveUnlock(null);
      await acknowledgeBadge(badgeId);
      refetch();
    }, 300);
  };

  if (!activeUnlock) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 max-w-sm w-full transition-all duration-300 ease-out pointer-events-auto ${
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
      }`}
      style={{ willChange: 'transform, opacity' }}
    >
      <div className="glass-strong rounded-2xl p-4 border border-brand/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          {/* Badge Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15 dark:bg-brand/25 border border-brand/30 text-brand dark:text-blue-400">
            <TrophyIcon className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand dark:text-blue-400">
              <SparklesIcon className="h-3 w-3" />
              <span>Achievement Unlocked!</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight truncate">
              {activeUnlock.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {activeUnlock.description}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand/10 dark:bg-brand/20 text-[11px] font-bold text-brand dark:text-blue-400 border border-brand/20">
                +{activeUnlock.xpReward} XP
              </span>
              <button
                onClick={() => handleDismiss(activeUnlock.id)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold hover:opacity-90 transition-opacity ml-auto cursor-pointer"
              >
                <CheckIcon className="h-3 w-3" />
                <span>Claim</span>
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => handleDismiss(activeUnlock.id)}
            aria-label="Close achievement notification"
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

