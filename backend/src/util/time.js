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

// Slots that require a check-in. Lunch hour 12 (12 PM to 1 PM) is excluded.
function requiredSlots(settings) {
  const slots = [];
  for (let h = settings.workStartHour; h <= settings.workEndHour; h++) {
    if (h !== 12) slots.push(h);
  }
  return slots;
}

function isWorkday(d, workDays) {
  return workDays.includes(d.getDay());
}

// Most recent Monday (or same day if Monday).
function weekStart(d = new Date()) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(copy, diff);
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
  isWorkday,
  weekStart
};
