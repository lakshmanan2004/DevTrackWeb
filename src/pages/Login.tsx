import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  SettingsIcon,
  TerminalIcon,
  UserCogIcon,
  UsersIcon,
  ShieldCheckIcon,
  Loader2Icon,
  KeyIcon,
  XIcon
} from 'lucide-react';
import { Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePublicStats } from '../hooks/useLive';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const rolePortals: Record<
  Role,
  { label: string; path: string; icon: React.ReactNode; color: string; desc: string }
> = {
  developer: {
    label: 'Developer Portal',
    path: '/developer',
    icon: <TerminalIcon className="h-4 w-4" />,
    color: 'text-blue-600 dark:text-sky-400',
    desc: 'Work logs, commits & daily activity'
  },
  leader: {
    label: 'Team Leader Portal',
    path: '/leader',
    icon: <UsersIcon className="h-4 w-4" />,
    color: 'text-indigo-600 dark:text-indigo-400',
    desc: 'Live team monitoring & approvals'
  },
  manager: {
    label: 'Project Manager Portal',
    path: '/manager',
    icon: <UserCogIcon className="h-4 w-4" />,
    color: 'text-purple-600 dark:text-purple-400',
    desc: 'Milestones, modules & team creation'
  },
  admin: {
    label: 'Admin Portal',
    path: '/admin',
    icon: <SettingsIcon className="h-4 w-4" />,
    color: 'text-rose-600 dark:text-rose-400',
    desc: 'Organization control & user management'
  }
};

