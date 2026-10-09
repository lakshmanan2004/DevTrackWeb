import React, { useState, useMemo } from 'react';
import { 
  BarChart3Icon, 
  SearchIcon, 
  ChevronDownIcon, 
  InfoIcon, 
  ClockIcon, 
  GitCommitVerticalIcon, 
  FileTextIcon, 
  CheckCircle2Icon,
  AlertTriangleIcon,
  TrendingUpIcon,
  CalendarIcon,
  AwardIcon,
  ZapIcon,
  CalendarX2Icon,
  ListCheckIcon,
  RefreshCwIcon,
  UsersIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Select } from '../../components/ui/Select';
import { usePerformance } from '../../hooks/useLive';

export interface DailyTrendPoint {
  day: string;
  score: number;
  hours: number;
  commits: number;
  status?: 'Present' | 'Absent' | 'Leave';
}

export interface DeveloperDetailedPerformance {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  avatarBg: string;
  team: string;
  project: string;
  score: number; // 0-100
  tier: 'Excellent' | 'Good' | 'Average' | 'Poor';
  attendance: {
    absentDays: number;
    presentDays: number;
    leaveStatus: string;
  };
  pendingWorks: {
    assigned: number;
    resolved: number;
    resolutionRate: number;
    teamAvgResolutionRate: number;
    handlingSummary: string;
  };
  dailyTrend: DailyTrendPoint[];
  weeklyTrend: { week: string; score: number }[];
  changeRatio: {
    totalReviews: number;       // total code reviews submitted this period
    changesRequested: number;   // reviews that came back as 'Changes Requested'
    ratio: number;              // percentage e.g. 18 means 18% of reviews got change feedback
    teamAvgRatio: number;
    riskLevel: 'Low' | 'Moderate' | 'High';
    note: string;               // human-readable explanation
  };
  metrics: {
    logRate: { value: number; label: string; teamAvg: number };
    ontimeRate: { value: number; label: string; teamAvg: number };
    commits: { countText: string; value: number; count: number; teamAvg: number };
    eodConsistency: { value: number; label: string; teamAvg: number };
    taskCompletion: { value: number; label: string; teamAvg: number };
    pendingResolution: { value: number; label: string; teamAvg: number };
    batchSubmissions: { count: number; text: string; status: 'clean' | 'warning' | 'high' };
  };
  warningNote?: string;
  recommendation?: string;
}


function getTierBadgeStyles(tier: 'Excellent' | 'Good' | 'Average' | 'Poor') {
  switch (tier) {
    case 'Excellent':
      return {
        text: 'text-[#22c55e]',
        bg: 'bg-emerald-50 text-[#22c55e] border-emerald-200',
        fill: 'bg-[#22c55e]'
      };
    case 'Good':
      return {
        text: 'text-[#3b82f6]',
        bg: 'bg-blue-50 text-[#3b82f6] border-blue-200',
        fill: 'bg-[#3b82f6]'
      };
    case 'Average':
      return {
        text: 'text-[#f97316]',
        bg: 'bg-orange-50 text-[#f97316] border-orange-200',
        fill: 'bg-[#f97316]'
      };
    case 'Poor':
      return {
        text: 'text-[#ef4444]',
        bg: 'bg-red-50 text-[#ef4444] border-red-200',
        fill: 'bg-[#ef4444]'
      };
  }
}

