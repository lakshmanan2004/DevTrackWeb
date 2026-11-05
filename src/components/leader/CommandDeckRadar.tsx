import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  RadioIcon,
  ClockIcon,
  CheckCircle2Icon,
  MoonIcon,
  XIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GitCommitIcon,
  ShieldIcon
} from 'lucide-react';
import { DeveloperStat } from '../../hooks/useLive';

interface CommandDeckRadarProps {
  developers: DeveloperStat[];
  onSelectDeveloper?: (devId: string) => void;
  selectedDeveloperId?: string | null;
  lastApprovedLogAt?: number;
}

type DevStatus = 'active' | 'idle' | 'review' | 'offline';

interface ProcessedDot {
  id: string;
  name: string;
  initials: string;
  email: string;
  team: string;
  project: string;
  activeMinutes: number;
  logs: number;
  commits: number;
  online: boolean;
  note: string;
  status: DevStatus;
  ringRadius: number;
  x: number;
  y: number;
}

const RING_CONFIG = {
  active: { radius: 80, label: 'ACTIVE OPS', color: '#10b981', dotColor: '#34d399' },
  idle: { radius: 140, label: 'STANDBY / IDLE', color: '#f59e0b', dotColor: '#fbbf24' },
  review: { radius: 200, label: 'LOG REVIEW', color: '#38bdf8', dotColor: '#60a5fa' },
  offline: { radius: 255, label: 'OFFLINE', color: '#64748b', dotColor: '#94a3b8' }
};

