import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrophyIcon,
  FlameIcon,
  RocketIcon,
  CheckCheckIcon,
  SunriseIcon,
  MoonIcon,
  ShieldCheckIcon,
  GitBranchIcon,
  LockIcon,
  SparklesIcon,
  ArrowLeftIcon,
  AwardIcon,
  HelpCircleIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useGamification } from '../../hooks/useLive';
import { GamificationStats, BadgeDefinition } from '../../utils/gamification';
import { AchievementCelebrationModal } from '../../components/developer/AchievementCelebrationModal';

// Helper to render badge icon by name
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

interface BadgeGridProps {
  badges: Array<BadgeDefinition & { unlocked: boolean; unlockedAt: string | null }>;
  onSelectBadge: (badge: BadgeDefinition & { unlocked: boolean; unlockedAt: string | null }) => void;
}

const MemoizedBadgeGrid = React.memo(function BadgeGrid({ badges, onSelectBadge }: BadgeGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => {
        const isSecretLocked = badge.isEasterEgg && !badge.unlocked;

        return (
          <article
            key={badge.id}
            onClick={() => {
              if (badge.unlocked) {
                onSelectBadge(badge);
              }
            }}
            tabIndex={badge.unlocked ? 0 : undefined}
            onKeyDown={(e) => {
              if (badge.unlocked && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelectBadge(badge);
              }
            }}
            className={`glass-card rounded-3xl p-5 sm:p-6 border relative overflow-hidden flex flex-col justify-between shadow-glass group transition-all duration-200 ${
              badge.unlocked
                ? 'border-brand/30 dark:border-brand/40 cursor-pointer hover:-translate-y-1 hover:shadow-xl active:translate-y-0 ring-1 ring-transparent hover:ring-brand/40'
                : 'border-slate-200/80 dark:border-white/10'
            }`}
          >
            {/* Top row: Icon + Status badge */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 transition-transform ${
                    badge.unlocked
                      ? 'bg-brand/15 dark:bg-brand/25 border-brand/30 text-brand dark:text-blue-400 shadow-2xs group-hover:scale-110'
                      : isSecretLocked
                      ? 'bg-purple-500/15 dark:bg-purple-500/20 border-purple-500/25 text-purple-600 dark:text-purple-400'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-300/60 dark:border-white/10 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {badge.unlocked ? (
                    <BadgeIcon name={badge.icon} className="h-6 w-6" />
                  ) : isSecretLocked ? (
                    <HelpCircleIcon className="h-6 w-6" />
                  ) : (
                    <LockIcon className="h-5 w-5" />
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {badge.unlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-2xs group-hover:bg-emerald-500/25">
                      <SparklesIcon className="h-3 w-3" />
                      Unlocked
                    </span>
                  ) : isSecretLocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Secret Easter Egg
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Locked
                    </span>
                  )}
                  <span className="text-[11px] font-black text-brand dark:text-blue-400">
                    +{badge.xpReward} XP
                  </span>
                </div>
              </div>

              {/* Badge Title & Description */}
              <div className="mt-4 space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap group-hover:text-brand dark:group-hover:text-blue-400 transition-colors">
                  <span>{isSecretLocked ? '??? Classified Mission' : badge.title}</span>
                  {badge.isEasterEgg && badge.unlocked && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold uppercase tracking-wide border border-purple-500/30">
                      Easter Egg
                    </span>
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {isSecretLocked
                    ? badge.hint || 'Hidden achievement. Fulfill mystery engineering activities to unlock.'
                    : badge.description}
                </p>
              </div>
            </div>

            {/* Bottom timestamp & celebration hint if unlocked */}
            {badge.unlocked && (
              <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                <span className="group-hover:text-brand dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                  <span>Achievement Unlocked</span>
                  <span className="text-[10px] text-brand dark:text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    (Click to blast 🎉)
                  </span>
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold whitespace-nowrap">
                  {badge.unlockedAt
                    ? new Date(badge.unlockedAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'Unlocked'}
                </span>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
});

export default function DeveloperBadges() {
  const navigate = useNavigate();
  const { data: gamification } = useGamification();
  const stats: GamificationStats | null = gamification;

  const [selectedBadge, setSelectedBadge] = useState<
    (BadgeDefinition & { unlocked: boolean; unlockedAt: string | null }) | null
  >(null);

  const level = stats?.level ?? 1;
  const totalXp = stats?.totalXp ?? 0;
  const streakDays = stats?.streak?.current ?? 0;
  const badges = stats?.badges ?? [];

  const unlockedCount = useMemo(
    () => badges.filter((b) => b.unlocked).length,
    [badges]
  );

  return (
    <>
      {/* 1. FIXED TOP STICKY NAVBAR */}
      <PageHeader
        title="Achievements & Badges"
        subtitle="Level up your engineering career with XP milestones, daily check-in streaks, and hidden easter-egg achievements"
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/developer')}
            icon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back to Dashboard
          </Button>
        }
      />

      {/* 2. SCROLLABLE CONTENT WITH CLEAN PADDING & MAX-WIDTH CONTAINER */}
      <div className="flex-1 p-5 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
        {/* Summary Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-glass space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>ENGINEER LEVEL</span>
              <AwardIcon className="h-4 w-4 text-brand dark:text-blue-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Level {level}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {stats?.progressPct ?? 0}% towards Level {level + 1}
            </p>
          </div>

          <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-glass space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>TOTAL XP EARNED</span>
              <TrophyIcon className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalXp.toLocaleString()} XP
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Earned from logs, hours & streaks
            </p>
          </div>

          <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-glass space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>EOD DAILY STREAK</span>
              <FlameIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {streakDays} Day{streakDays === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Longest streak: {stats?.streak?.longest ?? streakDays} days
            </p>
          </div>

          <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-glass space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>BADGES UNLOCKED</span>
              <SparklesIcon className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {unlockedCount} / {badges.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {Math.round((unlockedCount / (badges.length || 1)) * 100)}% achievements unlocked
            </p>
          </div>
        </div>

        {/* Section Header Card */}
        <div className="glass-card rounded-2xl px-5 py-3.5 shadow-glass flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              All Engineering Badges
            </h2>
            <span className="rounded-full bg-brand/10 dark:bg-brand/20 text-brand dark:text-blue-400 px-2.5 py-0.5 text-xs font-bold border border-brand/20">
              {badges.length} Missions
            </span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Click any unlocked badge to celebrate! 🎉
          </span>
        </div>

        {/* Badges Grid Section */}
        <MemoizedBadgeGrid
          badges={badges}
          onSelectBadge={(badge) => setSelectedBadge(badge)}
        />
      </div>

      {/* Achievement Celebration Modal with Color Blast Confetti */}
      <AchievementCelebrationModal
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </>
  );
}