export function EmployeePerformance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('All Projects');
  const [selectedDevId, setSelectedDevId] = useState<string>('');
  const [chartMode, setChartMode] = useState<'daily' | 'weekly'>('daily');

  // Live performance data computed from real work logs, commits, EODs and tasks
  const { data: perfData } = usePerformance();
  const developersData: DeveloperDetailedPerformance[] = perfData?.developers || [];

  // Extract unique projects dynamically from live developer data
  const projectOptions = useMemo(() => {
    const set = new Set<string>();
    developersData.forEach((d) => {
      if (d.project) set.add(d.project);
    });
    return Array.from(set);
  }, [developersData]);

  // Filter developers list based on project filter and search input
  const filteredDevs = useMemo(() => {
    return developersData.filter((dev) => {
      const matchesProject = selectedProject === 'All Projects' || dev.project === selectedProject;
      const matchesSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            dev.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            dev.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProject && matchesSearch;
    });
  }, [selectedProject, searchQuery, developersData]);

  // Currently selected developer detailed data object
  const activeDev = useMemo(() => {
    if (!selectedDevId || !developersData.length) return null;
    return developersData.find((d) => d.id === selectedDevId) || null;
  }, [selectedDevId, developersData]);

  const activeStyles = activeDev ? getTierBadgeStyles(activeDev.tier) : getTierBadgeStyles('Good');

  // Maximum value for daily chart calculation
  const maxDailyScore = 100;

  return (
    <>
      {/* PAGE HEADER */}
      <PageHeader
        title="Employee Performance Detailed View"
        subtitle="Individual developer performance analysis, attendance, pending works resolution & graphs — read only"
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 p-6">
        {/* INFO BANNER */}
        <Banner tone="grey" icon={<BarChart3Icon className="h-4 w-4 text-brand dark:text-indigo-400" />}>
          📊 Inspect detailed performance metrics, attendance/absence impact, pending work resolution rates, and team comparison graphs for any developer.
        </Banner>

        {/* TOP CONTROLS: SEARCH & DEVELOPER SELECTOR BAR */}
        <div className="glass-card relative z-20 rounded-3xl p-4 shadow-glass">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search developer by name, role or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full rounded-2xl py-2 pl-9 pr-4 text-xs text-navy dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Project Dropdown Filter */}
              <div className="w-48">
                <Select
                  size="sm"
                  fullWidth
                  value={selectedProject}
                  onChange={(val) => setSelectedProject(val)}
                  options={[
                    { value: 'All Projects', label: 'All Projects' },
                    ...projectOptions.map((proj) => ({
                      value: proj,
                      label: proj
                    }))
                  ]}
                  searchable
                />
              </div>

              {/* Developer Select Dropdown */}
              <div className="w-56">
                <Select
                  size="sm"
                  fullWidth
                  placeholder="Select an employee..."
                  value={selectedDevId}
                  onChange={(val) => setSelectedDevId(val)}
                  options={[
                    { value: '', label: 'Select an employee...' },
                    ...filteredDevs.map((d) => ({
                      value: d.id,
                      label: d.name,
                      badge: `${d.score}% · ${d.tier}`
                    }))
                  ]}
                  searchable
                />
              </div>
            </div>
          </div>
        </div>

        {!activeDev ? (
          <div className="glass-card rounded-3xl p-16 text-center shadow-glass space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-inner">
              <UsersIcon className="h-8 w-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-navy dark:text-white">
                Select an Employee to View Performance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a developer from the dropdown above to inspect their detailed attendance, metric breakdown, and weekly performance trends.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* SINGLE DEVELOPER DETAILED HERO CARD */}
            <div className={`glass-card rounded-3xl p-6 shadow-glass transition-colors ${
              activeDev.tier === 'Poor' ? 'border-rose-500/30 bg-rose-500/10' : ''
            }`}>
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-hairline pb-6">
            {/* Left: Avatar & Profile Info */}
            <div className="flex items-center gap-4">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-glass ${activeDev.avatarBg}`}
              >
                {activeDev.initials}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-navy dark:text-white">{activeDev.name}</h2>
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-extrabold ${activeStyles.bg}`}>
                    {activeDev.tier}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {activeDev.role} · <span className="font-bold text-navy dark:text-white">{activeDev.team}</span> · Project: <span className="font-bold text-navy dark:text-white">{activeDev.project}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeDev.email}</p>
              </div>
            </div>

            {/* Right: Big Score Display & Attendance Badge */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Performance Index</span>
                <span className={`text-4xl font-black tabular-nums ${activeStyles.text}`}>
                  {activeDev.score}%
                </span>
              </div>
              <div className="hidden sm:block h-12 w-px bg-slate-400/20" />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-brand dark:text-indigo-400" />
                  <span className="text-slate-500 dark:text-slate-400">Attendance:</span>
                  <span className="font-bold text-navy dark:text-white">{activeDev.attendance.leaveStatus}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ListCheckIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-slate-500 dark:text-slate-400">Pending Resolution:</span>
                  <span className="font-bold text-navy dark:text-white">{activeDev.pendingWorks.resolved} / {activeDev.pendingWorks.assigned} ({activeDev.pendingWorks.resolutionRate}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK KPI TILES */}
          <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
            <div className="glass-surface rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <AwardIcon className="h-3.5 w-3.5 text-brand dark:text-indigo-400" />
                <span>Overall Score</span>
              </div>
              <p className={`mt-1.5 text-xl font-extrabold tabular-nums ${activeStyles.text}`}>
                {activeDev.score}%
              </p>
            </div>

            <div className="glass-surface rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <CalendarX2Icon className="h-3.5 w-3.5 text-amber-500" />
                <span>Absence / Leave</span>
              </div>
              <p className="mt-1.5 text-xl font-extrabold tabular-nums text-navy dark:text-white">
                {activeDev.attendance.absentDays === 0 ? (
                  <span className="text-emerald-500 dark:text-emerald-400">0 Days (Full)</span>
                ) : (
                  <span className="text-amber-500">{activeDev.attendance.absentDays} Day(s)</span>
                )}
              </p>
            </div>

            <div className="glass-surface rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <ListCheckIcon className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                <span>Pending Works Cleared</span>
              </div>
              <p className="mt-1.5 text-xl font-extrabold tabular-nums text-navy dark:text-white">
                {activeDev.pendingWorks.resolved} / {activeDev.pendingWorks.assigned}{' '}
                <span className="text-xs font-bold text-brand dark:text-indigo-400">({activeDev.pendingWorks.resolutionRate}%)</span>
              </p>
            </div>

            <div className="glass-surface rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <CheckCircle2Icon className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                <span>Batch Audits</span>
              </div>
              <p className={`mt-1.5 text-xl font-extrabold tabular-nums ${
                activeDev.metrics.batchSubmissions.count === 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
              }`}>
                {activeDev.metrics.batchSubmissions.status === 'clean' ? 'Clean ✅' : `${activeDev.metrics.batchSubmissions.count} Flagged`}
              </p>
            </div>
          </div>
        </div>

        {/* INTERACTIVE GRAPHICAL ANALYSIS SECTION (2 COLUMNS) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* GRAPH 1: DAILY PERFORMANCE & ABSENCE/WORK HOURS GRAPH */}
          <div className="glass-card rounded-3xl p-6 shadow-glass space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-brand dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-navy dark:text-white">Performance Score & Daily Attendance Graph</h3>
              </div>
              <SegmentedControl
                size="sm"
                options={[
                  { id: 'daily', label: 'Daily (Mon-Fri)' },
                  { id: 'weekly', label: '4-Wk History' }
                ]}
                value={chartMode}
                onChange={(val) => setChartMode(val as 'daily' | 'weekly')}
              />
            </div>

            {/* VISUAL CHART AREA */}
            <div className="pt-2 pb-1 space-y-4">
              {chartMode === 'daily' ? (
                <div>
                  <div className="flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>Score % vs Daily Attendance</span>
                    <span className="font-semibold text-navy dark:text-white">Mon - Fri Breakdown</span>
                  </div>

                  {/* SVG Bar / Line Representation with Absence Indicator */}
                  <div className="flex items-end justify-between gap-3 h-48 border-b border-hairline px-4 pt-4">
                    {activeDev.dailyTrend.map((pt) => {
                      const isAbsent = pt.status === 'Absent' || pt.status === 'Leave' || pt.score === 0;
                      const heightPct = isAbsent ? 12 : Math.round((pt.score / maxDailyScore) * 100);
                      return (
                        <div key={pt.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          {/* Tooltip on Hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity glass-modal text-navy dark:text-white text-[10px] rounded-xl px-2.5 py-1.5 absolute -mt-16 pointer-events-none shadow-glass z-10 text-center border border-hairline">
                            {isAbsent ? (
                              <div className="font-bold text-amber-500 dark:text-amber-300">Status: {pt.status || 'Leave'}</div>
                            ) : (
                              <>
                                <div>Score: <span className="font-bold text-brand dark:text-indigo-400">{pt.score}%</span></div>
                                <div>Logged: {pt.hours} hrs</div>
                                <div>Commits: {pt.commits}</div>
                              </>
                            )}
                          </div>

                          {/* Bar */}
                          <div className="w-full max-w-[48px] glass-surface rounded-t-xl flex items-end h-full overflow-hidden">
                            <div
                              className={`w-full rounded-t-xl transition-all duration-500 shadow-sm ${
                                isAbsent ? 'bg-amber-500/80 border-t-2 border-amber-600' : activeStyles.fill
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>

                          {/* Label */}
                          <div className="text-center">
                            <span className="text-xs font-bold text-navy dark:text-white block">{pt.day}</span>
                            <span className={`text-[10px] block font-bold ${isAbsent ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {isAbsent ? pt.status : `${pt.score}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>4-Week Historical Score Progress</span>
                    <span className="font-semibold text-navy dark:text-white">Wk 1 – Wk 4</span>
                  </div>

                  {/* 4-Week Bar Chart */}
                  <div className="flex items-end justify-between gap-4 h-48 border-b border-hairline px-6 pt-4">
                    {activeDev.weeklyTrend.map((wk) => {
                      const heightPct = Math.round((wk.score / maxDailyScore) * 100);
                      return (
                        <div key={wk.week} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <div className="w-full max-w-[60px] glass-surface rounded-t-xl flex items-end h-full overflow-hidden">
                            <div
                              className={`w-full rounded-t-xl transition-all duration-500 ${activeStyles.fill}`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-bold text-navy dark:text-white block">{wk.week}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">{wk.score}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 px-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${activeStyles.fill}`} />
                  <span>Developer Score</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 ml-2" />
                  <span>Absent / Leave Day</span>
                </span>
                <span className="font-semibold text-navy dark:text-white">
                  Attendance: <span className="font-bold">{activeDev.attendance.presentDays}/5 Days Present</span>
                </span>
              </div>
            </div>
          </div>

          {/* GRAPH 2: CATEGORY BREAKDOWN VS TEAM AVERAGE */}
          <div className="glass-card rounded-3xl p-6 shadow-glass space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <ZapIcon className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-navy dark:text-white">Metric Breakdown vs Team Average</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Team: <strong className="text-navy dark:text-white">{activeDev.team}</strong>
              </span>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Category 1: Log Completeness */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy dark:text-white">Log Completeness (8/8 Hours)</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-navy dark:text-white">Dev: {activeDev.metrics.logRate.label}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 dark:text-slate-400">Team Avg: {activeDev.metrics.logRate.teamAvg}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${activeStyles.fill}`}
                      style={{ width: `${activeDev.metrics.logRate.value}%` }}
                    />
                  </div>
                  <div className="h-1.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400/60"
                      style={{ width: `${activeDev.metrics.logRate.teamAvg}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Category 2: Hourly Punctuality */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy dark:text-white">Hourly Punctuality (No Batching)</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-navy dark:text-white">Dev: {activeDev.metrics.ontimeRate.label}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 dark:text-slate-400">Team Avg: {activeDev.metrics.ontimeRate.teamAvg}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${activeStyles.fill}`}
                      style={{ width: `${activeDev.metrics.ontimeRate.value}%` }}
                    />
                  </div>
                  <div className="h-1.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400/60"
                      style={{ width: `${activeDev.metrics.ontimeRate.teamAvg}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Category 3: GitHub Code Activity */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy dark:text-white">GitHub Code Activity (Commits)</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-navy dark:text-white">Dev: {activeDev.metrics.commits.countText}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 dark:text-slate-400">Team Avg: {activeDev.metrics.commits.teamAvg}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${activeStyles.fill}`}
                      style={{ width: `${activeDev.metrics.commits.value}%` }}
                    />
                  </div>
                  <div className="h-1.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400/60"
                      style={{ width: `${activeDev.metrics.commits.teamAvg}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Category 4: Work Recovery & Backlog Clearance */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy dark:text-white">Work Recovery & Backlog Clearance</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-navy dark:text-white">Dev: {activeDev.pendingWorks.resolutionRate}%</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 dark:text-slate-400">Team Avg: {activeDev.pendingWorks.teamAvgResolutionRate}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${activeStyles.fill}`}
                      style={{ width: `${activeDev.pendingWorks.resolutionRate}%` }}
                    />
                  </div>
                  <div className="h-1.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400/60"
                      style={{ width: `${activeDev.pendingWorks.teamAvgResolutionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Category 5: Change Ratio (Rework %) */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy dark:text-white flex items-center gap-1">
                    <RefreshCwIcon className="h-3 w-3 text-rose-500" />
                    Change Ratio (Rework %)
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeDev.changeRatio.riskLevel === 'Low' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' :
                      activeDev.changeRatio.riskLevel === 'Moderate' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' :
                      'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                    }`}>{activeDev.changeRatio.riskLevel}</span>
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`font-bold ${
                      activeDev.changeRatio.riskLevel === 'Low' ? 'text-emerald-600 dark:text-emerald-400' :
                      activeDev.changeRatio.riskLevel === 'Moderate' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>Dev: {activeDev.changeRatio.ratio}%</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 dark:text-slate-400">Team Avg: {activeDev.changeRatio.teamAvgRatio}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        activeDev.changeRatio.riskLevel === 'Low' ? 'bg-emerald-500' :
                        activeDev.changeRatio.riskLevel === 'Moderate' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(activeDev.changeRatio.ratio, 100)}%` }}
                    />
                  </div>
                  <div className="h-1.5 w-full glass-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400/60"
                      style={{ width: `${activeDev.changeRatio.teamAvgRatio}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">{activeDev.changeRatio.note}</p>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-4 text-[11px] text-slate-500 dark:text-slate-400 border-t border-hairline pt-2">
                <span className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${activeStyles.fill}`} />
                  <span>Developer</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>Team Average</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED CATEGORY METRIC CARDS (4 CORE METRICS) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Log Completeness */}
          <div className="glass-card rounded-3xl p-5 shadow-glass space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-white">
                <FileTextIcon className="h-4 w-4 text-blue-500" />
                <span>Log Completeness</span>
              </div>
              <span className={`text-base font-extrabold tabular-nums ${activeStyles.text}`}>
                {activeDev.metrics.logRate.label}
              </span>
            </div>
            <div className="h-2 w-full glass-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${activeStyles.fill}`} style={{ width: `${activeDev.metrics.logRate.value}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Measures whether all 8 required daily work hours were logged (Coverage & Completeness).
            </p>
          </div>

          {/* Card 2: Hourly Punctuality */}
          <div className="glass-card rounded-3xl p-5 shadow-glass space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-white">
                <ClockIcon className="h-4 w-4 text-emerald-500" />
                <span>Hourly Punctuality</span>
              </div>
              <span className={`text-base font-extrabold tabular-nums ${activeStyles.text}`}>
                {activeDev.metrics.ontimeRate.label}
              </span>
            </div>
            <div className="h-2 w-full glass-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${activeStyles.fill}`} style={{ width: `${activeDev.metrics.ontimeRate.value}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Measures if logs were submitted on time hour-by-hour vs delayed end-of-day batching.
            </p>
          </div>

          {/* Card 3: GitHub Code Activity */}
          <div className="glass-card rounded-3xl p-5 shadow-glass space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-white">
                <GitCommitVerticalIcon className="h-4 w-4 text-purple-500" />
                <span>GitHub Code Activity</span>
              </div>
              <span className={`text-base font-extrabold tabular-nums ${activeStyles.text}`}>
                {activeDev.metrics.commits.countText}
              </span>
            </div>
            <div className="h-2 w-full glass-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${activeStyles.fill}`} style={{ width: `${activeDev.metrics.commits.value}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Automatic sync from repository commit logs mapped against hourly work logs.
            </p>
          </div>

          {/* Card 4: Work Recovery & Backlog Clearance */}
          <div className="glass-card rounded-3xl p-5 shadow-glass space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-white">
                <ListCheckIcon className="h-4 w-4 text-brand dark:text-indigo-400" />
                <span>Work Recovery & Backlog Clearance</span>
              </div>
              <span className={`text-base font-extrabold tabular-nums ${activeStyles.text}`}>
                {activeDev.pendingWorks.resolutionRate}%
              </span>
            </div>
            <div className="h-2 w-full glass-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${activeStyles.fill}`} style={{ width: `${activeDev.pendingWorks.resolutionRate}%` }} />
            </div>
            <p className="text-[11px] font-semibold text-navy dark:text-white">
              Cleared: {activeDev.pendingWorks.resolved} of {activeDev.pendingWorks.assigned} items
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {activeDev.pendingWorks.handlingSummary}
            </p>
          </div>
        </div>

        {/* CHANGE RATIO: SINGLE DEVELOPER CARD */}
        {(() => {
          const cr = activeDev.changeRatio;
          const riskBarColor = cr.riskLevel === 'Low' ? 'bg-emerald-500' : cr.riskLevel === 'Moderate' ? 'bg-amber-500' : 'bg-rose-500';
          const riskTextColor = cr.riskLevel === 'Low' ? 'text-emerald-600 dark:text-emerald-400' : cr.riskLevel === 'Moderate' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
          const riskBadgeBg = cr.riskLevel === 'Low' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-300' : cr.riskLevel === 'Moderate' ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-300' : 'bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-300';
          const riskBorderColor = cr.riskLevel === 'Low' ? 'border-emerald-500/30' : cr.riskLevel === 'Moderate' ? 'border-amber-500/30' : 'border-rose-500/30';
          const riskBg = cr.riskLevel === 'Low' ? 'bg-emerald-500/10' : cr.riskLevel === 'Moderate' ? 'bg-amber-500/10' : 'bg-rose-500/10';
          return (
            <div className={`glass-card rounded-3xl border p-6 shadow-glass space-y-4 ${riskBg} ${riskBorderColor}`}>
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCwIcon className="h-4 w-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-navy dark:text-white">Change Ratio — Code Rework Analysis</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${riskBadgeBg}`}>
                    {cr.riskLevel} Risk
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Lower % = Better</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* Left: Big ratio number */}
                <div className="glass-surface flex flex-col items-center justify-center rounded-2xl p-5 text-center shadow-glass">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Review Change Ratio</span>
                  <span className={`text-4xl font-black tabular-nums ${riskTextColor}`}>{cr.ratio}%</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{cr.changesRequested} changes requested / {cr.totalReviews} total reviews</span>
                </div>

                {/* Middle: bars */}
                <div className="sm:col-span-2 space-y-3 justify-center flex flex-col">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-navy dark:text-white">{activeDev.name}'s Change Ratio</span>
                      <span className={`font-extrabold ${riskTextColor}`}>{cr.ratio}%</span>
                    </div>
                    <div className="h-3 w-full glass-surface rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${riskBarColor}`} style={{ width: `${Math.min(cr.ratio, 100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Team Average</span>
                      <span className="font-bold text-slate-500 dark:text-slate-400">{cr.teamAvgRatio}%</span>
                    </div>
                    <div className="h-2 w-full glass-surface rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-slate-400/60 transition-all duration-500" style={{ width: `${cr.teamAvgRatio}%` }} />
                    </div>
                  </div>

                  <p className={`text-[11px] italic leading-relaxed ${riskTextColor} font-medium`}>{cr.note}</p>
                </div>
              </div>

              <div className="glass-surface rounded-2xl p-3.5 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <InfoIcon className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <p>
                  <strong className="text-navy dark:text-white">Change Ratio</strong> = percentage of code reviews where changes were requested by reviewers ({cr.changesRequested} changes requested out of {cr.totalReviews} total reviews received).
                  {' '}<span className="font-semibold text-emerald-500 dark:text-emerald-400">Low (&lt;30%)</span> = strong first-pass review approval rate.
                  {' '}<span className="font-semibold text-amber-500 dark:text-amber-400">Moderate (30–50%)</span> = recurring review revisions needed.
                  {' '}<span className="font-semibold text-rose-500 dark:text-rose-400">High (&gt;50%)</span> = frequent change requests; code quality review required.
                </p>
              </div>
            </div>
          );
        })()}

        {/* WARNING / AUDIT RECOMMENDATION BOX (IF FLAGGED OR POOR) */}
        {activeDev.warningNote && (
          <div className="glass-card rounded-3xl border border-rose-500/30 bg-rose-500/15 p-5 text-xs text-rose-900 dark:text-rose-200 space-y-2 shadow-glass">
            <div className="flex items-center gap-2 font-bold text-rose-500 dark:text-rose-400 text-sm">
              <AlertTriangleIcon className="h-5 w-5 text-rose-500 shrink-0" />
              <span>Performance & Absence Audit Notice</span>
            </div>
            <p className="font-medium leading-relaxed">{activeDev.warningNote}</p>
            {activeDev.recommendation && (
              <p className="font-bold text-rose-950 dark:text-rose-100 pt-1">
                👉 Recommended Action: {activeDev.recommendation}
              </p>
            )}
          </div>
        )}
      </>
    )}

        {/* HOW SCORE IS CALCULATED FOOTER (4 CORE METRICS x 25% WEIGHT) */}
        <div className="glass-card rounded-3xl p-6 shadow-glass space-y-4">
          <h3 className="text-sm font-bold text-navy dark:text-white flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4 text-brand dark:text-indigo-400" />
            How is the overall score calculated?
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-surface flex items-center gap-3 rounded-2xl p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-card text-blue-500 font-bold text-lg">
                📋
              </div>
              <div>
                <p className="text-xs font-bold text-navy dark:text-white">Log Completeness</p>
                <p className="text-[11px] font-extrabold text-brand dark:text-indigo-400">Weight: 25%</p>
              </div>
            </div>

            <div className="glass-surface flex items-center gap-3 rounded-2xl p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-card text-emerald-500 font-bold text-base">
                ⏰
              </div>
              <div>
                <p className="text-xs font-bold text-navy dark:text-white">Hourly Punctuality</p>
                <p className="text-[11px] font-extrabold text-brand dark:text-indigo-400">Weight: 25%</p>
              </div>
            </div>

            <div className="glass-surface flex items-center gap-3 rounded-2xl p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-card text-purple-500 font-bold text-base">
                💻
              </div>
              <div>
                <p className="text-xs font-bold text-navy dark:text-white">GitHub Code Activity</p>
                <p className="text-[11px] font-extrabold text-brand dark:text-indigo-400">Weight: 25%</p>
              </div>
            </div>

            <div className="glass-surface flex items-center gap-3 rounded-2xl p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-card text-indigo-500 font-bold text-base">
                🔄
              </div>
              <div>
                <p className="text-xs font-bold text-navy dark:text-white">Work Recovery & Backlog</p>
                <p className="text-[11px] font-extrabold text-brand dark:text-indigo-400">Weight: 25%</p>
              </div>
            </div>
          </div>

          <div className="glass-surface rounded-2xl p-3.5 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <InfoIcon className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <p>
              <strong className="text-navy dark:text-white">Audit Note:</strong> Absences generate pending log entries. Delayed end-of-day batch submissions reduce the score by <span className="font-bold text-rose-500">5% per occurrence</span>. All metrics are calculated automatically — no manual content is accessible by Admin.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
