import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Volume2Icon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { HeaderClock } from '../../components/layout/HeaderClock';
import { StatCard } from '../../components/ui/StatCard';
import { Banner } from '../../components/ui/Banner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ActiveTimerCard } from '../../components/developer/ActiveTimerCard';
import { TodayTimeline } from '../../components/developer/TodayTimeline';
import { CheckInModal } from '../../components/developer/CheckInModal';
import { CheckInAlertModal } from '../../components/developer/CheckInAlertModal';
import { DeveloperCalendarWidget } from '../../components/developer/DeveloperCalendarWidget';
import { useAuth } from '../../context/AuthContext';
import { useMyLogs, useTasks, useProjects, usePendingWorks } from '../../hooks/useLive';
import { playAlertSound, showWindowsNotification } from '../../utils/audioAlerts';

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function DeveloperDashboard() {
  const { user } = useAuth();
  const { data } = useMyLogs();
  const { data: taskData } = useTasks();
  const { data: projectData } = useProjects('mine');
  const { data: pendingData } = usePendingWorks();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTargetSlot, setModalTargetSlot] = useState<number | undefined>(undefined);
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

  const navigate = useNavigate();

  const logs = data?.logs || [];
  const stats = data?.stats;
  const myProjects = projectData?.projects || [];
  const activeProject = myProjects[0] || null;

  const pendingItems = pendingData?.items || [];
  const pendingRevisionsCount = pendingItems.length;

  const now = new Date();
  const deadline = new Date(now);
  deadline.setMinutes(59, 59, 0);
  const currentMinute = now.getMinutes();
  const minutesLeft = Math.max(0, 60 - currentMinute);
  const currentSlot = stats?.currentSlot ?? now.getHours();
  const hasLoggedCurrentSlot = logs.some((log: any) => log.hourSlot === currentSlot);
  const currentSlotLabel = `${currentSlot > 12 ? currentSlot - 12 : currentSlot} ${currentSlot >= 12 ? 'PM' : 'AM'}`;

  const triggerTestAlert = async () => {
    playAlertSound('pop');

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
      'System audio pop sound and screen pop-up alerts are active!'
    );
    setAlertModalState({
      open: true,
      level: 'test',
      slotLabel: currentSlotLabel,
      minsLeft: minutesLeft
    });
  };

  const devLunchSlot = user?.lunchSlot ?? 12;
  const isLunchSlot = currentSlot === devLunchSlot;
  const lunchSlotLabel = devLunchSlot === 11 ? '11:00 AM – 12:00 PM' : '12:00 PM – 1:00 PM';
  const lunchEndLabel = devLunchSlot === 11 ? '12:00 PM' : '1:00 PM';

  const isHoliday = !!(data as any)?.isHoliday || !!stats?.isHoliday;
  const holidayName = (data as any)?.holiday?.name || stats?.holidayName || 'Holiday';

  // Background monitor for 20m, 10m, 5m audio pop/chime sounds & Windows desktop notifications + Screen Pop-up Modal
  useEffect(() => {
    if (isHoliday) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const checkTimer = setInterval(() => {
      const d = new Date();
      const slot = stats?.currentSlot ?? d.getHours();
      
      // Lunch break (chosen slot 11 or 12) is exempt from all log check-in alerts and popups
      if (slot === devLunchSlot) return;

      const min = d.getMinutes();
      const remainingMins = 60 - min;
      const unlogged = !logs.some((log: any) => log.hourSlot === slot);

      if (!unlogged) return;

      const slotLabel = `${slot > 12 ? slot - 12 : slot} ${slot >= 12 ? 'PM' : 'AM'}`;

      if (remainingMins <= 20 && remainingMins > 10) {
        if (lastAlertRef.current?.slot === slot && lastAlertRef.current?.level === 'pop') return;
        lastAlertRef.current = { slot, level: 'pop' };
        playAlertSound('pop');
        showWindowsNotification(
          'DevTrack Reminder: 20 Mins Left!',
          `You have ${remainingMins} minutes remaining to submit your work log for ${slotLabel}.`
        );
        setAlertModalState({ open: true, level: 'pop', slotLabel, minsLeft: remainingMins });
      } else if (remainingMins <= 10 && remainingMins > 5) {
        if (lastAlertRef.current?.slot === slot && lastAlertRef.current?.level === 'warning') return;
        lastAlertRef.current = { slot, level: 'warning' };
        playAlertSound('notification');
        showWindowsNotification(
          'DevTrack Warning: 10 Mins Left!',
          `Only ${remainingMins} minutes remaining! Submit your work log for ${slotLabel} before time runs out.`
        );
        setAlertModalState({ open: true, level: 'warning', slotLabel, minsLeft: remainingMins });
      } else if (remainingMins <= 5 && remainingMins > 0) {
        if (lastAlertRef.current?.slot === slot && lastAlertRef.current?.level === 'urgent') return;
        lastAlertRef.current = { slot, level: 'urgent' };
        playAlertSound('urgent');
        showWindowsNotification(
          'DevTrack URGENT: 5 Mins Left!',
          `Dead time approaching! Only ${remainingMins} minutes left to submit your ${slotLabel} check-in!`
        );
        setAlertModalState({ open: true, level: 'urgent', slotLabel, minsLeft: remainingMins });
      }
    }, 5000);

    return () => clearInterval(checkTimer);
  }, [stats?.currentSlot, logs, devLunchSlot, isHoliday]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <>
      <PageHeader
        title="My Dashboard"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={triggerTestAlert}
              icon={<Volume2Icon className="h-3.5 w-3.5 text-brand" />}
            >
              Test Audio & Windows Alert
            </Button>
            <HeaderClock />
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[28px] font-bold leading-tight text-navy">
              {now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {firstName} 👋
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · Team: <span className="font-semibold text-navy">{user?.teamName || 'Unassigned'}</span> · Project: <span className="font-semibold text-brand">{user?.projectName || activeProject?.name || 'Unassigned'}</span>
            </p>
          </div>
          <Badge tone="green" dot>
            Active
          </Badge>
        </div>

        {/* My Involved Project Card */}
        {activeProject ? (
          <section className="glass-card rounded-3xl p-5 sm:p-6 shadow-glass space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 text-brand shadow-glass">
                  <FolderKanbanIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                    Involved Project: {activeProject.name}
                    <Badge tone={activeProject.status === 'completed' ? 'green' : 'blue'} className="text-[10px]">
                      {activeProject.status.toUpperCase()}
                    </Badge>
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Team: <span className="text-slate-700 font-semibold">{activeProject.team || user?.teamName}</span> · Lead: <span className="text-slate-700 font-semibold">{activeProject.leader || 'Unassigned'}</span> · Manager: <span className="text-slate-700 font-semibold">{activeProject.manager || 'Unassigned'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {activeProject.repoUrl && (
                  <a
                    href={activeProject.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/80 bg-white/70 backdrop-blur-md px-3.5 text-xs font-bold text-brand hover:bg-white shadow-glass transition-all"
                  >
                    <GitBranchIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span>Repo</span>
                    <ExternalLinkIcon className="h-3 w-3 text-slate-400" />
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
          <div className="glass-card rounded-2xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-2 font-medium">
              <FolderKanbanIcon className="h-4 w-4 text-slate-400" />
              Not currently assigned to a project team.
            </span>
            <Button size="sm" variant="secondary" onClick={() => navigate('/developer/projects')}>
              View My Projects
            </Button>
          </div>
        )}

        {/* Persistent Check-In Status & Windows Alert Banner or Holiday Banner */}
        {isHoliday ? (
          <div className="rounded-2xl border-2 border-purple-300 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-2xl shadow-inner">
                  🎉
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-purple-950">
                      Organization Holiday: {holidayName}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                      ✨ Holiday Active
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-purple-800">
                    Today is marked as an organization holiday on the system calendar. No hourly check-ins, active timers, or work logs are required today. Enjoy your day off!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenLog()}
                  className="bg-white text-purple-900 border-purple-200 hover:bg-purple-100/60"
                >
                  Optional Check-in
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Banner
            tone={
              isLunchSlot
                ? 'yellow'
                : hasLoggedCurrentSlot
                ? 'green'
                : minutesLeft <= 5
                ? 'red'
                : 'yellow'
            }
            icon={
              isLunchSlot ? (
                <span className="text-sm">🍱</span>
              ) : (
                <AlarmClockIcon
                  className={`h-4 w-4 ${
                    hasLoggedCurrentSlot
                      ? 'text-emerald-600'
                      : minutesLeft <= 5
                      ? 'text-red-600 animate-bounce'
                      : 'text-amber-600'
                  }`}
                />
              )
            }
            title={
              isLunchSlot
                ? `🍱 Lunch Break (${lunchSlotLabel}) — ${minutesLeft}m remaining`
                : hasLoggedCurrentSlot
                ? `✓ Work Log Submitted for ${currentSlotLabel} Slot (${minutesLeft}m remaining in this slot)`
                : minutesLeft <= 5
                ? `URGENT: Only ${minutesLeft} minutes left to log this hour slot!`
                : minutesLeft <= 10
                ? `WARNING: ${minutesLeft} minutes left to log this hour slot!`
                : `Check-In Due: ${minutesLeft} minutes remaining for ${currentSlotLabel} slot`
            }
            action={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={triggerTestAlert}
                  icon={<Volume2Icon className="h-3.5 w-3.5 text-brand" />}
                >
                  Test Audio & Windows Alert
                </Button>
                <Button onClick={() => handleOpenLog(isLunchSlot ? undefined : currentSlot)}>
                  {hasLoggedCurrentSlot || isLunchSlot ? '+ Add Log' : 'Log Now'}
                </Button>
              </div>
            }
          >
            {isLunchSlot
              ? `Lunch Break is in progress! No mandatory check-in is required during ${lunchSlotLabel}. Automated check-in alerts resume at ${lunchEndLabel}.`
              : hasLoggedCurrentSlot
              ? 'Your check-in for this hour is recorded. Automated audio pop sounds and Windows notifications will alert you before the next slot ends.'
              : 'Automated audio pop sounds and Windows screen pop-up notifications will alert you at 20m, 10m, 5m, and deadline.'}
          </Banner>
        )}

        {/* Banner for Team Lead Targeted Feedback / Rejection */}
        {pendingRevisionsCount > 0 && (
          <Banner
            tone="yellow"
            icon={<AlertTriangleIcon className="h-4 w-4 text-amber-600" />}
            title={`${pendingRevisionsCount} Pending Resubmit Task${pendingRevisionsCount > 1 ? 's' : ''} Assigned by Team Lead`}
            action={
              <Button
                className="bg-amber-600 text-white hover:bg-amber-700 border-none"
                onClick={() => navigate('/developer/pending')}
              >
                View Pending Works
              </Button>
            }
          >
            Your Team Leader gave feedback/screenshots on your log submission. Click to review the highlighted parts and update your work log.
          </Banner>
        )}

        {/* Monthly Task Completion & Pending Status Calendar Widget */}
        <DeveloperCalendarWidget />

        {/* 5 Summary Stat Cards */}
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

          {/* 5th Card: Pending Tasks / Resubmit */}
          <Link to="/developer/pending" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              label="Pending Tasks / Resubmit"
              value={String(pendingRevisionsCount)}
              hint={pendingRevisionsCount > 0 ? 'Action required by TL' : 'All clear'}
              tone={pendingRevisionsCount > 0 ? 'yellow' : 'green'}
              icon={<HighlighterIcon className="h-4 w-4" />}
            />
          </Link>
        </div>

        <ActiveTimerCard
          onLog={handleOpenLog}
          activeMinutes={stats?.activeMinutes ?? 0}
          firstSeen={stats?.firstSeen ?? null}
          missed={stats?.missed ?? 0}
        />

        {/* Today's Timeline */}
        <TodayTimeline
          logs={logs}
          currentSlot={currentSlot}
          lunchSlot={devLunchSlot}
          isHoliday={isHoliday}
          holidayName={holidayName}
          onLog={handleOpenLog}
        />
      </div>

      <CheckInModal open={modalOpen} targetSlot={modalTargetSlot} onClose={() => { setModalOpen(false); setModalTargetSlot(undefined); }} />
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
    </>
  );
}