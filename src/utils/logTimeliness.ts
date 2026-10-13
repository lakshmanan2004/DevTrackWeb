export function isLogLate(log: any, lunchSlot: number = 12): boolean {
  if (!log) return false;
  if (log.isLate === true || log.submissionStatus === 'Late Submit') return true;
  if (!log.submittedAt) return false;

  const slot = Number(log.hourSlot);

  // Helper to test closing time in minutes from midnight
  const isPastClosingTime = (hour: number, min: number): boolean => {
    const totalMinutes = hour * 60 + min;

    if (lunchSlot === 12) {
      // 12 PM Lunch Schedule (4 slots of 2 hours):
      // Slot 1: 8:00 AM - 10:00 AM (grace up to 10:15 AM)
      if (slot === 1) return totalMinutes > 10 * 60 + 15;
      // Slot 2: 10:00 AM - 12:00 PM (grace up to 12:15 PM)
      if (slot === 2) return totalMinutes > 12 * 60 + 15;
      // Slot 3: 1:00 PM - 3:00 PM (grace up to 3:15 PM)
      if (slot === 3) return totalMinutes > 15 * 60 + 15;
      // Slot 4: 3:00 PM - 5:00 PM (grace up to 5:15 PM)
      if (slot === 4) return totalMinutes > 17 * 60 + 15;
    } else {
      // 11 AM Lunch Schedule (3 blocks):
      // Slot 1: 8:00 AM - 11:00 AM (grace up to 11:15 AM)
      if (slot === 1) return totalMinutes > 11 * 60 + 15;
      // Slot 2: 12:00 PM - 2:30 PM (grace up to 2:45 PM)
      if (slot === 2) return totalMinutes > 14 * 60 + 45;
      // Slot 3: 2:30 PM - 5:00 PM (grace up to 5:15 PM)
      if (slot === 3) return totalMinutes > 17 * 60 + 15;
    }

    // Fallback for legacy 1-hour slots (e.g. slot 8 -> closes at 9:00 AM + 15 min grace)
    if (slot >= 8 && slot <= 16) {
      const closingMinutes = (slot + 1) * 60 + 15;
      return totalMinutes > closingMinutes || totalMinutes >= 17 * 60 + 15;
    }

    return false;
  };

  // 1. Check ISO date string if available
  if (log.submittedAtISO) {
    const d = new Date(log.submittedAtISO);
    return isPastClosingTime(d.getHours(), d.getMinutes());
  }

  // 2. Parse formatted time string (e.g. "1:29 PM", "11:45 AM")
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