export const CommandDeckRadar = React.memo(function CommandDeckRadar({
  developers,
  onSelectDeveloper,
  selectedDeveloperId: _selectedDeveloperId,
  lastApprovedLogAt
}: CommandDeckRadarProps) {
  const [hoveredDot, setHoveredDot] = useState<ProcessedDot | null>(null);
  const [showMissionCleared, setShowMissionCleared] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);

  // Tab visibility listener
  useEffect(() => {
    const handleVisibility = () => setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Trigger calm "Mission Cleared" notification (<600ms) on log approval
  const prevApprovedRef = useRef(lastApprovedLogAt);
  useEffect(() => {
    if (lastApprovedLogAt && lastApprovedLogAt !== prevApprovedRef.current) {
      prevApprovedRef.current = lastApprovedLogAt;
      setShowMissionCleared(true);
      const timer = setTimeout(() => setShowMissionCleared(false), 580);
      return () => clearTimeout(timer);
    }
  }, [lastApprovedLogAt]);

  const radarSize = 580;
  const center = 290;

  // Compute 100% deterministic, stationary positions for developer dots
  const mappedDots = useMemo(() => {
    if (!developers || developers.length === 0) return [];

    const buckets: Record<DevStatus, DeveloperStat[]> = {
      active: [],
      idle: [],
      review: [],
      offline: []
    };

    developers.forEach((dev) => {
      if (!dev.online) {
        buckets.offline.push(dev);
      } else if (
        (dev as any).pendingLogs > 0 ||
        (dev as any).reviewPending ||
        (dev.note && dev.note.toLowerCase().includes('review'))
      ) {
        buckets.review.push(dev);
      } else if (dev.activeMinutes > 0 || dev.logs > 0) {
        buckets.active.push(dev);
      } else {
        buckets.idle.push(dev);
      }
    });

    const result: ProcessedDot[] = [];

    (Object.keys(buckets) as DevStatus[]).forEach((status) => {
      const items = buckets[status];
      // Deterministic sort by ID so dots never jump on updates
      items.sort((a, b) => a.id.localeCompare(b.id));

      const radius = RING_CONFIG[status].radius;
      const count = items.length;

      items.forEach((dev, idx) => {
        const startOffset = status === 'active' ? 0.35 : status === 'idle' ? 1.25 : status === 'review' ? 2.15 : 3.05;
        const angle = startOffset + (idx / Math.max(1, count)) * 2 * Math.PI;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);

        result.push({
          id: dev.id,
          name: dev.name,
          initials: dev.initials || dev.name.slice(0, 2).toUpperCase(),
          email: dev.email,
          team: dev.team || 'Engineering',
          project: dev.project || 'Active Sprint',
          activeMinutes: dev.activeMinutes || 0,
          logs: dev.logs || 0,
          commits: dev.commits || 0,
          online: dev.online,
          note: dev.note || '',
          status,
          ringRadius: radius,
          x,
          y
        });
      });
    });

    return result;
  }, [developers, center]);

  const counts = useMemo(() => {
    return {
      active: mappedDots.filter((d) => d.status === 'active').length,
      idle: mappedDots.filter((d) => d.status === 'idle').length,
      review: mappedDots.filter((d) => d.status === 'review').length,
      offline: mappedDots.filter((d) => d.status === 'offline').length
    };
  }, [mappedDots]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl glass-card border border-white/20 dark:border-white/10 p-5 shadow-glass">
      {/* HEADER & LEGEND CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline">
        <div className="flex items-center gap-2.5">
          <RadioIcon className="h-4 w-4 text-brand dark:text-sky-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Command Deck Radar
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Live orbital status & developer telemetry
            </p>
          </div>
        </div>

        {/* Status ring legend chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Active ({counts.active})
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Idle ({counts.idle})
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Review ({counts.review})
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 font-bold border border-slate-500/20">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            Offline ({counts.offline})
          </span>
        </div>
      </div>

      {/* RADAR CANVAS CONTAINER */}
      <div
        className="relative w-full flex items-center justify-center py-6 select-none min-h-[480px]"
      >
        {/* CALM MISSION CLEARED ANIMATION (<600ms) */}
        {showMissionCleared && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center animate-mission-cleared">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm shadow-xl">
              <CheckCircle2Icon className="h-4 w-4" />
              <span>Mission Cleared · Log Approved</span>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {developers.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <MoonIcon className="h-8 w-8 mx-auto text-slate-400 opacity-60" />
            <p className="text-sm font-bold text-navy dark:text-white">
              No active developers, deck is quiet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assigned team members will appear on orbital telemetry when they check in.
            </p>
          </div>
        ) : (
          <div className="relative w-full max-w-[540px] aspect-square">
            <svg
              viewBox={`0 0 ${radarSize} ${radarSize}`}
              className="w-full h-full overflow-visible select-none"
            >
              {/* Concentric Status Rings */}
              {Object.entries(RING_CONFIG).map(([key, config]) => (
                <g key={key}>
                  <circle
                    cx={center}
                    cy={center}
                    r={config.radius}
                    fill="none"
                    stroke={config.color}
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.3"
                  />
                  {/* Ring label */}
                  <text
                    x={center + 8}
                    y={center - config.radius + 12}
                    className="text-[8px] font-black uppercase tracking-wider fill-slate-400 dark:fill-slate-500 select-none pointer-events-none"
                  >
                    {config.label}
                  </text>
                </g>
              ))}

              {/* Radar Crosshairs */}
              <line
                x1={center}
                y1={center - 260}
                x2={center}
                y2={center + 260}
                stroke="rgba(148, 163, 184, 0.15)"
                strokeWidth="1"
              />
              <line
                x1={center - 260}
                y1={center}
                x2={center + 260}
                y2={center}
                stroke="rgba(148, 163, 184, 0.15)"
                strokeWidth="1"
              />

              {/* SLOW RADAR SWEEP LINE (Transform rotate only, centered at 290 290) */}
              {!isTabHidden && (
                <g
                  className="radar-sweep-rotate"
                  style={{
                    transformOrigin: `${center}px ${center}px`
                  }}
                >
                  <line
                    x1={center}
                    y1={center}
                    x2={center}
                    y2={center - 260}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                  <path
                    d={`M ${center} ${center} L ${center - 50} ${center - 250} A 260 260 0 0 1 ${center} ${center - 260} Z`}
                    fill="rgba(56, 189, 248, 0.08)"
                  />
                </g>
              )}

              {/* BRIDGE CORE CENTER */}
              <g transform={`translate(${center}, ${center})`}>
                <circle r="18" fill="rgba(37, 99, 235, 0.15)" stroke="#3b82f6" strokeWidth="1.5" />
                <circle r="6" fill="#3b82f6" />
                <text
                  y="30"
                  textAnchor="middle"
                  className="text-[8.5px] font-black uppercase tracking-wider fill-blue-600 dark:fill-blue-400 select-none pointer-events-none"
                >
                  BRIDGE CORE
                </text>
              </g>

              {/* DEVELOPER DOTS (Stationary coordinates, hover only - zero black focus outline) */}
              {mappedDots.map((dot) => {
                const isHovered = dot.id === hoveredDot?.id;

                return (
                  <g key={dot.id} transform={`translate(${dot.x}, ${dot.y})`}>
                    <g
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectDeveloper) onSelectDeveloper(dot.id);
                      }}
                      onMouseEnter={() => setHoveredDot(dot)}
                      onMouseLeave={() => setHoveredDot(null)}
                      className="cursor-pointer select-none group focus:outline-none"
                      style={{ outline: 'none' }}
                      aria-label={`${dot.name} - ${dot.status}`}
                    >
                      {/* Generous Hitbox Target */}
                      <circle r="22" fill="transparent" />

                      {/* Hover Indicator Ring */}
                      {isHovered && (
                        <circle
                          r="15"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Outer halo */}
                      <circle
                        r="10"
                        fill="rgba(255, 255, 255, 0.12)"
                        stroke={RING_CONFIG[dot.status].dotColor}
                        strokeWidth="1.5"
                        className="group-hover:scale-125 transition-transform duration-150"
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                      />

                      {/* Core dot */}
                      <circle r="5.5" fill={RING_CONFIG[dot.status].dotColor} />

                      {/* Initials label next to dot */}
                      <text
                        x="13"
                        y="3.5"
                        className="text-[10px] font-black fill-slate-800 dark:fill-slate-100 pointer-events-none tracking-tight select-none"
                      >
                        {dot.initials}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* RICH HOVER TELEMETRY CARD (Anchored directly next to the hovered dot inside SVG) */}
              {hoveredDot && (() => {
                const cardW = 224;
                const cardH = 138;
                const isRight = hoveredDot.x > center;
                const isBottom = hoveredDot.y > center;

                // Position strictly adjacent to the dot
                const cardX = isRight ? hoveredDot.x - cardW - 14 : hoveredDot.x + 14;
                const cardY = isBottom
                  ? Math.max(hoveredDot.y - cardH + 20, 14)
                  : Math.min(hoveredDot.y - 20, radarSize - cardH - 14);

                const statusColor = RING_CONFIG[hoveredDot.status].dotColor;

                return (
                  <g transform={`translate(${cardX}, ${cardY})`} className="pointer-events-none select-none">
                    {/* Dark frosted card surface */}
                    <rect
                      width={cardW}
                      height={cardH}
                      rx="14"
                      fill="#0f172a"
                      fillOpacity="0.94"
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="1.2"
                    />

                    {/* Header Label */}
                    <text
                      x="14"
                      y="20"
                      className="text-[9px] font-black uppercase tracking-wider fill-sky-400 select-none"
                    >
                      DEVELOPER TELEMETRY
                    </text>

                    {/* Status Pill Badge */}
                    <rect
                      x={cardW - 64}
                      y="10"
                      width="50"
                      height="15"
                      rx="7.5"
                      fill="rgba(255,255,255,0.08)"
                      stroke={statusColor}
                      strokeWidth="0.8"
                    />
                    <text
                      x={cardW - 39}
                      y="20.5"
                      textAnchor="middle"
                      className="text-[8px] font-extrabold capitalize fill-white select-none"
                    >
                      {hoveredDot.status}
                    </text>

                    {/* Developer Name */}
                    <text
                      x="14"
                      y="38"
                      className="text-[13px] font-black fill-white tracking-tight select-none"
                    >
                      {hoveredDot.name}
                    </text>

                    {/* Team & Project */}
                    <text
                      x="14"
                      y="52"
                      className="text-[9.5px] font-semibold fill-slate-400 select-none"
                    >
                      {hoveredDot.team.length > 15 ? hoveredDot.team.slice(0, 13) + '…' : hoveredDot.team} ·{' '}
                      {hoveredDot.project.length > 15 ? hoveredDot.project.slice(0, 13) + '…' : hoveredDot.project}
                    </text>

                    {/* Metric 1: Flight Time */}
                    <rect
                      x="14"
                      y="62"
                      width="92"
                      height="34"
                      rx="8"
                      fill="rgba(255, 255, 255, 0.05)"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="0.8"
                    />
                    <text
                      x="22"
                      y="74"
                      className="text-[8px] font-black uppercase tracking-wider fill-slate-400 select-none"
                    >
                      FLIGHT TIME
                    </text>
                    <text
                      x="22"
                      y="89"
                      className="text-[12px] font-black fill-white tabular-nums select-none"
                    >
                      {Math.round((hoveredDot.activeMinutes / 60) * 10) / 10} hrs
                    </text>

                    {/* Metric 2: Logs Today */}
                    <rect
                      x="116"
                      y="62"
                      width="94"
                      height="34"
                      rx="8"
                      fill="rgba(255, 255, 255, 0.05)"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="0.8"
                    />
                    <text
                      x="124"
                      y="74"
                      className="text-[8px] font-black uppercase tracking-wider fill-slate-400 select-none"
                    >
                      LOGS TODAY
                    </text>
                    <text
                      x="124"
                      y="89"
                      className="text-[12px] font-black fill-white tabular-nums select-none"
                    >
                      {hoveredDot.logs} logs
                    </text>

                    {/* Current Task Note */}
                    <rect
                      x="14"
                      y="102"
                      width={cardW - 28}
                      height="23"
                      rx="6"
                      fill="rgba(56, 189, 248, 0.12)"
                      stroke="rgba(56, 189, 248, 0.25)"
                      strokeWidth="0.8"
                    />
                    <text
                      x="22"
                      y="117"
                      className="text-[8.5px] font-semibold fill-sky-200 select-none"
                    >
                      {hoveredDot.note
                        ? hoveredDot.note.length > 29
                          ? hoveredDot.note.slice(0, 27) + '…'
                          : hoveredDot.note
                        : 'Session active · In progress'}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
});
