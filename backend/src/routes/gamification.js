const express = require('express');
const { WorkLog, Commit, EodReport, User } = require('../models');
const { authRequired, attachUser, ah } = require('../middleware/auth');
const { GAMIFICATION_CONFIG, calculateLevel } = require('../config/gamification');

const router = express.Router();
router.use(authRequired, attachUser);

const BADGE_CRITERIA = [
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

// Helper to reliably parse date from item (WorkLog, Commit, EodReport)
function parseItemDate(item) {
  if (!item) return new Date();
  if (item.submittedAt) return new Date(item.submittedAt);
  if (item.committedAt) return new Date(item.committedAt);
  if (item.date) {
    const parts = String(item.date).split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    }
    return new Date(item.date);
  }
  if (item.createdAt) return new Date(item.createdAt);
  return new Date();
}

// Helper to compute consecutive EOD streaks
function computeStreak(dates = []) {
  if (!dates || dates.length === 0) return { current: 0, longest: 0 };
  const sorted = Array.from(new Set(dates)).sort();
  const dateSet = new Set(sorted);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let current = 0;
  let cursor = dateSet.has(todayStr) ? new Date(now) : dateSet.has(yesterdayStr) ? yesterday : null;

  if (cursor) {
    while (true) {
      const dStr = cursor.toISOString().slice(0, 10);
      if (dateSet.has(dStr)) {
        current++;
        cursor.setDate(cursor.getDate() - 1);
        // Skip weekend gaps if standard 5-day week
        if (cursor.getDay() === 0) cursor.setDate(cursor.getDate() - 2); // Sun -> Fri
        else if (cursor.getDay() === 6) cursor.setDate(cursor.getDate() - 1); // Sat -> Fri
      } else {
        break;
      }
    }
  }

  // Calculate longest historical streak
  let longest = Math.max(current, sorted.length > 0 ? 1 : 0);
  let tempStreak = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1 || (prev.getDay() === 5 && curr.getDay() === 1 && diffDays <= 3)) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longest) longest = tempStreak;
  }

  return { current, longest };
}

// Helper to compute the exact historical date when a badge criterion was achieved
function resolveActualUnlockDate(badgeId, { sortedLogs, eods, commits }) {
  if (!sortedLogs || sortedLogs.length === 0) return new Date();

  switch (badgeId) {
    case 'first_log': {
      // First log ever submitted in DevTrack
      return parseItemDate(sortedLogs[0]);
    }
    case 'zero_pending': {
      // At the point of 3rd log (or the log where pending revisions were cleared)
      const targetIndex = Math.min(2, sortedLogs.length - 1);
      return parseItemDate(sortedLogs[targetIndex]);
    }
    case 'early_bird': {
      // The earliest morning check-in before 8:30 AM
      const match = sortedLogs.find((l) => {
        if (!l.submittedAt) return false;
        const d = new Date(l.submittedAt);
        return d.getHours() < 8 || (d.getHours() === 8 && d.getMinutes() <= 30);
      });
      return match ? parseItemDate(match) : parseItemDate(sortedLogs[0]);
    }
    case 'night_owl': {
      // The first evening log or commit after 5:00 PM
      const match = sortedLogs.find((l) => {
        if (!l.submittedAt) return false;
        return new Date(l.submittedAt).getHours() >= 17;
      });
      return match ? parseItemDate(match) : parseItemDate(sortedLogs[0]);
    }
    case 'streak_7': {
      // The date of the 7th consecutive EOD report
      if (!eods || eods.length < 7) return new Date();
      const sortedEods = [...eods].sort((a, b) => new Date(a.date) - new Date(b.date));
      let streakCount = 1;
      let streakDate = null;
      for (let i = 1; i < sortedEods.length; i++) {
        const prev = new Date(sortedEods[i - 1].date);
        const curr = new Date(sortedEods[i].date);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1 || (prev.getDay() === 5 && curr.getDay() === 1 && diffDays <= 3)) {
          streakCount++;
          if (streakCount >= 7) {
            streakDate = curr;
            break;
          }
        } else {
          streakCount = 1;
        }
      }
      return streakDate || parseItemDate(sortedEods[Math.min(6, sortedEods.length - 1)]);
    }
    case 'century_club': {
      // The date when cumulative logged hours reached 100 hours
      let cumulativeMinutes = 0;
      for (const log of sortedLogs) {
        cumulativeMinutes += Number(log.activeMinutes) || 0;
        if (cumulativeMinutes >= 6000) {
          return parseItemDate(log);
        }
      }
      return parseItemDate(sortedLogs[sortedLogs.length - 1]);
    }
    case 'speedy_coder': {
      // The date of the 30th commit
      if (!commits || commits.length < 30) return new Date();
      return parseItemDate(commits[29]);
    }
    default:
      return new Date();
  }
}

