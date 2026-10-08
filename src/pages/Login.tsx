import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  LockIcon,
  MailIcon,
  SettingsIcon,
  TerminalIcon,
  UserCogIcon,
  UsersIcon } from
'lucide-react';
import { Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePublicStats } from '../hooks/useLive';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const roleTabs: {
  id: Role;
  label: string;
  icon: React.ReactNode;
  info: string;
  path: string;
}[] = [
{
  id: 'developer',
  label: 'Developer',
  icon: <TerminalIcon className="h-4 w-4" />,
  info: 'You can only see your own work logs, commits and profile. Completely private.',
  path: '/developer'
},
{
  id: 'leader',
  label: 'Team Leader',
  icon: <UsersIcon className="h-4 w-4" />,
  info: "You can monitor your assigned team's progress within your project only.",
  path: '/leader'
},
{
  id: 'manager',
  label: 'Project Manager',
  icon: <UserCogIcon className="h-4 w-4" />,
  info: 'You can create projects, build teams, assign leaders and developers. You will see high-level project progress only.',
  path: '/manager'
},
{
  id: 'admin',
  label: 'Admin',
  icon: <SettingsIcon className="h-4 w-4" />,
  info: 'You can add and remove users and assign roles only. You can view all ongoing and completed projects as overview.',
  path: '/admin'}];


