import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  AlarmClockIcon,
  CheckCircle2Icon,
  GaugeIcon,
  ListChecksIcon,
  TimerIcon,
  AlertTriangleIcon,
  HighlighterIcon,
  FolderKanbanIcon,
  GitBranchIcon,
  ExternalLinkIcon,
  Volume2Icon,
  PlusIcon,
  PalmtreeIcon,
  SunIcon,
  MoonIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { HeaderClock } from '../../components/layout/HeaderClock';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ActiveTimerCard } from '../../components/developer/ActiveTimerCard';
import { TodayTimeline } from '../../components/developer/TodayTimeline';
import { CheckInModal } from '../../components/developer/CheckInModal';
import { CheckInAlertModal } from '../../components/developer/CheckInAlertModal';
import { ApplyLeaveModal } from '../../components/developer/ApplyLeaveModal';
import { NewScheduleAnnouncementModal } from '../../components/developer/NewScheduleAnnouncementModal';
import { DeveloperCalendarWidget } from '../../components/developer/DeveloperCalendarWidget';
import { useAuth } from '../../context/AuthContext';
import { useMyLogs, useProjects, usePendingWorks, useLeaves } from '../../hooks/useLive';
import { playAlertSound, showWindowsNotification } from '../../utils/audioAlerts';
import { getCurrentBlockStatus, isLogForBlock } from '../../utils/workBlocks';

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

interface DeveloperDashboardProps {
  initialOpenSubmit?: boolean;
}

