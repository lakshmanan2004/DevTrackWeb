// Work blocks & schedules for DevTrack. Matches frontend schedule definition in src/utils/workBlocks.ts.
const pad = (n) => String(n).padStart(2, '0');

const WORK_BLOCKS_12_LUNCH = [
  {
    slot: 1,
    id: 'morning1',
    label: '8:00 AM – 10:00 AM',
    shortLabel: 'Morning 1',
    displayTitle: 'Morning Sprint 1',
    startHour: 8.0,
    endHour: 10.0,
    durationHours: 2.0,
    maxMinutes: 120,
    defaultMinutes: 100,
    deadlineStr: '10:00 AM',
    graceStr: '10:15 AM'
  },
  {
    slot: 2,
    id: 'morning2',
    label: '10:00 AM – 12:00 PM',
    shortLabel: 'Morning 2',
    displayTitle: 'Morning Sprint 2 (Pre-Lunch)',
    startHour: 10.0,
    endHour: 12.0,
    durationHours: 2.0,
    maxMinutes: 120,
    defaultMinutes: 100,
    deadlineStr: '12:00 PM',
    graceStr: '12:15 PM'
  },
  {
    slot: 3,
    id: 'afternoon1',
    label: '1:00 PM – 3:00 PM',
    shortLabel: 'Afternoon 1',
    displayTitle: 'Afternoon Sprint 1 (Post-Lunch)',
    startHour: 13.0,
    endHour: 15.0,
    durationHours: 2.0,
    maxMinutes: 120,
    defaultMinutes: 100,
    deadlineStr: '3:00 PM',
    graceStr: '3:15 PM'
  },
  {
    slot: 4,
    id: 'afternoon2',
    label: '3:00 PM – 5:00 PM',
    shortLabel: 'Afternoon 2 (EOD)',
    displayTitle: 'Afternoon Sprint 2 (Wrap-Up & Review)',
    startHour: 15.0,
    endHour: 17.0,
    durationHours: 2.0,
    maxMinutes: 120,
    defaultMinutes: 100,
    deadlineStr: '5:00 PM',
    graceStr: '5:15 PM'
  }
];

const LUNCH_BREAK_12 = {
  slot: 0,
  label: '12:00 PM – 1:00 PM',
  shortLabel: 'Lunch Break',
  displayTitle: 'Lunch & Recharge',
  startHour: 12.0,
  endHour: 13.0,
  durationHours: 1.0
};

const WORK_BLOCKS_11_LUNCH = [
  {
    slot: 1,
    id: 'morning',
    label: '8:00 AM – 11:00 AM',
    shortLabel: 'Morning Block',
    displayTitle: 'Morning Sprint (Pre-Lunch)',
    startHour: 8.0,
    endHour: 11.0,
    durationHours: 3.0,
    maxMinutes: 180,
    defaultMinutes: 150,
    deadlineStr: '11:00 AM',
    graceStr: '11:15 AM'
  },
  {
    slot: 2,
    id: 'afternoon1',
    label: '12:00 PM – 2:30 PM',
    shortLabel: 'Afternoon 1',
    displayTitle: 'Afternoon Sprint 1 (Post-Lunch)',
    startHour: 12.0,
    endHour: 14.5,
    durationHours: 2.5,
    maxMinutes: 150,
    defaultMinutes: 120,
    deadlineStr: '2:30 PM',
    graceStr: '2:45 PM'
  },
  {
    slot: 3,
    id: 'afternoon2',
    label: '2:30 PM – 5:00 PM',
    shortLabel: 'Afternoon 2 (EOD)',
    displayTitle: 'Afternoon Sprint 2 (Wrap-Up & Review)',
    startHour: 14.5,
    endHour: 17.0,
    durationHours: 2.5,
    maxMinutes: 150,
    defaultMinutes: 120,
    deadlineStr: '5:00 PM',
    graceStr: '5:15 PM'
  }
];

const LUNCH_BREAK_11 = {
  slot: 0,
  label: '11:00 AM – 12:00 PM',
  shortLabel: 'Lunch Break',
  displayTitle: 'Lunch & Recharge',
  startHour: 11.0,
  endHour: 12.0,
  durationHours: 1.0
};

function getWorkBlocks(lunchSlot = 12) {
  return Number(lunchSlot) === 11 ? WORK_BLOCKS_11_LUNCH : WORK_BLOCKS_12_LUNCH;
}

function getLunchBreak(lunchSlot = 12) {
  return Number(lunchSlot) === 11 ? LUNCH_BREAK_11 : LUNCH_BREAK_12;
}

function isLogForBlock(log, blockSlot, lunchSlot = 12) {
  if (!log) return false;
  const s = Number(log.hourSlot);
  if (s === Number(blockSlot)) return true;

  if (Number(lunchSlot) === 11) {
    if (blockSlot === 1 && (s === 8 || s === 9 || s === 10)) return true;
    if (blockSlot === 2 && (s === 12 || s === 13 || s === 14)) return true;
    if (blockSlot === 3 && (s === 15 || s === 16)) return true;
  } else {
    // 12 PM lunch: 4 blocks
    if (blockSlot === 1 && (s === 8 || s === 9)) return true;
    if (blockSlot === 2 && (s === 10 || s === 11)) return true;
    if (blockSlot === 3 && (s === 13 || s === 14)) return true;
    if (blockSlot === 4 && (s === 15 || s === 16)) return true;
  }
  return false;
}

