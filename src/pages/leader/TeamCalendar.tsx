import React, { useMemo, useState, useEffect } from 'react';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UsersIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileTextIcon,
  SearchIcon,
  FlameIcon,
  ArrowRightIcon,
  CheckSquareIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { useTeamCalendar } from '../../hooks/useLive';
import { Link } from 'react-router-dom';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function TeamCalendar() {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const monthStr = `${currentYear}-${pad(currentMonth)}`;

  const { data: calData, loading, error, refetch } = useTeamCalendar(monthStr);

  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth, 0).getDate(), [currentYear, currentMonth]);
  const serverDays: any[] = calData?.days || [];
  const developers = calData?.developers || [];

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [devSearch, setDevSearch] = useState('');

  // Always generate all days in the month (1..daysInMonth) merged with backend data
  const days = useMemo(() => {
    const list: any[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${currentYear}-${pad(currentMonth)}-${pad(d)}`;
      const serverDay = serverDays.find((sd: any) => sd.dateNum === d || sd.dateStr === dStr);
      if (serverDay) {
        list.push(serverDay);
      } else {
        const dateObj = new Date(currentYear, currentMonth - 1, d);
        const dow = dateObj.getDay();
        const isWeekend = dow === 0 || dow === 6;
        const isToday = dStr === todayStr;
        const isFuture = dStr > todayStr;
        list.push({
          dateNum: d,
          dateStr: dStr,
          fullLabel: dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
          dayOfWeek: dow,
          isWorkday: !isWeekend,
          isToday,
          isPast: dStr < todayStr,
          isFuture,
          status: isFuture ? 'future' : isWeekend ? 'weekend' : 'empty',
          unsubmittedCount: 0,
          pendingWorksCount: 0,
          totalLogsCount: 0,
          unsubmittedDevelopers: [],
          submittedDevelopers: [],
          pendingWorks: [],
          logs: []
        });
      }
    }
    return list;
  }, [daysInMonth, currentYear, currentMonth, serverDays, todayStr]);

  // When month changes, if selected date is not in month, select 1st day of that month
  useEffect(() => {
    if (!selectedDateStr.startsWith(monthStr)) {
      setSelectedDateStr(`${monthStr}-01`);
    }
  }, [monthStr, selectedDateStr]);

  const selectedDay = useMemo(() => {
    return days.find((d: any) => d.dateStr === selectedDateStr) || days[0] || null;
  }, [days, selectedDateStr]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDateStr(todayStr);
  };

  // Monthly stats calculations
  const totalMissedCountInMonth = useMemo(() => {
    return days.reduce((acc: number, d: any) => {
      const dayMissed = (d.unsubmittedDevelopers || []).reduce((sum: number, u: any) => sum + (u.missedCount || 0), 0);
      return acc + dayMissed;
    }, 0);
  }, [days]);

  const totalPendingInMonth = useMemo(() => {
    return days.reduce((acc: number, d: any) => acc + (d.pendingWorksCount || 0), 0);
  }, [days]);

  const totalLogsInMonth = useMemo(() => {
    return days.reduce((acc: number, d: any) => acc + (d.totalLogsCount || 0), 0);
  }, [days]);

  // First day offset for calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ...
  const monthLabel = firstDayOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase();

  // Filter developers in search
  const filteredUnsubmitted = useMemo(() => {
    if (!selectedDay) return [];
    const list = selectedDay.unsubmittedDevelopers || [];
    if (!devSearch.trim()) return list;
    return list.filter((u: any) =>
      u.developerName.toLowerCase().includes(devSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(devSearch.toLowerCase())
    );
  }, [selectedDay, devSearch]);

  const filteredPending = useMemo(() => {
    if (!selectedDay) return [];
    const list = selectedDay.pendingWorks || [];
    if (!devSearch.trim()) return list;
    return list.filter((p: any) =>
      p.developerName.toLowerCase().includes(devSearch.toLowerCase()) ||
      p.taskTitle.toLowerCase().includes(devSearch.toLowerCase()) ||
      p.projectName.toLowerCase().includes(devSearch.toLowerCase())
    );
  }, [selectedDay, devSearch]);

  const filteredLogs = useMemo(() => {
    if (!selectedDay) return [];
    const list = selectedDay.logs || [];
    if (!devSearch.trim()) return list;
    return list.filter((l: any) =>
      l.developerName.toLowerCase().includes(devSearch.toLowerCase()) ||
      l.taskTitle.toLowerCase().includes(devSearch.toLowerCase()) ||
      l.projectName.toLowerCase().includes(devSearch.toLowerCase())
    );
  }, [selectedDay, devSearch]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Team Attendance & Work Calendar"
        subtitle="Inspect developer check-ins, missed hourly logs, and pending tasks day-by-day across your team."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCurrentMonth}
              className="text-xs font-bold text-navy"
            >
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* MONTH KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monitored Developers"
          value={String(developers.length)}
          hint="Active team members"
          tone="blue"
          icon={<UsersIcon className="h-5 w-5 text-brand" />}
        />
        <StatCard
          label="Missed Hourly Slots"
          value={String(totalMissedCountInMonth)}
          hint={`Across ${days.filter((d: any) => d.unsubmittedCount > 0).length} workdays`}
          tone="red"
          icon={<AlertTriangleIcon className="h-5 w-5 text-rose-500" />}
        />
        <StatCard
          label="Pending Works Active"
          value={String(totalPendingInMonth)}
          hint="Revisions & open tasks"
          tone="yellow"
          icon={<ClockIcon className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          label="Total Logs Submitted"
          value={String(totalLogsInMonth)}
          hint={`In ${firstDayOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}
          tone="green"
          icon={<CheckCircle2Icon className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* 2-COLUMN MAIN CONTENT: (LEFT: REFERENCE MONTHLY CALENDAR) + (RIGHT: SELECTED DATE INSPECTOR) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: MONTHLY CALENDAR (EXACT DEVELOPER PORTAL REFERENCE DESIGN)    */}
        {/* ========================================================================= */}
        <div className="xl:col-span-5 flex flex-col rounded-2xl border border-hairline bg-white p-5 shadow-card">
          {/* CALENDAR HEADER */}
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider">
                  {monthLabel}
                </h2>
                <p className="text-xs text-slate-500">Team Attendance &amp; Work Calendar</p>
              </div>
            </div>

            <span className="flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
              <ClockIcon className="h-3.5 w-3.5 text-brand" />
              {totalPendingInMonth} Pending
            </span>
          </div>

          {/* MONTH NAVIGATION BAR */}
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-500">
              Click any date to inspect details
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-hairline bg-canvas hover:bg-slate-100 text-navy"
                title="Previous Month"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCurrentMonth}
                className="rounded-lg border border-hairline bg-canvas hover:bg-slate-100 px-2 py-1 text-[11px] font-bold text-navy"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-hairline bg-canvas hover:bg-slate-100 text-navy"
                title="Next Month"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* CALENDAR GRID */}
          <div className="mt-4">
            {/* S M T W T F S HEADERS */}
            <div className="grid grid-cols-7 text-center text-xs font-extrabold text-slate-500 pb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            {/* DAY BUTTONS */}
            <div className="grid grid-cols-7 gap-2 pt-1">
              {Array.from({ length: startDayOfWeek }, (_, i) => (
                <div key={`off-${i}`} className="h-10" />
              ))}

              {days.map((day: any) => {
                const isSelected = day.dateStr === selectedDateStr;
                const isToday = day.isToday;
                const isFuture = day.isFuture;

                let dayStyle = 'bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-navy';

                if (isToday && isSelected) {
                  dayStyle = 'bg-brand text-white border-2 border-brand shadow-md ring-4 ring-brand/20 scale-105 z-10 font-black';
                } else if (isToday) {
                  dayStyle = 'bg-brand text-white border-2 border-brand shadow-sm font-black';
                } else if (isSelected) {
                  dayStyle = 'bg-brand/10 border-2 border-brand text-brand shadow-sm ring-2 ring-brand/30 scale-105 z-10 font-extrabold';
                } else if (isFuture) {
                  dayStyle = 'bg-transparent text-slate-300 border border-transparent hover:bg-slate-50 hover:text-slate-400';
                }

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    title={`${day.fullLabel}${isToday ? ' (Today)' : ''} — ${day.unsubmittedCount} Not Submitted, ${day.pendingWorksCount} Pending`}
                    className={`flex h-10 w-full items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${dayStyle}`}
                  >
                    {day.dateNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CALENDAR LEGEND */}
          <div className="mt-5 border-t border-hairline pt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-brand shrink-0" />
                  <span className="font-semibold text-slate-700">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md border-2 border-brand bg-brand/10 shrink-0" />
                  <span className="font-semibold text-slate-700">Selected Date</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Click date to inspect</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SELECTED DATE INSPECTOR WITH BOTH SECTIONS SIMULTANEOUSLY   */}
        {/* ========================================================================= */}
        <div className="xl:col-span-7 flex flex-col rounded-2xl border-2 border-brand/30 bg-white shadow-card overflow-hidden">
          {/* HEADER BANNER FOR SELECTED DATE */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-gradient-to-r from-navy via-slate-900 to-navy px-5 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    Selected Date Inspection
                  </span>
                  {selectedDay?.isToday && (
                    <span className="rounded-full bg-blue-500/30 border border-blue-400/40 px-1.5 py-0.2 text-[9px] font-bold text-blue-200 uppercase">
                      Today
                    </span>
                  )}
                  {selectedDay?.isWorkday ? (
                    <span className="rounded-full bg-emerald-500/30 border border-emerald-400/40 px-1.5 py-0.2 text-[9px] font-bold text-emerald-200">
                      Workday
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-500/30 border border-slate-400/40 px-1.5 py-0.2 text-[9px] font-bold text-slate-300">
                      Weekend
                    </span>
                  )}
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {selectedDay?.fullLabel || selectedDateStr}
                </h3>
              </div>
            </div>

            {/* QUICK STATS PILLS */}
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-rose-500/20 border border-rose-400/30 px-2.5 py-1 text-center">
                <p className="text-[9px] font-bold uppercase text-rose-300">Not Submitted</p>
                <p className="text-sm font-black text-rose-200">{selectedDay?.unsubmittedCount || 0} Devs</p>
              </div>
              <div className="rounded-lg bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 text-center">
                <p className="text-[9px] font-bold uppercase text-amber-300">Pending Works</p>
                <p className="text-sm font-black text-amber-200">{selectedDay?.pendingWorksCount || 0} Items</p>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="border-b border-hairline bg-slate-50 px-4 py-2">
            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter developers, tasks, or missed slots..."
                value={devSearch}
                onChange={(e) => setDevSearch(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-white py-1 pl-8 pr-3 text-xs text-navy placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-2xs"
              />
            </div>
          </div>

          {/* SIMULTANEOUS 2 SECTIONS: 1. NOT SUBMITTED DEVELOPERS & 2. PENDING WORKS */}
          <div className="p-4 space-y-5 max-h-[640px] overflow-y-auto">
            {/* ========================================================================= */}
            {/* SECTION 1: DEVELOPERS WHO HAVEN'T SUBMITTED & UN-SUBMITTED LOG COUNT      */}
            {/* ========================================================================= */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/20 overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between border-b border-rose-200 bg-rose-50/80 px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-600 text-white font-bold">
                    <AlertTriangleIcon className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-extrabold text-rose-950">
                    1. Developers Who Haven&apos;t Submitted ({selectedDay?.unsubmittedCount || 0})
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-rose-700">
                  Unsubmitted Counts &amp; Missed Slots
                </span>
              </div>

              <div className="p-3 space-y-2.5">
                {filteredUnsubmitted.length === 0 ? (
                  <p className="text-xs text-emerald-700 font-medium py-3 text-center bg-white rounded-lg border border-emerald-200">
                    ✅ All developers in your team submitted their scheduled check-ins for this date.
                  </p>
                ) : (
                  filteredUnsubmitted.map((dev: any) => (
                    <div
                      key={dev.developerId}
                      className="rounded-lg border border-rose-300/80 bg-white p-3 shadow-2xs hover:border-rose-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-xs">
                            {dev.initials}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-navy">{dev.developerName}</h5>
                            <p className="text-[11px] text-gray-500">{dev.jobTitle} · {dev.email}</p>
                          </div>
                        </div>

                        {/* UN-SUBMITTED LOG COUNT BADGE */}
                        <div className="flex flex-col items-end">
                          <span className="rounded bg-rose-600 px-2 py-0.5 text-[11px] font-black text-white shadow-2xs">
                            {dev.missedCount} Unsubmitted Logs
                          </span>
                          <span className="mt-0.5 text-[10px] font-semibold text-rose-700">
                            {dev.submittedCount} of {dev.totalRequired} submitted
                          </span>
                        </div>
                      </div>

                      {/* MISSED TIME SLOTS */}
                      {dev.missedSlots && dev.missedSlots.length > 0 && (
                        <div className="mt-2 rounded bg-rose-50/70 border border-rose-200/70 p-2">
                          <span className="text-[10px] font-bold text-rose-900 block mb-1">
                            Missed Slots ({dev.missedSlots.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {dev.missedSlots.map((slotLabel: string) => (
                              <span
                                key={slotLabel}
                                className="rounded bg-rose-100 border border-rose-300 px-1.5 py-0.2 text-[10px] font-bold text-rose-800"
                              >
                                {slotLabel}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-hairline">
                        <span>Active Time: <strong className="text-navy">{dev.activeMinutes}m</strong></span>
                        <Link
                          to="/leader/developers"
                          className="font-bold text-brand hover:underline flex items-center gap-1"
                        >
                          Dev Profile <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 2: PENDING WORKS FOR THIS DATE                                    */}
            {/* ========================================================================= */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/20 overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50/80 px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-600 text-white font-bold">
                    <ClockIcon className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-extrabold text-amber-950">
                    2. Pending Works for This Date ({selectedDay?.pendingWorksCount || 0})
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-amber-700">
                  Revisions, Blockers &amp; Unapproved Logs
                </span>
              </div>

              <div className="p-3 space-y-2.5">
                {filteredPending.length === 0 ? (
                  <p className="text-xs text-gray-500 font-medium py-3 text-center bg-white rounded-lg border border-hairline">
                    No pending revisions, blockers, or unreviewed logs on this date.
                  </p>
                ) : (
                  filteredPending.map((item: any) => {
                    const isRevision = item.status === 'changes_requested';
                    const isBlocked = item.status === 'blocked';
                    const isApproval = item.status === 'awaiting_lead_approval';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-3 shadow-2xs transition-all ${
                          isRevision
                            ? 'border-amber-300 bg-amber-50/60'
                            : isBlocked
                            ? 'border-rose-300 bg-rose-50/60'
                            : 'border-blue-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-navy/10 px-1.5 py-0.2 text-[9px] font-extrabold text-navy">
                                {item.hourLabel}
                              </span>
                              <span className="text-[11px] font-bold text-gray-600">
                                {item.projectName}
                              </span>
                            </div>
                            <h5 className="mt-0.5 text-xs font-bold text-navy">{item.taskTitle}</h5>
                          </div>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                              isRevision
                                ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                : isBlocked
                                ? 'bg-rose-200 text-rose-900 border border-rose-300'
                                : isApproval
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {isRevision
                              ? 'Changes Requested'
                              : isBlocked
                              ? 'Blocked'
                              : isApproval
                              ? 'Awaiting Approval'
                              : 'In Progress'}
                          </span>
                        </div>

                        {/* DEVELOPER INFO & NOTE */}
                        <div className="mt-2 rounded bg-white/90 p-2 border border-hairline text-[11px]">
                          <p className="font-semibold text-gray-700">
                            Developer: <strong className="text-navy">{item.developerName}</strong>
                          </p>
                          {item.feedbackNote && (
                            <p className="mt-0.5 text-gray-700 font-medium">
                              Note / Blocker: <span className="italic text-gray-900">&ldquo;{item.feedbackNote}&rdquo;</span>
                            </p>
                          )}
                        </div>

                        {item.isPendingWorkSubmission && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-900 font-bold">
                            <FlameIcon className="h-3 w-3 text-amber-600" />
                            <span>Submitted as Pending Work from {item.originalPendingDate}</span>
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between text-[11px] pt-1 border-t border-hairline">
                          <span className="text-gray-500 font-medium">
                            Submitted: <strong className="text-slate-700">{new Date(item.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong> at {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Link
                            to="/leader/approvals"
                            className="font-bold text-brand hover:underline flex items-center gap-1"
                          >
                            Review in Log Approvals <ArrowRightIcon className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SECTION 3: SUBMITTED LOGS SUMMARY */}
            {filteredLogs.length > 0 && (
              <div className="rounded-xl border border-hairline bg-slate-50/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <FileTextIcon className="h-4 w-4 text-brand" />
                    <h5 className="text-xs font-bold text-navy">
                      All Submitted Logs on This Date ({filteredLogs.length})
                    </h5>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {filteredLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="rounded bg-navy/10 px-1 py-0.2 text-[9px] font-bold text-navy">
                          {log.hourLabel}
                        </span>
                        <span className="font-bold text-navy truncate max-w-[120px]">{log.developerName}</span>
                        <span className="text-gray-600 truncate max-w-[180px]">{log.taskTitle}</span>
                      </div>
                      <span className={`text-[10px] font-bold shrink-0 ${log.review === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {log.review || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
