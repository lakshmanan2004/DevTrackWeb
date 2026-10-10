import React, { useEffect, useState } from 'react';
import { CalendarClockIcon } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function label(d: Date) {
  const ap = d.getHours() >= 12 ? 'PM' : 'AM';
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  const time = `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
  return `${DAYS[d.getDay()].slice(0, 3)} ${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()} · ${time}`;
}

// Live client clock — ticks every second.
export const HeaderClock = React.memo(function HeaderClock() {
  const [now, setNow] = useState(() => label(new Date()));

  useEffect(() => {
    const id = setInterval(() => setNow(label(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="glass-surface inline-flex items-center gap-2 rounded-xl border border-white/60 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
      <CalendarClockIcon className="h-3.5 w-3.5 text-brand dark:text-blue-400" aria-hidden="true" />
      {now}
    </span>
  );
});
