// DevTrack Gamification Configuration
// All XP constants, streak bonuses, and level formulas defined in one place.

const GAMIFICATION_CONFIG = {
  XP_PER_EOD: 50,             // Submitting an End of Day report
  XP_PER_HOUR_LOGGED: 10,     // Per active hour logged
  XP_PER_APPROVED_LOG: 25,    // When Team Lead approves a work log
  XP_PER_STREAK_DAY: 15,      // Bonus per consecutive streak day
  LEVEL_DIVISOR: 100,         // level = floor(sqrt(xp / 100)) + 1
};

// Calculate level from total XP
function calculateLevel(totalXp = 0) {
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

module.exports = {
  GAMIFICATION_CONFIG,
  calculateLevel
};

