import { GAMIFICATION_CONFIG, calculateLevel, BADGE_DEFINITIONS, BadgeDefinition, LevelInfo } from '../config/gamification';
import { api } from '../api/client';

export * from '../config/gamification';

export interface GamificationStats extends LevelInfo {
  streak: {
    current: number;
    longest: number;
  };
  metrics: {
    totalHours: number;
    totalLogs: number;
    approvedCount: number;
    eodsCount: number;
    commitsCount: number;
    pendingCount: number;
  };
  badges: Array<BadgeDefinition & { unlocked: boolean; unlockedAt: string | null; ack?: boolean }>;
  newUnlocks: BadgeDefinition[];
}

/**
 * Lazy-loaded canvas-confetti burst (under 1 second).
 * Completely disabled in Lite mode and when prefers-reduced-motion is active.
 */
export async function triggerConfettiBurst(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Respect Lite Mode
  const isLite = document.documentElement.classList.contains('lite-mode') ||
    localStorage.getItem('devtrack_lite_mode') === 'true';
  if (isLite) {
    return;
  }

  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default || confettiModule;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      ticks: 80, // under 1 second duration
      disableForReducedMotion: true,
      colors: ['#0071e3', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
    });
  } catch (err) {
    // Non-blocking fallback if confetti fails to load
    console.debug('[Confetti skipped]', err);
  }
}

/**
 * Acknowledge badge so the achievement toast won't fire repeatedly
 */
export async function acknowledgeBadge(badgeId: string): Promise<void> {
  try {
    await api.post('/api/gamification/ack-badge', { badgeId });
  } catch (err) {
    console.debug('[Ack badge failed]', err);
  }
}

