// Time & formatting helpers. All dates are handled in the server's local time
// so "today", hour slots and labels match what users see on their machines.
const pad = (n) => String(n).padStart(2, '0');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDayStr(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function fmtTime(d) {
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${pad(d.getMinutes())} ${ap}`;
}

function hourLabel(slot) {
  const ap = slot >= 12 ? 'PM' : 'AM';
  let h = slot % 12;
  if (h === 0) h = 12;
  return `${h} ${ap}`;
}

function fmtDateMDY(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}

function fmtDateLong(d) {
  return `${DAYS_LONG[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}

function fmtDayShort(d) {
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function fmtDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${pad(m)}m`;
}

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Hour slot for a given moment, clamped to the working window (e.g. 8..16).
function slotForNow(settings, now = new Date()) {
  const start = settings.workStartHour;
  const end = settings.workEndHour; // exclusive-ish: last bookable slot
  let h = now.getHours();
  if (h < start) return start;
  if (h > end) return end;
  return h;
}

// Slots that require a check-in. Lunch hour (11 AM to 12 PM or 12 PM to 1 PM) is excluded.
function requiredSlots(settings, lunchSlot = 12) {
  const slots = [];
  const ls = Number(lunchSlot) || 12;
  for (let h = settings.workStartHour; h <= settings.workEndHour; h++) {
    if (h !== ls) slots.push(h);
  }
  return slots;
}

function isThirdSaturday(d) {
  return d.getDay() === 6 && d.getDate() >= 15 && d.getDate() <= 21;
}

function isWorkday(d, workDaysOrSettings) {
  const dateStr = dayStr(d);
  let workDays = Array.isArray(workDaysOrSettings) ? workDaysOrSettings : (workDaysOrSettings?.workDays || [1, 2, 3, 4, 5]);
  const holidays = !Array.isArray(workDaysOrSettings) && Array.isArray(workDaysOrSettings?.holidays) ? workDaysOrSettings.holidays : [];

  // 1. Check explicit holiday or forced working override date
  const entry = holidays.find((h) => h.date === dateStr);
  if (entry) {
    if (entry.isWorkingOverride) return true; // Forced working day
    return false; // Explicit holiday
  }

  // 2. Check 3rd Saturday rule (Organization Holiday)
  if (isThirdSaturday(d)) {
    return false;
  }

  // 3. Fallback to weekly work days (e.g. Mon-Fri)
  return workDays.includes(d.getDay());
}

// Most recent Monday (or same day if Monday).
function weekStart(d = new Date()) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(copy, diff);
}

// Cleanly format/truncate task title up to word or char limit without breaking words
function makeTaskTitle(text, maxWords = 10, maxChars = 75) {
  if (!text) return 'Work Log';
  const clean = String(text).trim().replace(/\s+/g, ' ');
  const words = clean.split(' ');
  if (words.length <= maxWords && clean.length <= maxChars) {
    return clean;
  }
  const result = [];
  let currentLen = 0;
  for (const w of words) {
    if (result.length >= maxWords) break;
    const addedLen = currentLen === 0 ? w.length : w.length + 1;
    if (currentLen + addedLen > maxChars) {
      if (result.length === 0) {
        return w.slice(0, maxChars).trim() + '...';
      }
      break;
    }
    result.push(w);
    currentLen += addedLen;
  }
  const joined = result.join(' ').replace(/[,;:\-.\s]+$/, '');
  return `${joined}...`;
}

module.exports = {
  pad,
  DAYS,
  MONTHS,
  dayStr,
  fromDayStr,
  addDays,
  fmtTime,
  hourLabel,
  fmtDateMDY,
  fmtDateLong,
  fmtDayShort,
  fmtDuration,
  initialsOf,
  slotForNow,
  requiredSlots,
  isThirdSaturday,
  isWorkday,
  weekStart,
  makeTaskTitle
};
