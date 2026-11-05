// DevTrack Gamification Configuration
// All XP constants, streak bonuses, and level formulas defined in one place.

export const GAMIFICATION_CONFIG = {
  XP_PER_EOD: 50,             // Submitting an End of Day report
  XP_PER_HOUR_LOGGED: 10,     // Per active hour logged
  XP_PER_APPROVED_LOG: 25,    // When Team Lead approves a work log
  XP_PER_STREAK_DAY: 15,      // Bonus per consecutive streak day
  LEVEL_DIVISOR: 100,         // level = floor(sqrt(xp / 100)) + 1
} as const;

export interface LevelInfo {
  level: number;
  totalXp: number;
  currentLevelFloorXp: number;
  nextLevelFloorXp: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPct: number;
}

// Calculate level from total XP
export function calculateLevel(totalXp = 0): LevelInfo {
  const xp = Math.max(0, Number(totalXp) || 0);
  const level = Math.floor(Math.sqrt(xp / GAMIFICATION_CONFIG.LEVEL_DIVISOR)) + 1;
  const currentLevelFloorXp = Math.pow(level - 1, 2) * GAMIFICATION_CONFIG.LEVEL_DIVISOR;
  const nextLevelFloorXp = Math.pow(level, 2) * GAMIFICATION_CONFIG.LEVEL_DIVISOR;
  const xpInCurrentLevel = xp - currentLevelFloorXp;
  const xpNeededForNextLevel = nextLevelFloorXp - currentLevelFloorXp;
  const progressPct = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

  return {
    level,
    totalXp: xp,
    currentLevelFloorXp,
    nextLevelFloorXp,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPct
  };
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: 'starter' | 'streak' | 'accuracy' | 'special';
  icon: string;
  isEasterEgg: boolean;
  xpReward: number;
  hint?: string;
  motivation: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_log',
    title: 'First Log',
    description: 'Submitted your very first engineering work log in DevTrack.',
    category: 'starter',
    icon: 'RocketIcon',
    isEasterEgg: false,
    xpReward: 50,
    motivation: 'Every grand architecture begins with a single line of code. You took your first step onto the flight deck—keep the momentum soaring!'
  },
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'Maintained a consecutive 7-day daily EOD streak.',
    category: 'streak',
    icon: 'FlameIcon',
    isEasterEgg: false,
    xpReward: 150,
    motivation: 'Consistency is the bedrock of engineering mastery. Seven straight days of disciplined execution proves your grit. Keep that flame burning!'
  },
  {
    id: 'zero_pending',
    title: 'Zero Pending Logs',
    description: 'Cleared all revisions & pending logs with 100% on-time submissions.',
    category: 'accuracy',
    icon: 'CheckCheckIcon',
    isEasterEgg: false,
    xpReward: 100,
    motivation: 'Precision, discipline, and zero friction. Shipping clean, review-ready engineering work sets the gold standard for the entire team!'
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Checked in or submitted an active morning log before 8:30 AM.',
    category: 'special',
    icon: 'SunriseIcon',
    isEasterEgg: false,
    xpReward: 75,
    motivation: 'The morning sun greets those who build the future. You set the tempo for the day while others were still dreaming. Pure dedication!'
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Shipped a code commit or task update after standard work hours (after 5 PM).',
    category: 'special',
    icon: 'MoonIcon',
    isEasterEgg: true,
    hint: 'Classified mission. Ship code when the sun sets to reveal.',
    xpReward: 120,
    motivation: 'When the world goes quiet, your creative focus comes alive. Shipping solutions under the stars proves true passion for craftsmanship!'
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Completed over 100 active engineering hours logged on project modules.',
    category: 'special',
    icon: 'ShieldCheckIcon',
    isEasterEgg: true,
    hint: 'Classified mission. Build massive engineering flight hours to reveal.',
    xpReward: 200,
    motivation: '100 hours of focused engineering flight time! That is not just time logged—that is architectural expertise etched into real code. Remarkable feat!'
  },
  {
    id: 'speedy_coder',
    title: 'Code Machine',
    description: 'Committed 30 or more git commits across your assigned project repositories.',
    category: 'special',
    icon: 'GitBranchIcon',
    isEasterEgg: true,
    hint: 'Classified mission. Push steady git commits to reveal.',
    xpReward: 150,
    motivation: 'A powerhouse of continuous integration! 30 commits shipped. Your code is the vital heartbeat driving DevTrack forward!'
  }
];
