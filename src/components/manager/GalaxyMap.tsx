import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CompassIcon,
  PlayIcon,
  PauseIcon,
  ZoomOutIcon
} from 'lucide-react';

interface Module {
  name: string;
  description?: string;
  weightPercentage: number;
  status: 'todo' | 'in_progress' | 'completed';
  logsCount?: number;
  totalMinutes?: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  health: 'On Track' | 'Slightly Behind' | 'Behind' | 'Delivered on time' | string;
  progress: number;
  leader?: string;
  team?: string;
  developers?: number;
  started?: string;
  ended?: string;
  targetDate?: string;
  tasksDone?: number;
  blockers?: number;
  activeDevs?: number;
  inProgress?: number;
  modules?: Module[];
}

interface GalaxyMapProps {
  projects: Project[];
  onSelectProject?: (project: Project) => void;
  onCloseProjectModal?: (project: Project) => void;
}

// Flat matte colors for planets (strictly low saturation, zero glow)
const PLANET_PALETTES = [
  { fill: '#4f46e5', ring: '#818cf8', name: 'Indigo' },
  { fill: '#0d9488', ring: '#2dd4bf', name: 'Teal' },
  { fill: '#d97706', ring: '#fbbf24', name: 'Amber' },
  { fill: '#059669', ring: '#34d399', name: 'Emerald' },
  { fill: '#e11d48', ring: '#fb7185', name: 'Rose' },
  { fill: '#7c3aed', ring: '#a78bfa', name: 'Violet' },
  { fill: '#0284c7', ring: '#38bdf8', name: 'Sky' },
  { fill: '#c026d3', ring: '#e879f9', name: 'Fuchsia' },
  { fill: '#475569', ring: '#94a3b8', name: 'Slate' }
];

// Helper to provide standard milestone modules if none exist
function getProjectModules(project: Project): Module[] {
  if (project.modules && project.modules.length > 0) {
    return project.modules;
  }
  const prog = project.progress || 0;
  return [
    {
      name: 'Architecture & Design',
      weightPercentage: 25,
      status: 'completed'
    },
    {
      name: 'Core Services & APIs',
      weightPercentage: 25,
      status: prog >= 40 ? 'completed' : prog >= 15 ? 'in_progress' : 'todo'
    },
    {
      name: 'UI Components',
      weightPercentage: 25,
      status: prog >= 75 ? 'completed' : prog >= 40 ? 'in_progress' : 'todo'
    },
    {
      name: 'Verification & QA',
      weightPercentage: 25,
      status: prog >= 100 ? 'completed' : prog >= 75 ? 'in_progress' : 'todo'
    }
  ];
}

// Memoized Single Planet Component (SVG)
interface PlanetProps {
  project: Project;
  x: number;
  y: number;
  radius: number;
  palette: { fill: string; ring: string };
  isFocused: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
}

const PlanetNode = React.memo(function PlanetNode({
  project,
  x,
  y,
  radius,
  palette,
  onClick,
  onDoubleClick
}: PlanetProps) {
  const circ = 2 * Math.PI * (radius + 4);
  const strokeOffset = circ - (circ * Math.max(0, Math.min(100, project.progress || 0))) / 100;
  const displayName = project.name.length > 15 ? project.name.slice(0, 13) + '…' : project.name;
  const labelWidth = Math.max(76, displayName.length * 6.5 + 20);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g
        role="button"
        tabIndex={0}
        aria-label={`Planet ${project.name}, ${project.progress}% complete. 1-click for moons, 2-clicks for list view`}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onDoubleClick(e as any);
          } else if (e.key === ' ') {
            e.preventDefault();
            onClick(e as any);
          }
        }}
        className="cursor-pointer select-none group focus:outline-none"
        style={{ outline: 'none' }}
      >
        {/* Generous Hitbox Target */}
        <circle r={radius + 18} fill="transparent" />

        {/* Orbit Track Ring for Progress Gauge */}
        <circle
          r={radius + 4}
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="2.5"
        />

        {/* Progress Ring Fill via strokeDashoffset */}
        <circle
          r={radius + 4}
          fill="none"
          stroke={palette.ring}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={strokeOffset}
          transform="rotate(-90)"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />

        {/* Flat Matte Planet Body (No specular shine, no drop shadow glow) */}
        <circle
          r={radius}
          fill={palette.fill}
          className="transition-opacity duration-150 group-hover:opacity-90"
        />

        {/* Subtle flat surface equator ring line */}
        <path
          d={`M ${-radius * 0.75} 0 A ${radius * 0.75} ${radius * 0.3} 0 0 0 ${radius * 0.75} 0`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1.2"
        />

        {/* HIGH-CONTRAST MATTE LABEL PILL (Strictly horizontal, zero tilt) */}
        <g transform={`translate(0, ${radius + 12})`} className="pointer-events-none">
          <rect
            x={-labelWidth / 2}
            y="0"
            width={labelWidth}
            height="28"
            rx="7"
            className="fill-white/90 dark:fill-slate-900/90 stroke-slate-300/70 dark:stroke-white/15"
            strokeWidth="1"
          />
          <text
            y="12"
            textAnchor="middle"
            className="text-[9.5px] font-black fill-slate-900 dark:fill-slate-100 tracking-tight"
          >
            {displayName}
          </text>
          <text
            y="23"
            textAnchor="middle"
            className="text-[8.5px] font-extrabold fill-slate-500 dark:fill-slate-400 tabular-nums"
          >
            {project.progress}% Complete
          </text>
        </g>
      </g>
    </g>
  );
});