export function Login() {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();
  const { data: stats } = usePublicStats();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [redirectingMessage, setRedirectingMessage] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const liveStats = [
    { value: stats ? String(stats.developers) : '—', label: 'Developers monitored' },
    { value: stats ? String(stats.logsToday) : '—', label: 'Logs submitted today' },
    { value: stats ? `${stats.onTimeRate}%` : '—', label: 'On-time check-in rate' }
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    setRedirectingMessage(null);
    try {
      const loggedIn = await login(email.trim(), password, remember);
      const target = rolePortals[loggedIn.role] || rolePortals.developer;
      setRedirectingMessage(`Welcome back, ${loggedIn.name || 'User'}! Launching ${target.label}…`);
      setTimeout(() => {
        navigate(target.path, { replace: true });
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      const home = rolePortals[user.role]?.path || '/developer';
      navigate(home, { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center bg-[#E0EFFF] dark:bg-[#07090e] overflow-hidden">
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
            <h2 className="text-xl font-bold tracking-tight text-navy dark:text-white">DevTrack</h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Validating your authentication session...</p>
          </div>
          <div className="h-1.5 w-36 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700">
            <div className="h-full w-1/2 rounded-full bg-brand animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row items-center justify-between bg-gradient-to-br from-[#f8faff] via-[#f2f6fc] to-[#eaf1fb] dark:from-[#06080c] dark:via-[#0c0f15] dark:to-[#11151d] text-slate-900 dark:text-[#F5F5F5] overflow-x-hidden selection:bg-brand/20 selection:text-brand transition-colors duration-500">
      {/* Soft Seamless Ambient Fluid Glow Layers — No Dividers, No Harsh Lines */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/20 via-sky-300/15 to-transparent blur-[120px] dark:from-[#1683FF]/15 dark:via-transparent" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-radial from-blue-300/15 via-indigo-200/10 to-transparent blur-[140px] dark:from-[#1683FF]/08 dark:via-transparent" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-indigo-400/20 via-purple-300/15 to-transparent blur-[130px] dark:from-[#1683FF]/10 dark:via-transparent" />

      {/* Left Showcase / Brand Narrative Column */}
      <div className="relative z-10 w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-between space-y-12">
        {/* Top Logo & Title */}
        <div>
          <Link
            to="/"
            title="Return to DevTrack Overview"
            className="relative group inline-flex items-center gap-4 transition-transform hover:opacity-95"
          >
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 dark:bg-white/10 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(59,130,246,0.12)] p-2.5 transition-transform duration-300 group-hover:scale-105">
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
                <span className="rounded-full bg-blue-500/15 dark:bg-[#1683FF]/20 border border-blue-500/30 dark:border-[rgba(22,131,255,0.35)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-[#5AA9FF]">
                  Pro
                </span>
              </div>
              <span className="text-xs font-semibold tracking-wide text-indigo-600/90 dark:text-[#A1A1AA]">
                Developer Productivity &amp; Work Log Platform
              </span>
            </div>
          </Link>

          {/* Hero Pitch Headline */}
          <div className="mt-12 lg:mt-16 max-w-lg">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-400/30 dark:border-[rgba(22,131,255,0.35)] bg-white/80 dark:bg-[rgba(22,131,255,0.16)] backdrop-blur-xl px-4 py-1.5 text-xs font-bold text-blue-700 dark:text-[#5AA9FF] mb-6 shadow-[0_4px_16px_rgba(37,99,235,0.06)]">
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

        {/* Live Metrics Floating Glass Cards */}
        <div className="space-y-6 max-w-lg">
          <dl className="grid grid-cols-3 gap-3.5">
            {liveStats.map((stat) => (
              <div
                key={stat.label}
                className="hover-tile group relative rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl p-4 shadow-glass cursor-default"
              >
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
                className="rounded-full border border-blue-200/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl px-3.5 py-1.5 shadow-[0_2px_8px_rgba(37,99,235,0.04)] hover:bg-white dark:hover:bg-white/10 transition-all duration-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Floating Elevated Liquid Glass Authentication Card */}
      <div className="relative z-10 w-full lg:w-1/2 p-6 sm:p-10 lg:p-14 xl:p-20 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-[#101319]/85 backdrop-blur-3xl p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.55)] space-y-6 transition-all">
          
          {/* Header with Theme Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy dark:text-[#F5F5F5]">
                Welcome Back
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] font-medium">
                Enter your credentials to automatically enter your assigned portal
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-[#5AA9FF] px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                title="Return to DevTrack Overview"
              >
                Overview
              </Link>
              <ThemeToggle variant="pill" />
            </div>
          </div>

          {/* Success Redirect Toast */}
          {redirectingMessage && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/40 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 shadow-sm">
              <Loader2Icon className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{redirectingMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4 pt-1" onSubmit={handleSubmit}>
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

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300 shadow-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-glass-primary w-full h-12 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <span>{busy ? (redirectingMessage ? 'Redirecting…' : 'Verifying Credentials…') : 'Sign In to Workspace'}</span>
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </form>

          {/* Minimalist, Clean Single-Line Reassurance Footer */}
          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-blue-500/80" />
            <span>Secure Enterprise Workspace · Direct Role Routing</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          className="glass-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
        >
          <div className="glass-modal w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400">
                  <KeyIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="forgot-modal-title" className="text-base font-black text-navy dark:text-white">
                    Forgot Your Password?
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Administrator-assisted credential recovery
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="leading-relaxed">
                DevTrack accounts are provisioned and managed directly by your organization's Administrator. For security reasons, passwords cannot be reset automatically without administrative verification.
              </p>

              <div className="rounded-2xl border border-blue-200/60 dark:border-white/10 bg-blue-50/60 dark:bg-white/[0.03] p-3.5 space-y-2">
                <span className="font-bold text-navy dark:text-white block uppercase tracking-wider text-[11px]">
                  How to get your password reset:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                  <li>Contact your DevTrack workspace Administrator.</li>
                  <li>Provide your registered college/work email address.</li>
                  <li>The Admin will issue a temporary password via User Management.</li>
                  <li>Log in with the temporary password and change it anytime in your Profile.</li>
                </ol>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 p-3">
                <MailIcon className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Workspace Admin Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">admin.sse@saveetha.com</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="btn-glass-primary w-full h-10 text-xs font-bold cursor-pointer"
              >
                Got It, Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
