import React, { useMemo, useState, useEffect } from 'react';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UsersIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  MessageSquareIcon,
  FileTextIcon,
  SearchIcon,
  SparklesIcon,
  FlameIcon,
  AlertOctagonIcon,
  ArrowRightIcon,
  FolderKanbanIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useTeamCalendar } from '../../hooks/useLive';
import { Link } from 'react-router-dom';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function fmtDateMonthYear(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function TeamCalendar() {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const monthStr = `${currentYear}-${pad(currentMonth)}`;

  const { data: calData, loading, error, refetch } = useTeamCalendar(monthStr);

  const days = calData?.days || [];
  const developers = calData?.developers || [];

  // Default selected date to today or the 1st of the month
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<'unsubmitted' | 'pending' | 'logs'>('unsubmitted');
  const [devSearch, setDevSearch] = useState('');

  // When month changes, if selected date is not in month, select 1st day of that month
  useEffect(() => {
    if (!selectedDateStr.startsWith(monthStr)) {
      setSelectedDateStr(`${monthStr}-01`);
    }
  }, [monthStr, selectedDateStr]);

  const selectedDay = useMemo(() => {
    return days.find((d: any) => d.dateStr === selectedDateStr) || days[0] || null;
  }, [days, selectedDateStr]);

  // Adjust active tab when selected day changes if unsubmitted is 0 but pending > 0
  useEffect(() => {
    if (selectedDay) {
      if (selectedDay.unsubmittedCount > 0) {
        setActiveTab('unsubmitted');
      } else if (selectedDay.pendingWorksCount > 0) {
        setActiveTab('pending');
      } else if (selectedDay.totalLogsCount > 0) {
        setActiveTab('logs');
      } else {
        setActiveTab('unsubmitted');
      }
    }
  }, [selectedDateStr, selectedDay]);

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
          hint={`In ${fmtDateMonthYear(firstDayOfMonth)}`}
          tone="green"
          icon={<CheckCircle2Icon className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* MAIN CONTENT: FULL MONTH CALENDAR + DEDICATED SIDE-BY-SIDE INSPECTOR */}
      <div className="space-y-6">
        {/* MONTHLY CALENDAR GRID */}
        <div className="flex flex-col rounded-2xl border border-hairline bg-white shadow-card overflow-hidden">
          {/* CALENDAR HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-canvas/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand shadow-sm">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">
                  Monthly Team Schedule · {fmtDateMonthYear(firstDayOfMonth)}
                </h2>
                <p className="text-xs text-gray-500">
                  Click on any date in this calendar to instantly view unsubmitted developers with their missed log counts and pending works.
                </p>
              </div>
            </div>

            {/* STATUS LEGEND */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-rose-700">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                ⚠️ Developers Not Submitted
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                🕒 Pending Works
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                ✅ All Logs Completed
              </span>
            </div>
          </div>

          {/* DAYS OF WEEK HEADER */}
          <div className="grid grid-cols-7 border-b border-hairline bg-slate-50 text-center text-xs font-bold text-gray-500 py-3">
            <div className="text-rose-600">SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div className="text-indigo-600">SAT</div>
          </div>

          {/* CALENDAR CELLS */}
          <div className="grid grid-cols-7 gap-1.5 bg-slate-100/70 p-3">
            {/* Empty padding cells for start of month */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[105px] rounded-xl bg-slate-50/40 p-2 opacity-25 border border-dashed border-slate-200" />
            ))}

            {/* Days in Month */}
            {days.map((day: any) => {
              const isSelected = day.dateStr === selectedDateStr;
              const hasUnsubmitted = day.unsubmittedCount > 0;
              const hasPending = day.pendingWorksCount > 0;
              const isWeekend = !day.isWorkday;
              const isFuture = day.isFuture;
              const isToday = day.isToday;

              let cardBg = 'bg-white hover:bg-blue-50/60 border border-slate-200/80 shadow-xs';
              if (isSelected) {
                cardBg = 'bg-blue-50/90 ring-3 ring-brand ring-offset-1 border-brand shadow-md';
              } else if (isToday) {
                cardBg = 'bg-indigo-50/70 ring-2 ring-brand/50 border-brand/40';
              } else if (isFuture) {
                cardBg = 'bg-slate-50/80 text-gray-400 border-slate-200/40';
              } else if (isWeekend) {
                cardBg = 'bg-slate-50/70 text-gray-400 border-slate-200/60';
              }

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`group relative flex min-h-[105px] flex-col justify-between rounded-xl p-2.5 text-left transition-all duration-150 cursor-pointer ${cardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                        isSelected
                          ? 'bg-brand text-white shadow-md ring-2 ring-brand/30'
                          : isToday
                          ? 'bg-navy text-white'
                          : 'text-navy group-hover:text-brand'
                      }`}
                    >
                      {day.dateNum}
                    </span>
                    {isToday ? (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-extrabold text-brand uppercase tracking-wider">
                        Today
                      </span>
                    ) : isSelected ? (
                      <span className="rounded-full bg-brand px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                        Active
                      </span>
                    ) : null}
                  </div>

                  {/* Day Badges & Stats */}
                  <div className="mt-1.5 flex flex-col gap-1">
                    {hasUnsubmitted && (
                      <div className="flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                        <AlertTriangleIcon className="h-3 w-3 shrink-0 text-rose-600" />
                        <span className="truncate">{day.unsubmittedCount} Not Submitted</span>
                      </div>
                    )}

                    {hasPending && (
                      <div className="flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        <ClockIcon className="h-3 w-3 shrink-0 text-amber-600" />
                        <span className="truncate">{day.pendingWorksCount} Pending</span>
                      </div>
                    )}

                    {!hasUnsubmitted && !hasPending && day.totalLogsCount > 0 && (
                      <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle2Icon className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="truncate">{day.totalLogsCount} Logs Submitted</span>
                      </div>
                    )}

                    {isWeekend && !hasUnsubmitted && day.totalLogsCount === 0 && (
                      <span className="text-[10px] text-gray-400 font-medium italic">Off / Weekend</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SELECTED DATE DETAILS: DIRECT SIMULTANEOUS 2-COLUMN VIEW                   */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border-2 border-brand/30 bg-white shadow-xl overflow-hidden">
          {/* HEADER BANNER FOR SELECTED DATE */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-gradient-to-r from-navy via-slate-900 to-navy px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white shadow-md">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    Selected Date Inspection
                  </span>
                  {selectedDay?.isToday && (
                    <span className="rounded-full bg-blue-500/30 border border-blue-400/40 px-2 py-0.5 text-[10px] font-bold text-blue-200 uppercase">
                      Today
                    </span>
                  )}
                  {selectedDay?.isWorkday ? (
                    <span className="rounded-full bg-emerald-500/30 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                      Workday
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-500/30 border border-slate-400/40 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      Weekend / Off
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  {selectedDay?.fullLabel || selectedDateStr}
                </h3>
              </div>
            </div>

            {/* SUMMARY STATS ON BANNER */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/20 border border-rose-400/30 px-3.5 py-1.5 text-center">
                <p className="text-[10px] font-bold uppercase text-rose-300">Not Submitted</p>
                <p className="text-lg font-black text-rose-200">{selectedDay?.unsubmittedCount || 0} Devs</p>
              </div>
              <div className="rounded-xl bg-amber-500/20 border border-amber-400/30 px-3.5 py-1.5 text-center">
                <p className="text-[10px] font-bold uppercase text-amber-300">Pending Works</p>
                <p className="text-lg font-black text-amber-200">{selectedDay?.pendingWorksCount || 0} Items</p>
              </div>
              <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1.5 text-center">
                <p className="text-[10px] font-bold uppercase text-emerald-300">Submitted Logs</p>
                <p className="text-lg font-black text-emerald-200">{selectedDay?.totalLogsCount || 0} Logs</p>
              </div>
            </div>
          </div>

          {/* SEARCH / FILTER BAR */}
          <div className="flex items-center justify-between border-b border-hairline bg-slate-50 px-6 py-2.5">
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search developer, missed slots, task or blocker on this date..."
                value={devSearch}
                onChange={(e) => setDevSearch(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-white py-1.5 pl-8 pr-3 text-xs text-navy placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-xs"
              />
            </div>
            <p className="text-xs text-gray-500 italic">
              Showing both Not Submitted Developers and Pending Works for {selectedDay?.dateStr}
            </p>
          </div>

          {/* TWO DEDICATED COLUMNS: 1. NOT SUBMITTED DEVELOPERS | 2. PENDING WORKS */}
          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
            {/* ========================================================================= */}
            {/* COLUMN 1: NOT SUBMITTED DEVELOPERS & UN-SUBMITTED LOG COUNT               */}
            {/* ========================================================================= */}
            <div className="flex flex-col rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm overflow-hidden">
              {/* SECTION HEADER */}
              <div className="flex items-center justify-between border-b border-rose-200 bg-rose-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white font-bold">
                    <AlertTriangleIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-950">
                      Developers Who Haven&apos;t Submitted
                    </h4>
                    <p className="text-xs text-rose-700">
                      Unsubmitted log counts &amp; missing hourly slots for this date
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-200/80 border border-rose-300 px-2.5 py-0.5 text-xs font-black text-rose-900">
                  {selectedDay?.unsubmittedCount || 0} Missing
                </span>
              </div>

              {/* LIST OF UN-SUBMITTED DEVELOPERS */}
              <div className="p-4 space-y-3.5 max-h-[600px] overflow-y-auto">
                {filteredUnsubmitted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-2">
                      <CheckCircle2Icon className="h-6 w-6" />
                    </div>
                    <h5 className="text-sm font-bold text-navy">All Developers Submitted Logs</h5>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">
                      {selectedDay?.isFuture
                        ? 'This date is in the future.'
                        : !selectedDay?.isWorkday
                        ? 'Non-working day / weekend.'
                        : 'No developers missed their check-in logs on this date.'}
                    </p>
                  </div>
                ) : (
                  filteredUnsubmitted.map((dev: any) => (
                    <div
                      key={dev.developerId}
                      className="rounded-xl border border-rose-300/80 bg-white p-4 shadow-sm hover:border-rose-400 transition-all"
                    >
                      {/* DEV HEADER */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-sm shadow-xs">
                            {dev.initials}
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-navy">{dev.developerName}</h5>
                            <p className="text-xs text-gray-500">{dev.jobTitle} · {dev.email}</p>
                          </div>
                        </div>

                        {/* UN-SUBMITTED LOG COUNT BADGE */}
                        <div className="flex flex-col items-end">
                          <span className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-black text-white shadow-xs">
                            {dev.missedCount} Unsubmitted Logs
                          </span>
                          <span className="mt-0.5 text-[10px] font-bold text-rose-700">
                            {dev.submittedCount} of {dev.totalRequired} submitted
                          </span>
                        </div>
                      </div>

                      {/* MISSED TIME SLOTS BADGES */}
                      {dev.missedSlots && dev.missedSlots.length > 0 && (
                        <div className="mt-3 rounded-lg bg-rose-50/70 border border-rose-200/70 p-2.5">
                          <span className="text-[11px] font-bold text-rose-900 block mb-1.5">
                            Missed Slot Check-ins ({dev.missedSlots.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {dev.missedSlots.map((slotLabel: string) => (
                              <span
                                key={slotLabel}
                                className="rounded bg-rose-100 border border-rose-300 px-2 py-0.5 text-[11px] font-bold text-rose-800"
                              >
                                {slotLabel}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* STATS & ACTIONS */}
                      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2 text-xs">
                        <span className="text-gray-500">
                          Active Minutes: <strong className="text-navy">{dev.activeMinutes}m</strong>
                        </span>
                        <Link
                          to="/leader/developers"
                          className="flex items-center gap-1 font-bold text-brand hover:underline"
                        >
                          Inspect Dev Profile <ArrowRightIcon className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* COLUMN 2: PENDING WORKS FOR THIS DATE                                     */}
            {/* ========================================================================= */}
            <div className="flex flex-col rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm overflow-hidden">
              {/* SECTION HEADER */}
              <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white font-bold">
                    <ClockIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">
                      Pending Works for This Date
                    </h4>
                    <p className="text-xs text-amber-700">
                      Revisions requested, blocker issues, and awaiting lead reviews
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-200/80 border border-amber-300 px-2.5 py-0.5 text-xs font-black text-amber-900">
                  {selectedDay?.pendingWorksCount || 0} Pending
                </span>
              </div>

              {/* LIST OF PENDING WORKS */}
              <div className="p-4 space-y-3.5 max-h-[600px] overflow-y-auto">
                {filteredPending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-gray-400 mb-2">
                      <CheckCircle2Icon className="h-6 w-6" />
                    </div>
                    <h5 className="text-sm font-bold text-navy">No Pending Works</h5>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">
                      No unresolved revisions, blockers, or unreviewed logs on this date.
                    </p>
                  </div>
                ) : (
                  filteredPending.map((item: any) => {
                    const isRevision = item.status === 'changes_requested';
                    const isBlocked = item.status === 'blocked';
                    const isApproval = item.status === 'awaiting_lead_approval';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 shadow-sm transition-all ${
                          isRevision
                            ? 'border-amber-300 bg-amber-50/60'
                            : isBlocked
                            ? 'border-rose-300 bg-rose-50/60'
                            : 'border-blue-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-extrabold text-navy">
                                {item.hourLabel}
                              </span>
                              <span className="text-xs font-bold text-gray-600">
                                {item.projectName}
                              </span>
                            </div>
                            <h5 className="mt-1 text-sm font-bold text-navy">{item.taskTitle}</h5>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
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
                        <div className="mt-2.5 rounded-lg bg-white/90 p-2.5 border border-hairline text-xs shadow-2xs">
                          <p className="font-semibold text-gray-700">
                            Developer: <strong className="text-navy">{item.developerName}</strong>
                          </p>
                          {item.feedbackNote && (
                            <p className="mt-1 text-gray-700 font-medium">
                              Note / Blocker: <span className="italic text-gray-900">&ldquo;{item.feedbackNote}&rdquo;</span>
                            </p>
                          )}
                        </div>

                        {/* PENDING SUBMISSION TIMESTAMPS */}
                        {item.isPendingWorkSubmission && (
                          <div className="mt-2 flex items-center gap-1.5 rounded bg-amber-100/70 px-2 py-1 text-[11px] text-amber-900 font-bold">
                            <FlameIcon className="h-3.5 w-3.5 text-amber-700" />
                            <span>Submitted as Pending Work from {item.originalPendingDate}</span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between text-xs pt-1.5 border-t border-hairline">
                          <span className="text-gray-400">
                            Time: {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Link
                            to="/leader/approvals"
                            className="font-bold text-brand hover:underline flex items-center gap-1"
                          >
                            Review in Log Approvals <ArrowRightIcon className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: LOGGED SUBMISSIONS FOR THIS DATE                               */}
          {/* ========================================================================= */}
          <div className="border-t border-hairline bg-slate-50/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5 text-brand" />
                <h4 className="text-sm font-bold text-navy">
                  All Submitted Logs on This Date ({filteredLogs.length})
                </h4>
              </div>
              <span className="text-xs text-gray-500">
                Verified work logs submitted by team members
              </span>
            </div>

            {filteredLogs.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">
                No logs recorded for this day.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-hairline bg-white p-3.5 shadow-xs hover:border-brand/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand text-[10px] font-bold">
                          {log.initials}
                        </span>
                        <span className="text-xs font-bold text-navy truncate max-w-[120px]">{log.developerName}</span>
                      </div>
                      <span className="rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-bold text-navy">
                        {log.hourLabel}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-navy truncate">{log.taskTitle}</h5>
                      <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{log.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-hairline">
                      <span className="truncate max-w-[120px]">{log.projectName}</span>
                      <span className={`font-bold ${log.review === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {log.review || 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