function isAnyLogForBlock(logs = [], blockSlot, lunchSlot = 12) {
  return logs.some((l) => isLogForBlock(l, blockSlot, lunchSlot));
}

function blockLabel(slot, lunchSlot = 12) {
  const blocks = getWorkBlocks(lunchSlot);
  const found = blocks.find((b) => b.slot === Number(slot));
  if (found) {
    return `${found.shortLabel} (${found.label})`;
  }
  // Fallback if legacy hour slot (8..16)
  const ap = Number(slot) >= 12 ? 'PM' : 'AM';
  let h = Number(slot) % 12;
  if (h === 0) h = 12;
  return `${h} ${ap}`;
}

function getCurrentBlock(date = new Date(), lunchSlot = 12) {
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const timeFloat = currentHour + currentMinute / 60;

  const isBeforeWork = timeFloat < 8.0;
  const isAfterWork = timeFloat >= 17.0;

  const lunch = getLunchBreak(lunchSlot);
  const isLunch = timeFloat >= lunch.startHour && timeFloat < lunch.endHour;

  const blocks = getWorkBlocks(lunchSlot);
  let activeBlock = blocks[0];
  let minutesLeft = 0;

  if (isBeforeWork) {
    activeBlock = blocks[0];
    minutesLeft = Math.max(0, Math.round((8.0 - timeFloat) * 60));
  } else if (isLunch) {
    activeBlock = blocks[0];
    minutesLeft = Math.max(0, Math.round((lunch.endHour - timeFloat) * 60));
  } else if (isAfterWork) {
    activeBlock = blocks[blocks.length - 1];
    minutesLeft = 0;
  } else {
    const matching = blocks.find((b) => timeFloat >= b.startHour && timeFloat < b.endHour);
    if (matching) {
      activeBlock = matching;
      minutesLeft = Math.max(0, Math.round((matching.endHour - timeFloat) * 60));
    } else {
      activeBlock = blocks[0];
      minutesLeft = 0;
    }
  }

  return {
    isBeforeWork,
    isAfterWork,
    isLunch,
    activeBlock,
    currentSlot: activeBlock.slot,
    currentSlotLabel: activeBlock.label,
    minutesLeftInBlock: minutesLeft,
    lunchSlot,
    lunchLabel: lunch.label
  };
}

function currentBlockSlot(lunchSlot = 12, date = new Date()) {
  const status = getCurrentBlock(date, lunchSlot);
  return status.currentSlot;
}

function isLogLate(log, lunchSlot = 12) {
  if (!log) return false;
  if (log.isLate === true || log.submissionStatus === 'Late Submit') return true;
  if (!log.submittedAt) return false;

  const slot = Number(log.hourSlot);

  const isPastClosingTime = (hour, min) => {
    const totalMinutes = hour * 60 + min;
    const ls = Number(lunchSlot) || 12;

    if (ls === 12) {
      // 12 PM Lunch Schedule (4 slots of 2 hours):
      if (slot === 1) return totalMinutes > 10 * 60 + 15;
      if (slot === 2) return totalMinutes > 12 * 60 + 15;
      if (slot === 3) return totalMinutes > 15 * 60 + 15;
      if (slot === 4) return totalMinutes > 17 * 60 + 15;
    } else {
      // 11 AM Lunch Schedule (3 blocks):
      if (slot === 1) return totalMinutes > 11 * 60 + 15;
      if (slot === 2) return totalMinutes > 14 * 60 + 45;
      if (slot === 3) return totalMinutes > 17 * 60 + 15;
    }

    // Fallback for legacy 1-hour slots
    if (slot >= 8 && slot <= 16) {
      const closingMinutes = (slot + 1) * 60 + 15;
      return totalMinutes > closingMinutes || totalMinutes >= 17 * 60 + 15;
    }

    return false;
  };

  const d = log.submittedAt instanceof Date ? log.submittedAt : new Date(log.submittedAt);
  if (!isNaN(d.getTime())) {
    return isPastClosingTime(d.getHours(), d.getMinutes());
  }

  const str = String(log.submittedAt).trim();
  const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let hour = Number(match[1]);
    const min = Number(match[2]);
    const ap = match[3].toUpperCase();
    if (ap === 'PM' && hour < 12) hour += 12;
    if (ap === 'AM' && hour === 12) hour = 0;
    return isPastClosingTime(hour, min);
  }

  return false;
}

module.exports = {
  WORK_BLOCKS_12_LUNCH,
  LUNCH_BREAK_12,
  WORK_BLOCKS_11_LUNCH,
  LUNCH_BREAK_11,
  getWorkBlocks,
  getLunchBreak,
  isLogForBlock,
  isAnyLogForBlock,
  blockLabel,
  getCurrentBlock,
  currentBlockSlot,
  isLogLate
};
