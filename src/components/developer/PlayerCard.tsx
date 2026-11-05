import React from 'react';
import { Link } from 'react-router-dom';
import { FlameIcon, TrophyIcon, ChevronRightIcon, AwardIcon } from 'lucide-react';
import { useGamification } from '../../hooks/useLive';
import { GamificationStats } from '../../utils/gamification';

export const PlayerCard = React.memo(function PlayerCard() {
  const { data: gamification } = useGamification();

  const stats: GamificationStats | null = gamification;

  const level = stats?.level ?? 1;
  const progressPct = stats?.progressPct ?? 0;
  const totalXp = stats?.totalXp ?? 0;
  const xpInCurrentLevel = stats?.xpInCurrentLevel ?? 0;
  const xpNeededForNextLevel = stats?.xpNeededForNextLevel ?? 100;
  const streakDays = stats?.streak?.current ?? 0;
  const unlockedBadges = (stats?.badges || []).filter((b) => b.unlocked);

  return (
    <section className="glass-card rounded-3xl p-6 sm:p-7 shadow-glass relative overflow-hidden transition-all">
      <div className="flex flex-wrap items-center justify-between gap-5 relative z-10">
        {/* Left: Player Profile & Level */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 dark:bg-[rgba(22,131,255,0.16)] border border-brand/20 dark:border-[rgba(22,131,255,0.35)] text-brand dark:text-[#5AA9FF] font-black text-xl shadow-glass">
            <span>L{level}</span>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/80 dark:bg-slate-100 text-[10px] text-white dark:text-slate-900 font-bold border border-white/20 shadow-2xs">
              <AwardIcon className="h-3 w-3" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-[#F5F5F5] tracking-tight">
                Engineering Flight Deck
              </h3>
              <span className="rounded-full bg-brand/10 dark:bg-[rgba(22,131,255,0.16)] px-2.5 py-0.5 text-[11px] font-extrabold text-brand dark:text-[#5AA9FF] border border-brand/20 dark:border-[rgba(22,131,255,0.35)] shadow-2xs">
                Level {level} Engineer
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-[#A1A1AA] mt-1">
              {totalXp.toLocaleString()} XP Earned · {xpInCurrentLevel} / {xpNeededForNextLevel} XP to Level {level + 1}
            </p>
          </div>
        </div>

        {/* Right: Streak & Badges summary */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Calm Daily Streak Counter (no glow) */}
          <div
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-glass"
            title={`${streakDays} consecutive day${streakDays === 1 ? '' : 's'} with submitted EOD report`}
          >
            <FlameIcon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tight leading-none">
                {streakDays} Day{streakDays === 1 ? '' : 's'}
              </span>
              <span className="text-[10px] font-medium opacity-80 leading-none mt-0.5">
                EOD Streak
              </span>
            </div>
          </div>

          {/* Quick Badges Link */}
          <Link
            to="/developer/badges"
            className="glass-subcard inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-900/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-glass transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <TrophyIcon className="h-4 w-4 text-brand dark:text-[#5AA9FF]" />
            <span>Badges ({unlockedBadges.length})</span>
            <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* XP Bar (Transform ScaleX Only - Strictly GPU Accelerated) */}
      <div className="mt-5 pt-3.5 border-t border-slate-200/60 dark:border-white/10 relative z-10">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-[#A1A1AA] mb-2">
          <span>Level Progress</span>
          <span>{progressPct}% ({xpNeededForNextLevel - xpInCurrentLevel} XP to Level {level + 1})</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden relative border border-slate-300/40 dark:border-white/5">
          <div
            className="h-full w-full bg-brand dark:bg-blue-500 origin-left transition-transform duration-500 ease-out will-change-transform rounded-full shadow-2xs"
            style={{
              transform: `scaleX(${Math.max(0, Math.min(100, progressPct)) / 100})`
            }}
          />
        </div>
      </div>

      {/* Latest Unlocked Badges Preview */}
      {unlockedBadges.length > 0 && (
        <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar relative z-10">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
            Recent:
          </span>
          {unlockedBadges.slice(-3).reverse().map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 shadow-2xs"
              title={badge.description}
            >
              <span className="text-xs">🎖️</span>
              <span className="font-semibold">{badge.title}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
});