export function Login() {
  const navigate = useNavigate();
  const { login, logout, user, loading } = useAuth();
  const { data: stats } = usePublicStats();
  const [role, setRole] = useState<Role>('developer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [bubbleStyle, setBubbleStyle] = useState<{ left: number; top: number; width: number; height: number; opacity: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0
  });

  const updateBubblePosition = React.useCallback(() => {
    const activeIdx = roleTabs.findIndex((t) => t.id === role);
    const activeEl = tabRefs.current[activeIdx];
    if (activeEl && activeEl.offsetWidth > 0) {
      setBubbleStyle({
        left: activeEl.offsetLeft,
        top: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
        opacity: 1
      });
    }
  }, [role]);

  React.useLayoutEffect(() => {
    updateBubblePosition();
  }, [updateBubblePosition, role, loading]);

  useEffect(() => {
    updateBubblePosition();
    const raf1 = requestAnimationFrame(updateBubblePosition);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(updateBubblePosition));
    const timer1 = setTimeout(updateBubblePosition, 50);
    const timer2 = setTimeout(updateBubblePosition, 150);
    const timer3 = setTimeout(updateBubblePosition, 300);

    window.addEventListener('resize', updateBubblePosition);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateBubblePosition();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', updateBubblePosition);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [updateBubblePosition, loading]);

  const active = roleTabs.find((tab) => tab.id === role) ?? roleTabs[0];

  const liveStats = [
    { value: stats ? String(stats.developers) : '—', label: 'Developers monitored' },
    { value: stats ? String(stats.logsToday) : '—', label: 'Logs submitted today' },
    { value: stats ? `${stats.onTimeRate}%` : '—', label: 'On-time check-in rate' }
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const loggedIn = await login(email.trim(), password, remember);
      if (loggedIn.role !== role) {
        logout();
        const actualTab = roleTabs.find((t) => t.id === loggedIn.role);
        const actualLabel = actualTab ? actualTab.label : loggedIn.role;
        setError(`Access denied. This account is registered as ${actualLabel}. Please select the "${actualLabel}" tab above to sign in.`);
        return;
      }
      const home = roleTabs.find((t) => t.id === loggedIn.role)?.path || '/developer';
      navigate(home);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      const home = roleTabs.find((t) => t.id === user.role)?.path || '/developer';
      navigate(home, { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center bg-[#f6f8fc] overflow-hidden">
        <div className="ambient-orb -top-20 -left-20 w-96 h-96 bg-blue-500/10" />
        <div className="ambient-orb -bottom-20 -right-20 w-96 h-96 bg-purple-500/10" />
        
        <div className="glass-card relative z-10 flex flex-col items-center gap-4 p-8 rounded-3xl shadow-glass-modal">
          <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-white/90 backdrop-blur-xl shadow-glass-hover p-2 ring-1 ring-white/90">
            <img
              src="/SIMATS-logo.jpg"
              alt="DevTrack Logo"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight text-navy">DevTrack</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Validating your authentication session...</p>
          </div>
          <div className="h-1.5 w-36 overflow-hidden rounded-full bg-slate-200/80">
            <div className="h-full w-1/2 rounded-full bg-brand animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-slate-900 dark:bg-[#070d18] overflow-x-hidden selection:bg-brand/20 selection:text-brand">
      {/* Soft Ambient Light Glow Orbs */}
      <div className="ambient-orb -top-32 -left-32 w-[600px] h-[600px] bg-blue-500/15" />
      <div className="ambient-orb top-1/4 -right-28 w-[550px] h-[550px] bg-purple-500/12" />
      <div className="ambient-orb -bottom-28 left-1/3 w-[650px] h-[650px] bg-indigo-500/15" />

      {/* Left Showcase / Brand Column (5 cols on lg, 6 cols on 2xl) */}
      <div className="relative lg:col-span-5 2xl:col-span-6 min-h-[420px] lg:min-h-screen p-8 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-between bg-gradient-to-br from-[#070e1e] via-[#0b162e] to-[#0d1b3a] text-white overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 z-10">
        <div className="ambient-orb -top-20 -left-20 w-80 h-80 bg-blue-500/20" />
        <div className="ambient-orb -bottom-20 -right-20 w-80 h-80 bg-purple-500/20" />

        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 shadow-glass p-2">
              <img
                src="/SIMATS-logo.jpg"
                alt="DevTrack Logo"
                className="h-full w-full object-contain rounded-xl"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-tight">DevTrack</span>
              <span className="text-[11px] font-medium tracking-wide text-blue-300">Developer Productivity &amp; Work Log Platform</span>
            </div>
          </div>

          <div className="mt-12 lg:mt-20 max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-blue-200 mb-6 shadow-glass">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Live Project Tracking &amp; Accountability Portal
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12] text-white">
              Real Work.<br />
              <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                Real Proof.
              </span><br />
              Real Time.
            </h1>
            <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-300/90 font-normal">
              A high-fidelity productivity accountability system with verified logs, intelligent analytics, and frictionless oversight.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-10 lg:mt-16 space-y-6 max-w-lg">
          <dl className="grid grid-cols-3 gap-3">
            {liveStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-3.5 shadow-glass"
              >
                <dd className="text-2xl sm:text-3xl font-bold tabular-nums text-white tracking-tight">{stat.value}</dd>
                <dt className="mt-1 text-[11px] font-medium leading-tight text-slate-300">{stat.label}</dt>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-300">
            {['Hourly Logs', 'Proof of Work', 'Live Approvals', 'AI Summaries'].map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Authentication Form Column (7 cols on lg, 6 cols on 2xl) */}
      <div className="relative lg:col-span-7 2xl:col-span-6 min-h-screen p-6 sm:p-12 lg:p-16 xl:p-24 flex flex-col justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl transition-colors z-10">
        <div className="w-full max-w-xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy dark:text-white">Welcome Back</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Sign in to your authenticated workspace</p>
            </div>
            <ThemeToggle variant="pill" />
          </div>

          {/* Role selector tabs */}
          <div
            ref={containerRef}
            className="segmented-control-track relative grid grid-cols-2 sm:grid-cols-4 gap-1.5"
            role="tablist"
            aria-label="Select your role"
          >
            {/* Sliding Liquid Glass Bubble Indicator with Spring Physics */}
            <div
              className="liquid-glass-bubble"
              style={{
                left: `${bubbleStyle.left}px`,
                top: `${bubbleStyle.top}px`,
                width: `${bubbleStyle.width}px`,
                height: `${bubbleStyle.height}px`,
                opacity: bubbleStyle.opacity
              }}
              aria-hidden="true"
            />

            {roleTabs.map((tab, idx) => {
              const selected = tab.id === role;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[idx] = el)}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setRole(tab.id);
                    setError('');
                  }}
                  className={`segmented-tab-btn flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-bold cursor-pointer select-none transition-all duration-300 ${
                    selected
                      ? 'text-[#0071e3] dark:text-white font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_0_10px_rgba(56,189,248,0.7)] scale-[1.03]'
                      : 'text-slate-500 dark:text-slate-400 font-medium'
                  }`}
                >
                  <span className={`transition-transform duration-300 ${selected ? 'text-[#0071e3] dark:text-sky-300 scale-110' : 'text-slate-400 dark:text-slate-400'}`}>
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <MailIcon
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="glass-input h-12 w-full pl-10 pr-3.5 text-sm font-medium text-navy dark:text-white placeholder:text-slate-400"
                  placeholder="name@organization.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <LockIcon
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="glass-input h-12 w-full pl-10 pr-11 text-sm font-medium text-navy dark:text-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 dark:border-slate-600 text-brand focus:ring-brand/40"
                />
                Remember my device
              </label>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/40 backdrop-blur-md p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300 shadow-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-glass-primary w-full h-12 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <span>{busy ? 'Verifying Credentials…' : 'Sign In to Workspace'}</span>
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </form>

          {/* Role info card */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200/70 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/30 backdrop-blur-md p-4 shadow-glass">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand dark:text-sky-400" aria-hidden="true" />
            <div className="text-xs">
              <p className="font-bold tracking-wide uppercase text-brand dark:text-sky-400">
                {active.label} Role Permissions
              </p>
              <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-200 font-normal">{active.info}</p>
              <p className="mt-1.5 font-medium text-slate-500 dark:text-slate-400 text-[11px]">
                Accounts are provisioned by your workspace Admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
