export function isLogLate(log: any): boolean {
  if (!log) return false;
  if (log.isLate === true || log.submissionStatus === 'Late Submit') return true;
  if (!log.submittedAt) return false;

  // 1. Check ISO date string if available
  if (log.submittedAtISO) {
    const d = new Date(log.submittedAtISO);
    const slotEnd = new Date(d);
    slotEnd.setHours(Number(log.hourSlot) + 1, 0, 0, 0);
    if (d.getTime() > slotEnd.getTime() || d.getHours() >= 17) {
      return true;
    }
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

    const slotClosingHour = Number(log.hourSlot) + 1;
    if (hour > slotClosingHour || (hour === slotClosingHour && min > 0) || hour >= 17) {
      return true;
    }
  }

  return false;
}