// GET /api/gamification/stats
router.get('/stats', ah(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch developer work logs, commits, EOD reports
  const [logs, commits, eods, user] = await Promise.all([
    WorkLog.find({ developer: userId }).lean(),
    Commit.find({ developer: userId }).sort({ committedAt: 1, date: 1 }).lean(),
    EodReport.find({ developer: userId }).sort({ date: 1 }).lean(),
    User.findById(userId)
  ]);

  // Sort logs chronologically by submission date/time
  const sortedLogs = [...logs].sort((a, b) => {
    const tA = parseItemDate(a).getTime();
    const tB = parseItemDate(b).getTime();
    return tA - tB;
  });

  const totalLogs = sortedLogs.length;
  const approvedCount = sortedLogs.filter((l) => l.review === 'approved').length;
  const totalMinutes = sortedLogs.reduce((acc, l) => acc + (Number(l.activeMinutes) || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const pendingCount = sortedLogs.filter((l) => l.review === 'changes_requested' || l.status === 'blocked').length;
  const commitsCount = commits.length;

  // Check early bird: submittedAt before 8:30 AM
  const isEarlyBird = sortedLogs.some((l) => {
    if (!l.submittedAt) return false;
    const d = new Date(l.submittedAt);
    return d.getHours() < 8 || (d.getHours() === 8 && d.getMinutes() <= 30);
  });

  // Check night owl: submittedAt after 5:00 PM
  const isNightOwl = sortedLogs.some((l) => {
    if (!l.submittedAt) return false;
    return new Date(l.submittedAt).getHours() >= 17;
  });

  // 2. Streaks
  const eodDates = eods.map((e) => e.date);
  const streak = computeStreak(eodDates);

  // 3. Evaluate Badges Criteria
  const unlockStatus = {
    first_log: totalLogs >= 1,
    streak_7: streak.current >= 7 || streak.longest >= 7,
    zero_pending: totalLogs >= 3 && pendingCount === 0,
    early_bird: isEarlyBird,
    night_owl: isNightOwl,
    century_club: totalHours >= 100,
    speedy_coder: commitsCount >= 30
  };

  let totalBadgeXp = 0;
  const existingBadgesMap = new Map();
  (user?.unlockedBadges || []).forEach((b) => {
    existingBadgesMap.set(b.id, b);
  });

  const badgesList = BADGE_CRITERIA.map((def) => {
    const isUnlocked = Boolean(unlockStatus[def.id]);
    const existing = existingBadgesMap.get(def.id);

    // Compute actual historical milestone unlock date
    let actualUnlockDate = null;
    if (isUnlocked) {
      actualUnlockDate = resolveActualUnlockDate(def.id, { sortedLogs, eods, commits });
      totalBadgeXp += def.xpReward;
    }

    return {
      ...def,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? (actualUnlockDate || (existing ? existing.unlockedAt : new Date())) : null,
      ack: existing ? existing.ack : false
    };
  });

  // Persist / update actual historical dates in User document
  if (user) {
    let hasChanges = false;
    user.unlockedBadges = user.unlockedBadges || [];

    for (const b of badgesList) {
      if (b.unlocked && b.unlockedAt) {
        const found = user.unlockedBadges.find((ub) => ub.id === b.id);
        const resolvedTime = new Date(b.unlockedAt).getTime();

        if (!found) {
          user.unlockedBadges.push({
            id: b.id,
            unlockedAt: b.unlockedAt,
            ack: false
          });
          hasChanges = true;
        } else if (!found.unlockedAt || Math.abs(new Date(found.unlockedAt).getTime() - resolvedTime) > 60000) {
          // Correct existing inaccurate/placeholder date to actual milestone date
          found.unlockedAt = b.unlockedAt;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      user.markModified('unlockedBadges');
      await user.save();
    }
  }

  // 4. Calculate Total XP
  const xpFromHours = Math.round(totalHours * GAMIFICATION_CONFIG.XP_PER_HOUR_LOGGED);
  const xpFromApproved = approvedCount * GAMIFICATION_CONFIG.XP_PER_APPROVED_LOG;
  const xpFromEod = eods.length * GAMIFICATION_CONFIG.XP_PER_EOD;
  const xpFromStreak = streak.current * GAMIFICATION_CONFIG.XP_PER_STREAK_DAY;
  const totalXp = xpFromHours + xpFromApproved + xpFromEod + xpFromStreak + totalBadgeXp;

  const levelInfo = calculateLevel(totalXp);

  // Determine unacknowledged badges to show celebratory toast
  const unacknowledgedBadges = badgesList.filter((b) => b.unlocked && !b.ack);

  res.json({
    ...levelInfo,
    streak: {
      current: streak.current,
      longest: streak.longest
    },
    metrics: {
      totalHours,
      totalLogs,
      approvedCount,
      eodsCount: eods.length,
      commitsCount,
      pendingCount
    },
    badges: badgesList,
    newUnlocks: unacknowledgedBadges
  });
}));

// POST /api/gamification/ack-badge
router.post('/ack-badge', ah(async (req, res) => {
  const userId = req.user._id;
  const { badgeId } = req.body;

  if (!badgeId) {
    return res.status(400).json({ error: 'badgeId is required' });
  }

  const user = await User.findById(userId);
  if (user) {
    user.unlockedBadges = user.unlockedBadges || [];
    const badge = user.unlockedBadges.find((b) => b.id === badgeId);
    if (badge) {
      badge.ack = true;
    } else {
      user.unlockedBadges.push({
        id: badgeId,
        unlockedAt: new Date(),
        ack: true
      });
    }
    user.markModified('unlockedBadges');
    await user.save();
  }

  res.json({ success: true, badgeId });
}));

module.exports = router;
