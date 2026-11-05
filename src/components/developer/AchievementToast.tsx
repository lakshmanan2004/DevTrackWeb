import React, { useEffect, useState, useRef } from 'react';
import { TrophyIcon, XIcon, SparklesIcon, CheckIcon } from 'lucide-react';
import { useGamification } from '../../hooks/useLive';
import { triggerConfettiBurst, acknowledgeBadge, BadgeDefinition } from '../../utils/gamification';

const STORAGE_KEY = 'devtrack_acked_badges';

function getLocalAcked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function AchievementToast() {
  const { data: gamification, refetch } = useGamification();
  const [activeUnlock, setActiveUnlock] = useState<BadgeDefinition | null>(null);
  const [visible, setVisible] = useState(false);
  const handledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const localAcked = getLocalAcked();
    const unacknowledged = (gamification?.newUnlocks || []).filter(
      (b: BadgeDefinition) => !localAcked.has(b.id) && !handledIdsRef.current.has(b.id)
    );

    if (unacknowledged.length > 0) {
      const nextBadge = unacknowledged[0];
      handledIdsRef.current.add(nextBadge.id);
      setActiveUnlock(nextBadge);
      setVisible(true);

      // Immediately record & acknowledge so it is NEVER spammed again on reload or page switch
      acknowledgeBadge(nextBadge.id);

      // Fire celebratory confetti (respects lite-mode and prefers-reduced-motion)
      triggerConfettiBurst();

      // Auto dismiss after 6 seconds
      const timer = setTimeout(() => {
        handleDismiss(nextBadge.id);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [gamification?.newUnlocks]);

  const handleDismiss = async (badgeId: string) => {
    setVisible(false);

    // Save to localStorage immediately as a solid persistent guard
    try {
      const localAcked = getLocalAcked();
      localAcked.add(badgeId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(localAcked)));
    } catch (_) {}

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
      <div className="rounded-2xl p-4 sm:p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/15 shadow-[0_20px_50px_rgba(15,23,42,0.2)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.7)] ring-1 ring-blue-500/30 relative overflow-hidden">
        {/* Subtle top ambient indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

        <div className="flex items-start gap-3.5">
          {/* Badge Trophy Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-sm">
            <TrophyIcon className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-[11px] font-bold text-blue-700 dark:text-blue-300 border border-blue-500/20">
                +{activeUnlock.xpReward} XP
              </span>
              <button
                type="button"
                onClick={() => handleDismiss(activeUnlock.id)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all ml-auto shadow-sm cursor-pointer"
              >
                <CheckIcon className="h-3 w-3" />
                <span>Claim</span>
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => handleDismiss(activeUnlock.id)}
            aria-label="Close achievement notification"
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