const STORAGE_KEY_ORBIT_PAUSED = 'devtrack_galaxy_orbit_paused';

export const GalaxyMap = React.memo(function GalaxyMap({
  projects,
  onSelectProject
}: GalaxyMapProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isPausedManual, setIsPausedManual] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ORBIT_PAUSED) === 'true';
    } catch {
      return false;
    }
  });
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const toggleOrbitMotion = useCallback(() => {
    setIsPausedManual((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_ORBIT_PAUSED, String(next));
      } catch (err) {
        console.error('Failed to save orbit pause preference', err);
      }
      return next;
    });
  }, []);

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Viewport dimensions
  const width = 1000;
  const height = 650;
  const centerX = 500;
  const centerY = 325;

  // Track visibility API to pause orbits when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Reduced motion media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mediaQuery.removeEventListener('change', handleMotionChange);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation: Esc to hide moons
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusedId) {
        setFocusedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedId]);

  // Orbit motion active condition
  const isOrbitMotionActive = !isPausedManual && !isTabHidden && !isReducedMotion;

  // Mathematical Orbit Motion via requestAnimationFrame
  // Completely eliminates SVG CSS transform wobble, fill-box pivot drift, and out-of-phase tilted text
  const [orbitAngle, setOrbitAngle] = useState(0);
  const [moonOrbitAngle, setMoonOrbitAngle] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOrbitMotionActive) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const orbitSpeed = (2 * Math.PI) / 140000; // 1 revolution every 140s
    const moonSpeed = (2 * Math.PI) / 24000;   // 1 revolution every 24s

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const dt = Math.min(now - lastTimeRef.current, 100);
        setOrbitAngle((prev) => (prev + dt * orbitSpeed) % (2 * Math.PI));
        setMoonOrbitAngle((prev) => (prev + dt * moonSpeed) % (2 * Math.PI));
      }
      lastTimeRef.current = now;
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [isOrbitMotionActive]);

  // Distribute projects across 3 concentric orbital tracks with ample radial separation
  const trackRadii = [145, 230, 315];

  const tracks = useMemo(() => {
    const t: { radius: number; planets: any[] }[] = [
      { radius: trackRadii[0], planets: [] },
      { radius: trackRadii[1], planets: [] },
      { radius: trackRadii[2], planets: [] }
    ];

    projects.forEach((proj, idx) => {
      const trackIndex = idx % 3;
      t[trackIndex].planets.push({ proj, originalIndex: idx });
    });

    return t.map((track, tIdx) => {
      const count = track.planets.length;
      const angleStep = count > 0 ? (2 * Math.PI) / count : 0;
      // Stagger each concentric ring by 120deg (2*PI/3) so planets on adjacent tracks never align or collide
      const baseOffset = tIdx * ((2 * Math.PI) / 3) + 0.35;

      const placed = track.planets.map((item, pIdx) => {
        // True circular orbit position (constant distance track.radius from center - zero wobble!)
        const angle = baseOffset + pIdx * angleStep + orbitAngle;
        const x = centerX + track.radius * Math.cos(angle);
        const y = centerY + track.radius * Math.sin(angle);
        const radius = 22 + (item.originalIndex % 3) * 3; // 22, 25, 28 px
        const palette = PLANET_PALETTES[item.originalIndex % PLANET_PALETTES.length];

        return {
          project: item.proj,
          x,
          y,
          radius,
          palette,
          trackIndex: tIdx
        };
      });

      return {
        radius: track.radius,
        planets: placed
      };
    });
  }, [projects, centerX, centerY, orbitAngle]);

  // Flattened planets array
  const allPlanets = useMemo(() => {
    return tracks.flatMap((t) => t.planets);
  }, [tracks]);

  // Currently focused planet (single-clicked to show moons)
  const focusedPlanet = useMemo(() => {
    if (!focusedId) return null;
    return allPlanets.find((p) => p.project.id === focusedId) || null;
  }, [focusedId, allPlanets]);

  // Orbiting Moons for the focused planet - mathematically positioned relative to planet's current (x, y)
  const focusedMoons = useMemo(() => {
    if (!focusedPlanet) return [];
    const modules = getProjectModules(focusedPlanet.project);
    const moonCount = modules.length;
    if (moonCount === 0) return [];

    // Generous orbit radius so planet and its pill stay nicely centered within the moons
    const orbitRadius = focusedPlanet.radius + 44;
    return modules.map((mod, i) => {
      const angle = (i / moonCount) * 2 * Math.PI + moonOrbitAngle;
      const mx = focusedPlanet.x + orbitRadius * Math.cos(angle);
      const my = focusedPlanet.y + orbitRadius * Math.sin(angle);
      const isCompleted = mod.status === 'completed';
      const isInProgress = mod.status === 'in_progress';

      return {
        module: mod,
        x: mx,
        y: my,
        fill: isCompleted ? '#10b981' : isInProgress ? '#0284c7' : '#94a3b8'
      };
    });
  }, [focusedPlanet, moonOrbitAngle]);

  // Single click: show / toggle moons
  const handlePlanetClick = useCallback((project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    clickTimeoutRef.current = setTimeout(() => {
      setFocusedId((prev) => (prev === project.id ? null : project.id));
      clickTimeoutRef.current = null;
    }, 240);
  }, []);

  // Double click (2 clicks): navigate to List View filtered to this project!
  const handlePlanetDoubleClick = useCallback((project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (onSelectProject) {
      onSelectProject(project);
    }
  }, [onSelectProject]);

  const handleCanvasClick = useCallback(() => {
    if (focusedId) {
      setFocusedId(null);
    }
  }, [focusedId]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl glass-card border border-white/20 dark:border-white/10 shadow-glass focus:outline-none"
      style={{ outline: 'none' }}
    >
      {/* TOP HEADER CONTROLS OVERLAY */}
      <div className="absolute top-4 left-5 right-5 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <CompassIcon className="h-3.5 w-3.5 text-brand dark:text-sky-400" />
            <span>Galaxy Map · Architectural Orbit</span>
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            ({projects.length} Planets)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Working Pause / Resume Button */}
          <button
            type="button"
            onClick={toggleOrbitMotion}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md border ${
              isPausedManual
                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-brand/15 hover:bg-brand/25 text-brand dark:text-sky-300 border-brand/30'
            }`}
            title={isPausedManual ? 'Click to Resume Orbit Motion' : 'Click to Pause Orbit Motion'}
          >
            {isPausedManual ? (
              <>
                <PlayIcon className="h-3.5 w-3.5 fill-current" />
                <span>Resume Motion</span>
              </>
            ) : (
              <>
                <PauseIcon className="h-3.5 w-3.5 fill-current" />
                <span>Pause Motion</span>
              </>
            )}
          </button>

          {/* Reset / Hide Moons Button or Instruction Helper */}
          {focusedId ? (
            <button
              type="button"
              onClick={() => setFocusedId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold shadow-lg transition-all cursor-pointer backdrop-blur-md"
              title="Hide Moons (Esc)"
            >
              <ZoomOutIcon className="h-3.5 w-3.5" />
              <span>Hide Moons [ESC]</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 border border-slate-300/60 dark:border-white/10 px-3 py-1 rounded-xl shadow-xs">
              1-Click: Moons · 2-Clicks: Project List
            </span>
          )}
        </div>
      </div>

      {/* SVG GALAXY CANVAS */}
      <div
        className="w-full h-[540px] sm:h-[600px] flex items-center justify-center bg-slate-900/[0.04] dark:bg-black/40 focus:outline-none"
        onClick={handleCanvasClick}
        style={{ outline: 'none' }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none focus:outline-none"
          style={{ maxHeight: '620px', outline: 'none' }}
        >
          <defs>
            {/* Flat Star Points */}
            <pattern id="galaxy-stars" width="140" height="140" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="30" r="0.8" fill="rgba(148, 163, 184, 0.4)" />
              <circle cx="85" cy="45" r="0.6" fill="rgba(148, 163, 184, 0.3)" />
              <circle cx="50" cy="95" r="0.75" fill="rgba(148, 163, 184, 0.35)" />
              <circle cx="115" cy="115" r="0.5" fill="rgba(148, 163, 184, 0.25)" />
              <circle cx="130" cy="20" r="0.6" fill="rgba(148, 163, 184, 0.3)" />
            </pattern>
          </defs>

          {/* Canvas Background */}
          <rect width={width} height={height} fill="url(#galaxy-stars)" />

          {/* MAIN GROUP */}
          <g>
            {/* Galactic Core Center Marker */}
            <g transform={`translate(${centerX}, ${centerY})`}>
              <circle r="4.5" fill="#64748b" opacity="0.8" />
              <circle
                r="38"
                fill="none"
                stroke="currentColor"
                className="text-slate-400/50 dark:text-slate-400/40"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                y="52"
                textAnchor="middle"
                className="text-[8px] font-black uppercase tracking-wider fill-slate-400 dark:fill-slate-500 pointer-events-none select-none"
              >
                GALACTIC CORE
              </text>
            </g>

            {/* Concentric Static Orbital Path Rings - crisp visibility in light and dark mode */}
            {trackRadii.map((r, i) => (
              <circle
                key={i}
                cx={centerX}
                cy={centerY}
                r={r}
                fill="none"
                stroke="currentColor"
                className="text-slate-400/50 dark:text-slate-400/40"
                strokeWidth="1.8"
                strokeDasharray="6 6"
              />
            ))}

            {/* PLANETS ACROSS CONCENTRIC ORBITAL TRACKS (Mathematically positioned - zero wobble/drift) */}
            {tracks.map((track, tIdx) => (
              <g key={tIdx}>
                {track.planets.map((item) => (
                  <PlanetNode
                    key={item.project.id}
                    project={item.project}
                    x={item.x}
                    y={item.y}
                    radius={item.radius}
                    palette={item.palette}
                    isFocused={item.project.id === focusedId}
                    onClick={(e) => handlePlanetClick(item.project, e)}
                    onDoubleClick={(e) => handlePlanetDoubleClick(item.project, e)}
                  />
                ))}
              </g>
            ))}

            {/* FOCUSED PLANET'S ORBITING MOONS (Concentric with planet, always strictly horizontal text) */}
            {focusedPlanet && focusedMoons.length > 0 && (
              <g className="pointer-events-none">
                {/* Orbit track ring around focused planet - exactly centered at (focusedPlanet.x, focusedPlanet.y) */}
                <circle
                  cx={focusedPlanet.x}
                  cy={focusedPlanet.y}
                  r={focusedPlanet.radius + 44}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                  opacity="0.9"
                />

                {focusedMoons.map((moon, mIdx) => {
                  const displayName =
                    moon.module.name.length > 13
                      ? moon.module.name.slice(0, 11) + '…'
                      : moon.module.name;
                  const mLabelWidth = Math.max(54, displayName.length * 5.8 + 14);

                  return (
                    <g key={mIdx} transform={`translate(${moon.x}, ${moon.y})`}>
                      {/* Moon body */}
                      <circle r="6.5" fill={moon.fill} />
                      <circle r="8" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />

                      {/* Moon Label Pill - guaranteed 100% horizontal at all times */}
                      <g className="pointer-events-none select-none">
                        <rect
                          x={-mLabelWidth / 2}
                          y="-21"
                          width={mLabelWidth}
                          height="15"
                          rx="4.5"
                          className="fill-white/95 dark:fill-slate-900/95 stroke-slate-300/80 dark:stroke-slate-700/80"
                          strokeWidth="0.8"
                        />
                        <text
                          y="-10.5"
                          textAnchor="middle"
                          className="text-[8px] font-bold fill-slate-900 dark:fill-slate-100"
                        >
                          {displayName}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
});