export function DeveloperDashboard({ initialOpenSubmit = false }: DeveloperDashboardProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, refetch: refetchLogs } = useMyLogs();
  const { data: projectData } = useProjects('mine');
  const { data: pendingData } = usePendingWorks();

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: leaveData, refetch: refetchLeaves } = useLeaves(todayStr);
  const todayLeave = leaveData?.leaves?.find((l: any) => l.date === todayStr);

  const isSubmitRequested = initialOpenSubmit || location.pathname === '/developer/submit' || location.search.includes('submit=true');
  const [modalOpen, setModalOpen] = useState(isSubmitRequested);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(() => {
    return localStorage.getItem('devtrack_schedule_v2_seen') !== 'true';
  });
  const [modalTargetSlot, setModalTargetSlot] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (initialOpenSubmit || location.pathname === '/developer/submit' || location.search.includes('submit=true')) {
      setModalOpen(true);
    }
  }, [initialOpenSubmit, location.pathname, location.search]);

  const handleOpenLog = (slot?: number) => {
    setModalTargetSlot(slot);
    setModalOpen(true);
  };

  const [alertModalState, setAlertModalState] = useState<{
    open: boolean;
    level: 'pop' | 'warning' | 'urgent' | 'late' | 'test';
    slotLabel: string;
    minsLeft: number;
  }>({
    open: false,
    level: 'test',
    slotLabel: '10 AM',
    minsLeft: 20
  });

  const lastAlertRef = useRef<{ slot: number; level: string } | null>(null);

  const logs = data?.logs || [];
  const stats = data?.stats;
  const myProjects = projectData?.projects || [];
  const activeProject =
    (user?.projectName ? myProjects.find((p: any) => p.name === user.projectName) : null) ||
    myProjects.find((p: any) => p.status === 'ongoing') ||
    myProjects[0] ||
    null;

  const pendingItems = pendingData?.items || [];
  const pendingRevisionsCount = pendingItems.length;

  const devLunchSlot = user?.lunchSlot ?? 12;
  const now = new Date();
  const blockStatus = getCurrentBlockStatus(now, devLunchSlot);
  const isBeforeWork = blockStatus.isBeforeWork;
  const isAfterWork = blockStatus.isAfterWork;
  const isOutsideWorkHours = isBeforeWork || isAfterWork;
  const isLunchSlot = blockStatus.isLunch;
  const minutesLeft = blockStatus.minutesLeftInBlock;
  const currentSlot = blockStatus.currentSlot;
  const hasLoggedCurrentSlot = logs.some((log: any) => isLogForBlock(log, currentSlot, devLunchSlot));
  const currentSlotLabel = `${blockStatus.activeBlock.shortLabel} (${blockStatus.activeBlock.label})`;
  const lunchSlotLabel = blockStatus.lunchLabel;
  const lunchEndLabel = devLunchSlot === 11 ? '12:00 PM' : '1:00 PM';

  const triggerTestAlert = async () => {
    playAlertSound('pop', true);

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          alert(
            'Browser notifications were not allowed. Please click the lock icon in your browser URL bar (localhost:5173) and set Notifications to ALLOW.'
          );
        }
      } else if (Notification.permission === 'denied') {
        alert(
          'Browser notifications are currently BLOCKED in your browser settings.\n\nTo see Windows notifications:\n1. Click the site settings lock icon next to localhost:5173 in the URL bar.\n2. Set Notifications to ALLOW.\n3. Turn off Windows "Do Not Disturb" in your taskbar.'
        );
      }
    }

    showWindowsNotification(
      'DevTrack Sound & Pop-Up Check',
      'System audio pop sound and screen pop-up alerts are active!',
      true
    );
    setAlertModalState({
      open: true,
      level: 'test',
      slotLabel: currentSlotLabel,
      minsLeft: minutesLeft
    });
  };

  const isHoliday = !!(data as any)?.isHoliday || !!stats?.isHoliday;
  const holidayName = (data as any)?.holiday?.name || stats?.holidayName || 'Holiday';

  // Automated background milestone check-in monitor (20m, 10m, 5m, deadline)
  useEffect(() => {
    if (isHoliday) return;
    if (user?.role !== 'developer') return;

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const checkMilestoneAlerts = () => {
      const d = new Date();
      const status = getCurrentBlockStatus(d, devLunchSlot);

      // Do not alert before 8 AM, after 5 PM, or during lunch break
      if (status.isBeforeWork || status.isAfterWork || status.isLunch) return;

      const slot = status.currentSlot;

      // Suppress alert if developer has an approved leave/half-day covering this slot
      if (todayLeave) {
        if (todayLeave.type === 'full_day') return;
        if (todayLeave.slots && todayLeave.slots.includes(slot)) return;
      }

      const remainingMins = status.minutesLeftInBlock;
      const unlogged = !logs.some((log: any) => isLogForBlock(log, slot, devLunchSlot));

      if (!unlogged) return;

      const slotLabel = `${status.activeBlock.shortLabel} (${status.activeBlock.label})`;
      const todayKey = d.toISOString().slice(0, 10);

      const triggerMilestone = (
        milestoneKey: '20m' | '10m' | '5m' | 'deadline',
        level: 'pop' | 'warning' | 'urgent' | 'late',
        soundType: 'pop' | 'notification' | 'urgent',
        title: string,
        body: string,
        minsForModal: number
      ) => {
        const storageKey = `devtrack_alert_${todayKey}_block${slot}_${milestoneKey}`;
        if (sessionStorage.getItem(storageKey)) {
          return;
        }
        sessionStorage.setItem(storageKey, 'true');
        lastAlertRef.current = { slot, level };

        playAlertSound(soundType, true);
        showWindowsNotification(title, body, true);
        setAlertModalState({ open: true, level, slotLabel, minsLeft: minsForModal });
      };

      if (remainingMins <= 20 && remainingMins > 10) {
        triggerMilestone(
          '20m',
          'pop',
          'pop',
          'DevTrack Reminder: 20 Minutes Left!',
          `You have ${remainingMins} minutes remaining to submit your work log for ${slotLabel}.`,
          remainingMins
        );
      } else if (remainingMins <= 10 && remainingMins > 5) {
        triggerMilestone(
          '10m',
          'warning',
          'notification',
          'DevTrack Warning: 10 Minutes Left!',
          `Only ${remainingMins} minutes remaining! Submit your work log for ${slotLabel}.`,
          remainingMins
        );
      } else if (remainingMins <= 5 && remainingMins > 1) {
        triggerMilestone(
          '5m',
          'urgent',
          'urgent',
          'DevTrack URGENT: 5 Minutes Left!',
          `Deadline approaching! Only ${remainingMins} minutes left to submit your ${slotLabel} check-in!`,
          remainingMins
        );
      } else if (remainingMins <= 1 && remainingMins >= 0) {
        triggerMilestone(
          'deadline',
          'late',
          'urgent',
          'DevTrack DEADLINE: Work Block Closing Now!',
          `Final minute for ${slotLabel}! Submit your work log before the slot closes.`,
          remainingMins
        );
      }
    };

    checkMilestoneAlerts();
    const checkTimer = setInterval(checkMilestoneAlerts, 10000);
    return () => clearInterval(checkTimer);
  }, [logs, devLunchSlot, isHoliday, user?.role, todayLeave]);


  const firstName = user?.name?.split(' ')[0] || 'there';
  const greetingTime = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const formattedDate = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      {/* 1. FIXED TOP NAVBAR */}
      <PageHeader
        title="My Dashboard"
        subtitle={
          devLunchSlot === 12
            ? "Track 4 equal 2-hour work blocks, active tasks, and daily work log submissions in real time"
            : "Track 3 balanced work blocks, active tasks, and daily work log submissions in real time"
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setLeaveModalOpen(true)}
              icon={<PalmtreeIcon className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />}
            >
              {todayLeave ? 'Manage Leave' : 'Apply Leave / Half-Day'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={triggerTestAlert}
              icon={<Volume2Icon className="h-3.5 w-3.5 text-brand dark:text-[#5AA9FF]" />}
            >
              Test Audio Alert
            </Button>
            <HeaderClock />
          </div>
        }

      />

      {/* 2. SCROLLABLE DASHBOARD CONTENT */}
      <div className="flex-1 p-5 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        
        {/* ACTIVE LEAVE BANNER IF MARKED TODAY */}
        {todayLeave && (
          <div className="glass-card rounded-3xl p-4 sm:p-5 border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-300 shrink-0">
                {todayLeave.type === 'full_day' ? (
                  <PalmtreeIcon className="h-6 w-6" />
                ) : todayLeave.type === 'half_day_morning' ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-navy dark:text-white">
                    {todayLeave.type === 'full_day'
                      ? '🌴 Full-Day Leave Active'
                      : todayLeave.type === 'half_day_morning'
                      ? '☀️ Morning Half-Day Active (9 AM – 1 PM)'
                      : '⛅ Afternoon Half-Day Active (2 PM – 6 PM)'}
                  </span>
                  <Badge tone="yellow" className="text-[10px] font-bold">
                    Excused Check-ins
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                  Reason: &ldquo;{todayLeave.reason}&rdquo; · Alerts suppressed for TL & PM.
                </p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setLeaveModalOpen(true)}>
              Edit / Cancel
            </Button>
          </div>
        )}

        {/* 3. HERO / GREETING SECTION */}
        <section className="glass-card rounded-3xl p-6 sm:p-7 shadow-glass relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-5 relative z-10">
            <div className="space-y-1.5 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-[#F5F5F5]">
                {greetingTime}, {firstName} 👋
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-slate-600 dark:text-[#A1A1AA]">
                <span>{formattedDate}</span>
                <span>•</span>
                <span>Team: <strong className="text-slate-800 dark:text-slate-200">{user?.teamName || 'Unassigned'}</strong></span>
                <span>•</span>
                <span>Project: <strong className="text-slate-800 dark:text-slate-200">{user?.projectName || activeProject?.name || 'Unassigned'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Badge tone={todayLeave ? 'yellow' : 'green'} dot className="px-3 py-1.5 text-xs font-bold shadow-2xs">
                {todayLeave ? (todayLeave.type === 'full_day' ? 'On Leave' : 'Half-Day') : 'Active'}
              </Badge>
              <Button
                size="md"
                onClick={() => handleOpenLog(isLunchSlot ? undefined : currentSlot)}
                icon={<PlusIcon className="h-4 w-4" />}
              >
                Log Work Now
              </Button>
            </div>
          </div>
        </section>

        {/* 4. INVOLVED PROJECT CARD */}
        {activeProject ? (
          <section className="glass-surface independent-card rounded-3xl p-5 sm:p-6 shadow-glass space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 dark:bg-[rgba(22,131,255,0.16)] border border-brand/20 dark:border-[rgba(22,131,255,0.35)] text-brand dark:text-[#5AA9FF] shadow-glass shrink-0">
                  <FolderKanbanIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-950 dark:text-[#F5F5F5] truncate">
                      Involved Project: {activeProject.name}
                    </h3>
                    <Badge tone={activeProject.status === 'completed' ? 'green' : 'blue'} className="text-[10px] font-extrabold uppercase">
                      {activeProject.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-[#A1A1AA] mt-1">
                    Team: <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeProject.team || user?.teamName}</span> · Lead: <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeProject.leader || 'Unassigned'}</span> · Manager: <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeProject.manager || 'Unassigned'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activeProject.repoUrl && (
                  <a
                    href={activeProject.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-subcard inline-flex h-9 items-center gap-1.5 px-3.5 text-xs font-bold text-brand dark:text-[#5AA9FF] hover:bg-white/80 dark:hover:bg-white/10 shadow-glass transition-all"
                  >
                    <GitBranchIcon className="h-3.5 w-3.5 text-slate-500 dark:text-[#A1A1AA]" />
                    <span>Repo</span>
                    <ExternalLinkIcon className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  </a>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate('/developer/projects')}
                >
                  View My Projects ({myProjects.length})
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <div className="glass-surface rounded-2xl border border-dashed border-slate-300 dark:border-white/15 p-4 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-2 font-medium">
              <FolderKanbanIcon className="h-4 w-4 text-slate-400" />
              Not currently assigned to an active project team.
            </span>
            <Button size="sm" variant="secondary" onClick={() => navigate('/developer/projects')}>
              View My Projects
            </Button>
          </div>
        )}

        {/* 5. DEDICATED WORK STATUS & ALERT SECTION */}
        {isHoliday ? (
          <div className="glass-surface rounded-2xl border border-purple-300/60 dark:border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20 p-5 shadow-glass">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/15 text-2xl">
                🎉
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200">
                    Organization Holiday: {holidayName}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                    ✨ Holiday Active
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-purple-800 dark:text-purple-300">
                  Today is marked as an organization holiday. No mandatory check-ins, active timers, or work logs are required today.
                </p>
              </div>
            </div>
          </div>
        ) : isBeforeWork ? (
          <div className="glass-surface rounded-2xl border border-blue-300/60 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 p-4 sm:p-5 shadow-glass">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <AlarmClockIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                  Office Hours Begin at 8:00 AM ({minutesLeft}m remaining)
                </h3>
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mt-0.5">
                  Work block check-ins run from 8:00 AM to 5:00 PM. Automated reminders activate 15 minutes before each block closes.
                </p>
              </div>
            </div>
          </div>
        ) : isAfterWork ? (
          <div className="glass-surface rounded-2xl border border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 sm:p-5 shadow-glass">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                  Workday Completed (Office Hours Ended at 5:00 PM)
                </h3>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mt-0.5">
                  All daily mandatory check-in slots are completed for today. Automated alerts are paused until 8:00 AM tomorrow.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`glass-surface rounded-2xl border p-4 sm:p-5 shadow-glass flex items-center justify-between gap-4 ${
            isLunchSlot
              ? 'border-amber-300/60 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20'
              : hasLoggedCurrentSlot
              ? 'border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20'
              : minutesLeft <= 5
              ? 'border-rose-300/60 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20'
              : 'border-amber-300/60 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                hasLoggedCurrentSlot ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                {isLunchSlot ? (
                  <span className="text-base">🍱</span>
                ) : (
                  <AlarmClockIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isLunchSlot
                    ? `Lunch Break (${lunchSlotLabel}) — ${minutesLeft}m remaining`
                    : hasLoggedCurrentSlot
                    ? `✓ Work Log Submitted for ${blockStatus.activeBlock.displayTitle} (${minutesLeft}m remaining)`
                    : minutesLeft <= 15
                    ? `⚠️ Block Closing Soon: Only ${minutesLeft}m left to log ${blockStatus.activeBlock.shortLabel}!`
                    : `Current Block in Progress: ${blockStatus.activeBlock.displayTitle} — ${minutesLeft}m remaining`}
                </h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                  {isLunchSlot
                    ? `Lunch break in progress. Automated check-in reminders resume at ${lunchEndLabel}.`
                    : hasLoggedCurrentSlot
                    ? `Your work log is recorded for this ${blockStatus.activeBlock.durationHours}h block. Next block begins after ${blockStatus.activeBlock.deadlineStr}.`
                    : `Submit your work log for this ${blockStatus.activeBlock.durationHours}h block before ${blockStatus.activeBlock.deadlineStr} to maintain 100% on-time record.`}
                </p>
              </div>
            </div>
            {hasLoggedCurrentSlot && (
              <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <CheckCircle2Icon className="h-3.5 w-3.5" />
                <span>Submitted</span>
              </span>
            )}
          </div>
        )}

        {/* Pending Revisions Banner (if TL requested changes) */}
        {pendingRevisionsCount > 0 && (
          <div className="glass-surface rounded-2xl border border-amber-300/70 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/25 p-4 sm:p-5 shadow-glass flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  {pendingRevisionsCount} Pending Resubmit Task{pendingRevisionsCount > 1 ? 's' : ''} Assigned by Team Lead
                </h3>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-0.5">
                  Your Team Leader provided targeted feedback/screenshots. Review the annotations and update your submission.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700 border-none"
              onClick={() => navigate('/developer/pending')}
            >
              View Pending Works
            </Button>
          </div>
        )}

        {/* 6. DASHBOARD GRID: CALENDAR & TODAY'S WORK */}
        <DeveloperCalendarWidget />

        {/* 7. PRODUCTIVITY STAT CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Active Time"
            value={stats ? fmtDuration(stats.activeMinutes) : '—'}
            hint={stats?.firstSeen ? `since ${stats.firstSeen}` : (isHoliday ? 'Holiday today' : 'no activity yet')}
            tone="green"
            icon={<TimerIcon className="h-4 w-4" />}
          />

          <StatCard
            label="Tasks Logged"
            value={String(logs.length)}
            hint={logs.length ? `Last: ${logs[logs.length - 1].submittedAt}` : (isHoliday ? 'Holiday today' : 'No logs yet today')}
            tone="blue"
            icon={<ListChecksIcon className="h-4 w-4" />}
          />

          <StatCard
            label="Hours Covered"
            value={stats ? `${stats.hoursCovered}/${stats.slotsSoFar}` : '—'}
            hint={isHoliday ? 'Holiday' : 'working-hour slots'}
            tone="purple"
            icon={<GaugeIcon className="h-4 w-4" />}
          />

          <StatCard
            label="Missed Check-ins"
            value={String(stats?.missed ?? 0)}
            hint={isHoliday ? 'Holiday today' : (stats?.missed ? 'submit pending slots' : 'Perfect record')}
            tone={stats?.missed ? 'yellow' : 'green'}
            icon={<CheckCircle2Icon className="h-4 w-4" />}
          />

          <Link to="/developer/pending" className="block">
            <StatCard
              interactive
              label="Pending Tasks / Resubmit"
              value={String(pendingRevisionsCount)}
              hint={pendingRevisionsCount > 0 ? 'Action required by TL' : 'All clear'}
              tone={pendingRevisionsCount > 0 ? 'yellow' : 'green'}
              icon={<HighlighterIcon className="h-4 w-4" />}
            />
          </Link>
        </div>

        {/* 8. ACTIVE SESSION TIMER */}
        <ActiveTimerCard
          activeMinutes={stats?.activeMinutes ?? 0}
          firstSeen={stats?.firstSeen ?? null}
          missed={stats?.missed ?? 0}
        />

        {/* 9. TODAY'S TIMELINE */}
        <TodayTimeline
          logs={logs}
          currentSlot={currentSlot}
          lunchSlot={devLunchSlot}
          isHoliday={isHoliday}
          holidayName={holidayName}
          onLog={handleOpenLog}
        />
      </div>

      {/* 10. MODALS */}
      <CheckInModal
        open={modalOpen}
        targetSlot={modalTargetSlot}
        lunchSlot={devLunchSlot}
        onClose={() => {
          setModalOpen(false);
          setModalTargetSlot(undefined);
          if (location.pathname === '/developer/submit') {
            navigate('/developer', { replace: true });
          }
        }}
        onSubmitted={() => {
          refetchLogs();
          if (location.pathname === '/developer/submit') {
            navigate('/developer/logs', { replace: true });
          }
        }}
      />
      <CheckInAlertModal
        open={alertModalState.open}
        onClose={() => setAlertModalState((prev) => ({ ...prev, open: false }))}
        onLogNow={() => {
          setAlertModalState((prev) => ({ ...prev, open: false }));
          handleOpenLog(isLunchSlot ? undefined : currentSlot);
        }}
        minutesLeft={alertModalState.minsLeft}
        slotLabel={alertModalState.slotLabel}
        alertLevel={alertModalState.level}
      />
      <ApplyLeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        existingLeave={todayLeave}
        onSuccess={() => {
          refetchLeaves();
          refetchLogs();
        }}
      />
      <NewScheduleAnnouncementModal
        open={announcementOpen}
        onClose={() => setAnnouncementOpen(false)}
        lunchSlot={devLunchSlot}
      />
    </>
  );
}

