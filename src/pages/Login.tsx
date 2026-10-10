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
    const handleResize = () => {
      requestAnimationFrame(updateBubblePosition);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateBubblePosition]);

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
      const home = roleTabs.find((t) => t.id === loggedIn.role)?.path || '/developer';
      navigate(home, { replace: true });
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
      <div className="relative flex h-screen w-full items-center justify-center bg-[#E0EFFF] overflow-hidden">
        <div className="ambient-orb -top-20 -left-20 w-96 h-96 bg-blue-500/10" />
        <div className="ambient-orb -bottom-20 -right-20 w-96 h-96 bg-purple-500/10" />
        
        <div className="glass-card relative z-10 flex flex-col items-center gap-4 p-8 rounded-3xl shadow-glass-modal">
          <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-white/90 backdrop-blur-xl shadow-glass-hover p-2 ring-1 ring-white/90">
            <img
              src="/Simats-logo.png"
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
    <div className="relative min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-slate-50 dark:bg-[#090A0C] overflow-x-hidden selection:bg-brand/20 selection:text-brand transition-colors duration-300">
      {/* Soft Ambient Light Glow Orbs across screen */}
      <div className="ambient-orb -top-32 -left-32 w-[600px] h-[600px] bg-blue-500/10 dark:bg-[#1683FF]/12 pointer-events-none" />
      <div className="ambient-orb top-1/4 -right-28 w-[550px] h-[550px] bg-purple-500/10 dark:bg-[#1683FF]/06 pointer-events-none" />
      <div className="ambient-orb -bottom-28 left-1/3 w-[650px] h-[650px] bg-indigo-500/10 dark:bg-[#1683FF]/08 pointer-events-none" />

      {/* Left Showcase / Brand Hero Column (5 cols on lg, 6 cols on 2xl) */}
      <div className="relative lg:col-span-5 2xl:col-span-6 min-h-[440px] lg:min-h-screen p-8 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-between bg-gradient-to-br from-[#f8fbff] via-[#edf5ff] to-[#e8f0fe] dark:from-[#090A0C] dark:via-[#111315] dark:to-[#181A1D] text-slate-900 dark:text-[#F5F5F5] overflow-hidden border-b lg:border-b-0 lg:border-r border-blue-100/90 dark:border-white/10 shadow-[6px_0_30px_rgba(37,99,235,0.04)] z-10 transition-colors duration-300">
        {/* Aurora Atmospheric Glow Layers (Behind content) */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-[460px] h-[460px] rounded-full bg-gradient-to-br from-blue-400/25 via-sky-300/20 to-transparent blur-[80px] dark:from-[#1683FF]/15 dark:via-transparent" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-radial from-white/95 via-sky-100/60 to-transparent blur-3xl dark:from-[#1683FF]/08 dark:via-transparent dark:to-transparent" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 w-[480px] h-[480px] rounded-full bg-gradient-to-tl from-indigo-300/25 via-purple-200/20 to-transparent blur-[90px] dark:from-[#1683FF]/06 dark:via-transparent" />
        
        {/* Subtle Decorative Floating Glass Rings */}
        <div className="pointer-events-none absolute top-1/4 -right-16 w-72 h-72 rounded-full border border-blue-200/40 dark:border-white/5 bg-white/20 dark:bg-white/[0.02] shadow-inner rotate-12" />
        <div className="pointer-events-none absolute bottom-1/3 -left-12 w-56 h-56 rounded-full border border-indigo-200/35 dark:border-white/5 bg-gradient-to-tr from-white/30 to-transparent dark:from-white/[0.02]" />

        {/* Top Branding Area */}
        <div className="relative z-10">
          <div className="relative group flex items-center gap-4">
            {/* Soft light bloom behind logo */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-400/25 to-indigo-400/25 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-2xl border border-white/90 dark:border-white/20 shadow-[0_8px_32px_rgba(59,130,246,0.14)] p-2.5 transition-transform duration-300 group-hover:scale-105">
              <img
                src="/Simats-logo.png"
                alt="DevTrack Logo"
                className="h-full w-full object-contain rounded-xl drop-shadow-xs"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F5F5F5] block leading-tight">
                  DevTrack
                </span>
                <span className="rounded-full bg-[rgba(22,131,255,0.16)] dark:bg-[rgba(22,131,255,0.20)] border border-[rgba(22,131,255,0.35)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-[#5AA9FF]">
                  Pro
                </span>
              </div>
              <span className="text-xs font-semibold tracking-wide text-indigo-600/90 dark:text-[#A1A1AA]">
                Developer Productivity &amp; Work Log Platform
              </span>
            </div>
          </div>

          {/* Hero Pitch */}
          <div className="mt-12 lg:mt-20 max-w-lg">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-400/30 dark:border-[rgba(22,131,255,0.35)] bg-white/75 dark:bg-[rgba(22,131,255,0.16)] backdrop-blur-xl px-4 py-1.5 text-xs font-bold text-blue-700 dark:text-[#5AA9FF] mb-6 shadow-[0_4px_16px_rgba(37,99,235,0.08)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 dark:bg-[#1683FF]" />
              </span>
              <span>Live Project Tracking &amp; Accountability Portal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-[#F5F5F5]">
              Real Work.<br />
              <span className="relative inline-block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-[#5AA9FF] dark:via-[#8CC5FF] dark:to-white bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(22,131,255,0.25)]">
                Real Proof.
              </span><br />
              Real Time.
            </h1>
            <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-[#A1A1AA] font-medium max-w-md">
              A high-fidelity productivity accountability system with verified logs, intelligent analytics, and frictionless oversight.
            </p>
          </div>
        </div>

        {/* Bottom Floating Glass Stats Tiles & Frosted Feature Pills */}
        <div className="relative z-10 mt-10 lg:mt-16 space-y-6 max-w-lg">
          <dl className="grid grid-cols-3 gap-3.5">
            {liveStats.map((stat) => (
              <div
                key={stat.label}
                className="group relative rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl p-4 shadow-[0_8px_24px_rgba(37,99,235,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_32px_rgba(37,99,235,0.14)] hover:border-blue-300/60 dark:hover:border-[rgba(22,131,255,0.35)] cursor-default"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white dark:via-white/20 to-transparent" />
                <dd className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-[#F5F5F5] tracking-tight group-hover:text-blue-600 dark:group-hover:text-[#5AA9FF] transition-colors">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-[11px] font-semibold leading-tight text-slate-500 dark:text-[#A1A1AA]">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-[#A1A1AA]">
            {['Hourly Logs', 'Proof of Work', 'Live Approvals', 'AI Summaries'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-blue-200/60 dark:border-white/10 bg-white/75 dark:bg-white/[0.06] backdrop-blur-xl px-3.5 py-1.5 shadow-[0_2px_8px_rgba(37,99,235,0.05)] hover:bg-white dark:hover:bg-white/12 hover:border-blue-300 dark:hover:border-white/20 transition-all duration-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Authentication Form Column (7 cols on lg, 6 cols on 2xl) */}
      <div className="relative lg:col-span-7 2xl:col-span-6 min-h-screen p-6 sm:p-12 lg:p-16 xl:p-24 flex flex-col justify-center bg-white/95 dark:bg-[#111315]/90 backdrop-blur-2xl transition-colors z-10">
        <div className="w-full max-w-xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy dark:text-[#F5F5F5]">Welcome Back</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] font-medium">Sign in to your authenticated workspace</p>
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
            {/* Sliding Liquid Glass Bubble Indicator with GPU Hardware Acceleration */}
            <div
              className="liquid-glass-bubble"
              style={{
                transform: `translate3d(${bubbleStyle.left}px, ${bubbleStyle.top}px, 0)`,
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
                  className={`segmented-tab-btn flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-bold cursor-pointer select-none ${
                    selected
                      ? 'text-[#0071e3] dark:text-white font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_0_10px_rgba(56,189,248,0.7)] scale-[1.03]'
                      : 'text-slate-500 dark:text-slate-400 font-medium'
                  }`}
                >
                  <span className={`transition-transform duration-200 ${selected ? 'text-[#0071e3] dark:text-sky-300 scale-110' : 'text-slate-400 dark:text-slate-400'}`}>
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
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
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
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
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
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
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
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200/70 dark:border-[rgba(22,131,255,0.25)] bg-blue-50/60 dark:bg-[rgba(22,131,255,0.08)] backdrop-blur-md p-4 shadow-glass">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand dark:text-[#5AA9FF]" aria-hidden="true" />
            <div className="text-xs">
              <p className="font-bold tracking-wide uppercase text-brand dark:text-[#5AA9FF]">
                {active.label} Role Permissions
              </p>
              <p className="mt-1 leading-relaxed text-slate-700 dark:text-[#F5F5F5] font-normal">{active.info}</p>
              <p className="mt-1.5 font-medium text-slate-500 dark:text-[#A1A1AA] text-[11px]">
                Accounts are provisioned by your workspace Admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
