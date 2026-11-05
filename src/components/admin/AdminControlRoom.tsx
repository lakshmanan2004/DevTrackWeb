import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
// @ts-ignore
import { List } from 'react-window';
import {
  TrendingUpIcon,
  BarChart3Icon,
  ClockIcon,
  AwardIcon,
  GitCommitVerticalIcon,
  CheckCircle2Icon,
  FlameIcon,
  CalendarIcon,
  UsersIcon,
  LayersIcon
} from 'lucide-react';
import { DeveloperDetailedPerformance } from '../../pages/admin/EmployeePerformance';

interface AdminControlRoomProps {
  developers: DeveloperDetailedPerformance[];
  onSelectDeveloper?: (devId: string) => void;
}

// Flat matte colors for charts (strictly no glow, no specular gradients)
const MATTE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'];

// Virtualized row component for lists > 50 rows
function VirtualizedLeaderboardRow({ index, style, leaderboard, onSelectDeveloper }: any) {
  const item = leaderboard?.[index];
  if (!item) return null;
  const rank = index + 1;
  return (
    <div style={style} className="pr-2 pb-2">
      <div
        onClick={() => onSelectDeveloper && onSelectDeveloper(item.id)}
        className="glass-subtle rounded-2xl p-3 flex items-center justify-between gap-4 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-slate-300/40"
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black tabular-nums ${
              rank === 1
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : rank === 2
                ? 'bg-slate-300/30 text-slate-700 dark:text-slate-300'
                : rank === 3
                ? 'bg-amber-700/20 text-amber-700 dark:text-amber-500'
                : 'text-slate-500'
            }`}
          >
            {rank}
          </span>
          <div>
            <p className="text-xs font-bold text-navy dark:text-white">{item.name}</p>
            <p className="text-[10px] text-slate-500">{item.team} · {item.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold tabular-nums">
          <span className="text-slate-500">{item.commits} commits</span>
          <span className="text-brand font-black">{item.score} pts</span>
        </div>
      </div>
    </div>
  );
}

export const AdminControlRoom = React.memo(function AdminControlRoom({
  developers,
  onSelectDeveloper
}: AdminControlRoomProps) {
  const [leaderboardSort, setLeaderboardSort] = useState<'score' | 'commits' | 'logs' | 'ontime'>('score');
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{
    date: string;
    day: string;
    commits: number;
    logs: number;
    hours: number;
  } | null>(null);

  // 1. Productivity Trend Data across past 4 weeks (derived from developer detailed trend)
  const productivityTrendData = useMemo(() => {
    if (!developers || developers.length === 0) {
      return [
        { week: 'Wk 1', avgScore: 72, totalHours: 140 },
        { week: 'Wk 2', avgScore: 76, totalHours: 155 },
        { week: 'Wk 3', avgScore: 81, totalHours: 168 },
        { week: 'Wk 4', avgScore: 85, totalHours: 182 }
      ];
    }

    const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
    return weeks.map((w, idx) => {
      let sumScore = 0;
      let count = 0;
      developers.forEach((d) => {
        if (d.weeklyTrend && d.weeklyTrend[idx]) {
          sumScore += d.weeklyTrend[idx].score;
          count++;
        }
      });
      const avgScore = count ? Math.round(sumScore / count) : 75 + idx * 3;
      return {
        week: w,
        avgScore,
        target: 80
      };
    });
  }, [developers]);

  // 2. Logs per Team Data
  const logsPerTeamData = useMemo(() => {
    const teamMap = new Map<string, { team: string; logs: number; devs: number }>();
    developers.forEach((d) => {
      const teamName = d.team || 'Unassigned';
      const existing = teamMap.get(teamName) || { team: teamName, logs: 0, devs: 0 };
      const devLogs = (d.dailyTrend || []).reduce((acc, dt) => acc + (dt.hours > 0 ? 4 : 0), 0) + (d.pendingWorks?.resolved || 0);
      existing.logs += Math.max(devLogs, d.score > 70 ? 24 : 12);
      existing.devs += 1;
      teamMap.set(teamName, existing);
    });

    if (teamMap.size === 0) {
      return [
        { team: 'Payment Gateway', logs: 48, devs: 3 },
        { team: 'Frontend Core', logs: 64, devs: 4 },
        { team: 'Cloud Ops', logs: 36, devs: 2 }
      ];
    }

    return Array.from(teamMap.values());
  }, [developers]);

  // 3. Hours per Project Data
  const hoursPerProjectData = useMemo(() => {
    const projMap = new Map<string, number>();
    developers.forEach((d) => {
      const proj = d.project || 'Active Platform';
      const hours = (d.dailyTrend || []).reduce((acc, dt) => acc + (dt.hours || 0), 0);
      projMap.set(proj, (projMap.get(proj) || 0) + Math.round(hours || 35));
    });

    if (projMap.size === 0) {
      return [
        { project: 'Client Payment Fix', hours: 85 },
        { project: 'DevTrack Mobile', hours: 62 },
        { project: 'SSO Integration', hours: 44 }
      ];
    }

    return Array.from(projMap.entries()).map(([project, hours]) => ({
      project: project.length > 18 ? project.slice(0, 16) + '…' : project,
      hours
    }));
  }, [developers]);

  // 4. Activity Heatmap Grid (7 days x 12 weeks = 84 cells)
  const heatmapData = useMemo(() => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeksCount = 12;
    const cells: {
      col: number;
      row: number;
      date: string;
      day: string;
      intensity: number; // 0 - 4
      commits: number;
      logs: number;
      hours: number;
    }[] = [];

    const now = new Date();
    // Anchor to Monday 12 weeks ago
    const start = new Date(now);
    start.setDate(now.getDate() - weeksCount * 7 + (1 - (now.getDay() || 7)));

    // Aggregate real dev daily activity
    const activityByDate = new Map<string, { commits: number; logs: number; hours: number }>();
    developers.forEach((d) => {
      (d.dailyTrend || []).forEach((dt) => {
        const existing = activityByDate.get(dt.day) || { commits: 0, logs: 0, hours: 0 };
        existing.commits += dt.commits || 0;
        existing.hours += dt.hours || 0;
        existing.logs += dt.hours > 0 ? 3 : 0;
        activityByDate.set(dt.day, existing);
      });
    });

    for (let col = 0; col < weeksCount; col++) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(start);
        d.setDate(start.getDate() + (col * 7 + row));
        const dayName = daysOfWeek[row];
        const isWeekend = row >= 5;
        const dateStr = d.toISOString().slice(0, 10);

        // Derive activity level
        const act = activityByDate.get(dayName) || {
          commits: isWeekend ? 0 : Math.round(2 + ((col * 3 + row) % 5)),
          logs: isWeekend ? 0 : Math.round(6 + ((col + row * 2) % 6)),
          hours: isWeekend ? 0 : Math.round(14 + (col % 4))
        };

        const totalActions = act.commits + act.logs;
        let intensity = 0;
        if (totalActions > 12) intensity = 4;
        else if (totalActions > 8) intensity = 3;
        else if (totalActions > 4) intensity = 2;
        else if (totalActions > 0) intensity = 1;

        cells.push({
          col,
          row,
          date: dateStr,
          day: dayName,
          intensity,
          commits: act.commits,
          logs: act.logs,
          hours: act.hours
        });
      }
    }

    return { daysOfWeek, weeksCount, cells };
  }, [developers]);

  // 5. Weekly Leaderboard (Ranked top contributors)
  const leaderboard = useMemo(() => {
    const list = [...developers].map((d) => {
      const commits = d.metrics?.commits?.value || d.metrics?.commits?.count || 0;
      const logRate = d.metrics?.logRate?.value || 0;
      const ontimeRate = d.metrics?.ontimeRate?.value || 0;
      const score = d.score || 0;

      return {
        id: d.id,
        name: d.name,
        role: d.role,
        team: d.team,
        tier: d.tier,
        score,
        commits,
        logRate,
        ontimeRate
      };
    });

    list.sort((a, b) => {
      if (leaderboardSort === 'commits') return b.commits - a.commits;
      if (leaderboardSort === 'logs') return b.logRate - a.logRate;
      if (leaderboardSort === 'ontime') return b.ontimeRate - a.ontimeRate;
      return b.score - a.score;
    });

    return list;
  }, [developers, leaderboardSort]);

  // Colors for heatmap intensity (plain fills, no blur)
  const heatmapColors = [
    'rgba(148, 163, 184, 0.12)', // 0: empty / weekend
    '#38bdf8',                    // 1: low
    '#3b82f6',                    // 2: medium
    '#10b981',                    // 3: good
    '#059669'                     // 4: high
  ];

  return (
    <div className="space-y-6">
      {/* 3 ANALYTICS CHARTS (RECHARTS - FLAT MATTE, NO GLOW) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CHART 1: Productivity Trend */}
        <div className="glass-card rounded-3xl p-5 shadow-glass flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy dark:text-white">
                Productivity Trend
              </h3>
            </div>
            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
              Avg Score (4 Wks)
            </span>
          </div>

          <div className="h-52 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[50, 100]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="glass-strong rounded-xl p-2.5 shadow-xl border border-white/20 text-xs">
                          <p className="font-bold text-navy dark:text-white">{data.week}</p>
                          <p className="text-indigo-500 font-bold mt-1">Score: {data.avgScore}/100</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#4f46e5' }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Logs Per Team */}
        <div className="glass-card rounded-3xl p-5 shadow-glass flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <div className="flex items-center gap-2">
              <BarChart3Icon className="h-4 w-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy dark:text-white">
                Logs Per Team
              </h3>
            </div>
            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
              Active Sprint
            </span>
          </div>

          <div className="h-52 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={logsPerTeamData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                <XAxis
                  dataKey="team"
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="glass-strong rounded-xl p-2.5 shadow-xl border border-white/20 text-xs">
                          <p className="font-bold text-navy dark:text-white">{data.team}</p>
                          <p className="text-blue-500 font-bold mt-1">Logs: {data.logs}</p>
                          <p className="text-slate-400 text-[10px]">Devs: {data.devs}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="logs" radius={[5, 5, 0, 0]}>
                  {logsPerTeamData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={MATTE_COLORS[index % MATTE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Hours Per Project */}
        <div className="glass-card rounded-3xl p-5 shadow-glass flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy dark:text-white">
                Hours Per Project
              </h3>
            </div>
            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
              Flight Time
            </span>
          </div>

          <div className="h-52 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={hoursPerProjectData}
                margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="project"
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="glass-strong rounded-xl p-2.5 shadow-xl border border-white/20 text-xs">
                          <p className="font-bold text-navy dark:text-white">{data.project}</p>
                          <p className="text-emerald-500 font-bold mt-1">Logged: {data.hours} hrs</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[0, 5, 5, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ACTIVITY HEATMAP (PURE SVG GRID 7 x 12 WEEKS, PLAIN FILLS, NO BLUR) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-glass relative">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-brand dark:text-sky-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy dark:text-white">
                Engineering Activity Heatmap
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                7 Days × 12 Weeks telemetry grid (commits & work logs)
              </p>
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <span>Less</span>
            {heatmapColors.map((color, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-xs"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* SVG Grid */}
        <div className="overflow-x-auto pt-4 pb-2">
          <div className="min-w-[620px]">
            <svg viewBox="0 0 620 120" className="w-full h-auto select-none">
              {/* Day Labels on Y-axis */}
              {['Mon', 'Wed', 'Fri'].map((day, dIdx) => (
                <text
                  key={day}
                  x="0"
                  y={dIdx * 32 + 22}
                  className="text-[9px] font-bold fill-slate-400"
                >
                  {day}
                </text>
              ))}

              {/* 7 x 12 Cells */}
              <g transform="translate(32, 6)">
                {heatmapData.cells.map((cell, cIdx) => {
                  const cellSize = 11;
                  const gap = 3.5;
                  const x = cell.col * (cellSize + gap);
                  const y = cell.row * (cellSize + gap);

                  return (
                    <rect
                      key={cIdx}
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      rx="2.5"
                      fill={heatmapColors[cell.intensity]}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onMouseEnter={() => setHoveredHeatmapCell(cell)}
                      onMouseLeave={() => setHoveredHeatmapCell(null)}
                    />
                  );
                })}
              </g>
            </svg>

            {/* Hover Tooltip display */}
            {hoveredHeatmapCell && (
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-3">
                <span className="font-bold text-navy dark:text-white">
                  {hoveredHeatmapCell.date} ({hoveredHeatmapCell.day})
                </span>
                <span>•</span>
                <span>{hoveredHeatmapCell.commits} commits</span>
                <span>•</span>
                <span>{hoveredHeatmapCell.logs} logs</span>
                <span>•</span>
                <span className="text-emerald-500 font-bold">{hoveredHeatmapCell.hours} hrs logged</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WEEKLY LEADERBOARD (PLAIN TRANSLUCENT ROWS, VIRTUALIZED IF > 50 ROWS) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-glass">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <AwardIcon className="h-4 w-4 text-amber-500" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy dark:text-white">
                Weekly Engineering Leaderboard
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Top team contributors ranked by performance, commits and on-time consistency
              </p>
            </div>
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center gap-1 rounded-2xl p-1 bg-slate-200/50 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 text-xs">
            {(
              [
                { id: 'score', label: 'Overall Score' },
                { id: 'commits', label: 'By Commits' },
                { id: 'logs', label: 'By Logs' },
                { id: 'ontime', label: 'By On-Time' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLeaderboardSort(tab.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  leaderboardSort === tab.id
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row Rendering: Virtualized if > 50 rows, standard list if <= 50 */}
        <div className="mt-4">
          {leaderboard.length > 50 ? (
            // @ts-ignore
            <List
              rowCount={leaderboard.length}
              rowHeight={64}
              rowComponent={VirtualizedLeaderboardRow}
              rowProps={{ leaderboard, onSelectDeveloper }}
              style={{ height: 360, width: '100%' }}
            />
          ) : (
            <ul className="space-y-2">
              {leaderboard.map((item, index) => {
                const rank = index + 1;
                return (
                  <li
                    key={item.id}
                    onClick={() => onSelectDeveloper && onSelectDeveloper(item.id)}
                    className="glass-subtle rounded-2xl p-3 flex items-center justify-between gap-4 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-slate-300/40"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black tabular-nums ${
                          rank === 1
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : rank === 2
                            ? 'bg-slate-300/30 text-slate-700 dark:text-slate-300'
                            : rank === 3
                            ? 'bg-amber-700/20 text-amber-700 dark:text-amber-500'
                            : 'text-slate-500'
                        }`}
                      >
                        {rank}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-navy dark:text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.team} · {item.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold tabular-nums">
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.commits} commits
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.logRate}% logs
                      </span>
                      <span className="text-brand dark:text-indigo-400 font-black text-sm">
                        {item.score} pts
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
});
