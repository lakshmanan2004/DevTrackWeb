export interface WorkBlock {
  slot: number;
  id: string;
  label: string;
  shortLabel: string;
  displayTitle: string;
  startHour: number; // decimal e.g. 8.0, 14.5
  endHour: number;
  durationHours: number;
  maxMinutes: number;
  defaultMinutes: number;
  deadlineStr: string;
  graceStr: string;
}

export interface LunchBreakInfo {
  slot: 0;
  label: string;
  shortLabel: string;
  displayTitle: string;
  startHour: number;
  endHour: number;
  durationHours: number;
}

/**
 * 4 Equal 2-Hour Blocks Schedule for users with 12:00 PM – 1:00 PM lunch:
 * 8:00 AM - 10:00 AM (2h)
 * 10:00 AM - 12:00 PM (2h)
 * [12:00 PM - 1:00 PM Lunch Break]
 * 1:00 PM - 3:00 PM (2h)
 * 3:00 PM - 5:00 PM (2h)
 */
export const WORK_BLOCKS_12_LUNCH: WorkBlock[] = [
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

export const LUNCH_BREAK_12: LunchBreakInfo = {
  slot: 0,
  label: '12:00 PM – 1:00 PM',
  shortLabel: 'Lunch Break',
  displayTitle: 'Lunch & Recharge',
  startHour: 12.0,
  endHour: 13.0,
  durationHours: 1.0
};

/**
 * 3 Balanced Blocks Schedule for users with 11:00 AM – 12:00 PM lunch:
 * 8:00 AM - 11:00 AM (3h)
 * [11:00 AM - 12:00 PM Lunch Break]
 * 12:00 PM - 2:30 PM (2.5h)
 * 2:30 PM - 5:00 PM (2.5h)
 */
export const WORK_BLOCKS_11_LUNCH: WorkBlock[] = [
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

export const LUNCH_BREAK_11: LunchBreakInfo = {
  slot: 0,
  label: '11:00 AM – 12:00 PM',
  shortLabel: 'Lunch Break',
  displayTitle: 'Lunch & Recharge',
  startHour: 11.0,
  endHour: 12.0,
  durationHours: 1.0
};

/**
 * Returns work blocks based on user's lunch slot (12 by default, or 11).
 */
export function getWorkBlocks(lunchSlot: number = 12): WorkBlock[] {
  return lunchSlot === 11 ? WORK_BLOCKS_11_LUNCH : WORK_BLOCKS_12_LUNCH;
}

export function getLunchBreak(lunchSlot: number = 12): LunchBreakInfo {
  return lunchSlot === 11 ? LUNCH_BREAK_11 : LUNCH_BREAK_12;
}

export const WORK_BLOCKS = WORK_BLOCKS_12_LUNCH; // Default export for backwards compat
export const LUNCH_BREAK = LUNCH_BREAK_12;

/**
 * Checks whether a given WorkLog belongs to the specified block slot.
 * Includes backwards compatibility for legacy hourly slots (8-16).
 */
export function isLogForBlock(log: any, blockSlot: number, lunchSlot: number = 12): boolean {
  if (!log) return false;
  const s = Number(log.hourSlot);
  if (s === blockSlot) return true;

  if (lunchSlot === 12) {
    // 12 PM lunch: 4 slots
    // Slot 1: 8-10 AM
    if (blockSlot === 1 && (s === 8 || s === 9)) return true;
    // Slot 2: 10-12 PM
    if (blockSlot === 2 && (s === 10 || s === 11)) return true;
    // Slot 3: 1-3 PM
    if (blockSlot === 3 && (s === 13 || s === 14)) return true;
    // Slot 4: 3-5 PM
    if (blockSlot === 4 && (s === 15 || s === 16)) return true;
  } else {
    // 11 AM lunch: 3 blocks
    if (blockSlot === 1 && (s === 8 || s === 9 || s === 10)) return true;
    if (blockSlot === 2 && (s === 12 || s === 13 || s === 14)) return true;
    if (blockSlot === 3 && (s === 15 || s === 16)) return true;
  }

  return false;
}

export interface CurrentBlockStatus {
  isBeforeWork: boolean;
  isAfterWork: boolean;
  isLunch: boolean;
  activeBlock: WorkBlock;
  currentSlot: number;
  currentSlotLabel: string;
  minutesLeftInBlock: number;
  totalBlockMinutes: number;
  lunchSlot: number;
  lunchLabel: string;
}

/**
 * Calculates current workday block status given a date and lunch slot.
 */
export function getCurrentBlockStatus(date: Date = new Date(), lunchSlot: number = 12): CurrentBlockStatus {
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
    // Find active block
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
    totalBlockMinutes: activeBlock.durationHours * 60,
    lunchSlot,
    lunchLabel: lunch.label
  };
}
