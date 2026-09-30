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

      {/* MAIN CONTENT: CALENDAR GRID + DETAIL INSPECTION PANEL */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* CALENDAR VIEW (7 COLS) */}
        <div className="xl:col-span-7 flex flex-col rounded-2xl border border-hairline bg-white shadow-card overflow-hidden">
          {/* CALENDAR HEADER */}
          <div className="flex items-center justify-between border-b border-hairline bg-canvas/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">
                  {fmtDateMonthYear(firstDayOfMonth)}
                </h2>
                <p className="text-xs text-gray-500">
                  Click any date to inspect unsubmitted developers &amp; pending works
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Missed Logs
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Pending
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                All Done
              </span>
            </div>
          </div>

          {/* DAYS OF WEEK HEADER */}
          <div className="grid grid-cols-7 border-b border-hairline bg-slate-50 text-center text-xs font-bold text-gray-500 py-2.5">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* CALENDAR CELLS */}
          <div className="grid grid-cols-7 gap-px bg-slate-100 p-2">
            {/* Empty padding cells for start of month */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[85px] rounded-xl bg-slate-50/50 p-2 opacity-30" />
            ))}

            {/* Days in Month */}
            {days.map((day: any) => {
              const isSelected = day.dateStr === selectedDateStr;
              const hasUnsubmitted = day.unsubmittedCount > 0;
              const hasPending = day.pendingWorksCount > 0;
              const isWeekend = !day.isWorkday;
              const isFuture = day.isFuture;
              const isToday = day.isToday;

              let cardBg = 'bg-white hover:bg-blue-50/50';
              if (isSelected) {
                cardBg = 'bg-blue-50/90 ring-2 ring-brand ring-offset-1 shadow-sm';
              } else if (isToday) {
                cardBg = 'bg-indigo-50/60 ring-1 ring-brand/40';
              } else if (isFuture) {
                cardBg = 'bg-slate-50/80 text-gray-400';
              } else if (isWeekend) {
                cardBg = 'bg-slate-50/60 text-gray-400';
              }

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`group relative flex min-h-[92px] flex-col justify-between rounded-xl p-2 text-left transition-all duration-150 ${cardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isSelected
                          ? 'bg-brand text-white shadow-sm'
                          : isToday
                          ? 'bg-navy text-white'
                          : 'text-navy group-hover:text-brand'
                      }`}
                    >
                      {day.dateNum}
                    </span>
                    {isToday && (
                      <span className="rounded bg-brand/10 px-1 py-0.2 text-[10px] font-extrabold text-brand uppercase">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day Badges & Stats */}
                  <div className="mt-1 flex flex-col gap-1">
                    {hasUnsubmitted && (
                      <div className="flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/80">
                        <AlertTriangleIcon className="h-3 w-3 shrink-0 text-rose-600" />
                        <span className="truncate">{day.unsubmittedCount} Not Submitted</span>
                      </div>
                    )}

                    {hasPending && (
                      <div className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/80">
                        <ClockIcon className="h-3 w-3 shrink-0 text-amber-600" />
                        <span className="truncate">{day.pendingWorksCount} Pending</span>
                      </div>
                    )}

                    {!hasUnsubmitted && !hasPending && day.totalLogsCount > 0 && (
                      <div className="flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80">
                        <CheckCircle2Icon className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="truncate">{day.totalLogsCount} Logs</span>
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

        {/* DETAIL INSPECTOR PANEL (5 COLS) */}
        <div className="xl:col-span-5 flex flex-col rounded-2xl border border-hairline bg-white shadow-card overflow-hidden">
          {/* PANEL HEADER */}
          <div className="border-b border-hairline bg-canvas/80 p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Day Inspector
                </span>
                <h3 className="text-lg font-bold text-navy">
                  {selectedDay?.fullLabel || selectedDateStr}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedDay?.isToday && (
                  <Badge tone="blue">Today</Badge>
                )}
                {selectedDay?.isWorkday ? (
                  <Badge tone="green">Workday</Badge>
                ) : (
                  <Badge tone="grey">Weekend</Badge>
                )}
              </div>
            </div>

            {/* QUICK DAY STATS PILLS */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700">
                <AlertTriangleIcon className="h-3.5 w-3.5" />
                <span>{selectedDay?.unsubmittedCount || 0} Devs Not Submitted</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>{selectedDay?.pendingWorksCount || 0} Pending Works</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-brand">
                <FileTextIcon className="h-3.5 w-3.5" />
                <span>{selectedDay?.totalLogsCount || 0} Logs Logged</span>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('unsubmitted')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'unsubmitted'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-gray-600 hover:text-navy'
                }`}
              >
                ⚠️ Not Submitted ({selectedDay?.unsubmittedCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'pending'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-gray-600 hover:text-navy'
                }`}
              >
                🕒 Pending Works ({selectedDay?.pendingWorksCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'logs'
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-gray-600 hover:text-navy'
                }`}
              >
                📋 Submitted Logs ({selectedDay?.totalLogsCount || 0})
              </button>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative mt-3">
              <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by developer name, task or project..."
                value={devSearch}
                onChange={(e) => setDevSearch(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-white py-1.5 pl-8 pr-3 text-xs text-navy placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[550px] space-y-3">
            {/* TAB 1: NOT SUBMITTED DEVELOPERS */}
            {activeTab === 'unsubmitted' && (
              <>
                {filteredUnsubmitted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
                      <CheckCircle2Icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-navy">No Unsubmitted Developers</h4>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">
                      {selectedDay?.isFuture
                        ? 'This is a future date. Log requirements will activate on that day.'
                        : !selectedDay?.isWorkday
                        ? 'This is a non-working weekend or holiday.'
                        : 'All developers in your team submitted their scheduled hourly check-ins on this date!'}
                    </p>
                  </div>
                ) : (
                  filteredUnsubmitted.map((dev: any) => (
                    <div
                      key={dev.developerId}
                      className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 transition-all hover:bg-rose-50/70 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-bold text-sm shadow-sm">
                            {dev.initials}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-navy">{dev.developerName}</h4>
                            <p className="text-xs text-gray-500">{dev.jobTitle} · {dev.email}</p>
                          </div>
                        </div>

                        <span className="rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                          {dev.missedCount} Missed Slots
                        </span>
                      </div>

                      {/* SUBMISSION PROGRESS */}
                      <div className="mt-3 flex items-center justify-between text-xs font-medium text-gray-600">
                        <span>Submitted: <strong className="text-navy">{dev.submittedCount}</strong> of {dev.totalRequired} slots</span>
                        <span className="text-rose-700 font-bold">{dev.status}</span>
                      </div>

                      {/* MISSED TIME SLOTS LIST */}
                      {dev.missedSlots && dev.missedSlots.length > 0 && (
                        <div className="mt-2.5">
                          <span className="text-[11px] font-bold text-gray-500 block mb-1">
                            Missed Hour Check-ins:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {dev.missedSlots.map((slotLabel: string) => (
                              <span
                                key={slotLabel}
                                className="rounded bg-rose-100/80 border border-rose-300 px-2 py-0.5 text-[11px] font-bold text-rose-800"
                              >
                                {slotLabel}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ACTION SHORTCUT */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-rose-200/60 pt-2.5 text-xs">
                        <span className="text-gray-500">
                          Active: <strong>{dev.activeMinutes}m</strong>
                        </span>
                        <Link
                          to={`/leader/developers`}
                          className="flex items-center gap-1 font-bold text-brand hover:underline"
                        >
                          View Dev Activity <ArrowRightIcon className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* TAB 2: PENDING WORKS */}
            {activeTab === 'pending' && (
              <>
                {filteredPending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-gray-400 mb-3">
                      <ClockIcon className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-navy">No Pending Works</h4>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">
                      There are no changes requested, blocked issues, or unapproved submissions for this day.
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
                        className={`rounded-xl border p-4 transition-all ${
                          isRevision
                            ? 'border-amber-300 bg-amber-50/50'
                            : isBlocked
                            ? 'border-rose-300 bg-rose-50/50'
                            : 'border-blue-200 bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy">
                                {item.hourLabel}
                              </span>
                              <span className="text-xs font-bold text-gray-600">
                                {item.projectName}
                              </span>
                            </div>
                            <h4 className="mt-1 text-sm font-bold text-navy">{item.taskTitle}</h4>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isRevision
                                ? 'bg-amber-100 text-amber-800'
                                : isBlocked
                                ? 'bg-rose-100 text-rose-800'
                                : isApproval
                                ? 'bg-indigo-100 text-indigo-800'
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

                        {/* DEVELOPER & NOTE */}
                        <div className="mt-2.5 rounded-lg bg-white p-2.5 border border-hairline text-xs">
                          <p className="font-semibold text-gray-700">
                            Developer: <strong className="text-navy">{item.developerName}</strong>
                          </p>
                          {item.feedbackNote && (
                            <p className="mt-1 text-gray-600 italic">
                              &ldquo;{item.feedbackNote}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* PENDING SUBMISSION TIMESTAMPS */}
                        {item.isPendingWorkSubmission && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                            <FlameIcon className="h-3.5 w-3.5 text-amber-600" />
                            <span>Submitted as Pending Work from {item.originalPendingDate}</span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t border-hairline/60">
                          <span className="text-gray-400">
                            Submitted: {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Link
                            to="/leader/approvals"
                            className="font-bold text-brand hover:underline flex items-center gap-1"
                          >
                            Go to Approvals <ArrowRightIcon className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* TAB 3: SUBMITTED LOGS */}
            {activeTab === 'logs' && (
              <>
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-gray-400 mb-3">
                      <FileTextIcon className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-navy">No Logs Submitted</h4>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">
                      No logs have been recorded by your team on this date.
                    </p>
                  </div>
                ) : (
                  filteredLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-hairline bg-white p-3.5 shadow-sm space-y-2 hover:border-brand/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand text-[10px] font-bold">
                            {log.initials}
                          </span>
                          <span className="text-xs font-bold text-navy">{log.developerName}</span>
                          <span className="rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-bold text-navy">
                            {log.hourLabel}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            log.review === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.review === 'changes_requested'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-brand'
                          }`}
                        >
                          {log.review || 'pending'}
                        </span>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-navy">{log.taskTitle}</h5>
                        <p className="mt-1 text-xs text-gray-600 line-clamp-2">{log.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-hairline">
                        <span>Project: {log.projectName}</span>
                        <span>Active: {log.activeMinutes} mins</span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
