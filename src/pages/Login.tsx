import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActivityIcon,
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

  const active = roleTabs.find((tab) => tab.id === role) ?? roleTabs[0];

  const liveStats = [
  { value: stats ? String(stats.developers) : '—', label: 'Developers monitored' },
  { value: stats ? String(stats.logsToday) : '—', label: 'Logs submitted today' },
  { value: stats ? `${stats.onTimeRate}%` : '—', label: 'On-time check-in rate' }];

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
      <div className="flex h-screen flex-col items-center justify-center bg-canvas">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-xl bg-brand text-white">
            <ActivityIcon className="h-6 w-6" />
          </span>
          <span className="text-xl font-bold text-navy">DevTrack</span>
        </div>
        <p className="mt-4 text-xs font-semibold text-gray-500">Validating your authentication session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <section className="flex flex-col justify-between bg-navy px-8 py-10 text-white lg:w-1/2 lg:px-14 lg:py-14">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
            <ActivityIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">DevTrack</span>
        </div>

        <div className="max-w-xl py-12">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
            Real Work. Real Proof. Real Time.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
            A productivity accountability system for your development team.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-3">
            {liveStats.map((stat) =>
            <div
              key={stat.label}
              className="rounded-card border border-navy-700 bg-navy-800 px-4 py-4">
                <dd className="text-2xl font-bold tabular-nums text-white">{stat.value}</dd>
                <dt className="mt-1 text-[11px] leading-snug text-slate-400">{stat.label}</dt>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-300">
          {['Hourly logs', 'Screenshot proof', 'Live approvals', 'Real-time alerts'].map((tag) =>
          <span key={tag} className="rounded-full border border-navy-600 px-3 py-1.5">
              {tag}
            </span>
          )}
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:px-14">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-navy">Welcome Back</h2>
          <p className="mt-1 text-sm text-gray-500">Sign in to your workspace</p>

          <div
            className="mt-6 grid grid-cols-2 gap-2"
            role="tablist"
            aria-label="Select your role">
            {roleTabs.map((tab) => {
              const selected = tab.id === role;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setRole(tab.id);
                    setError('');
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors duration-150 ease-out ${
                  selected ?
                  'border-brand bg-brand-soft text-brand' :
                  'border-hairline bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className={selected ? 'text-brand' : 'text-gray-400'}>{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>);
            })}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
                Email address
              </label>
              <div className="relative">
                <MailIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-lg border border-hairline pl-10 pr-3 text-sm text-navy placeholder:text-gray-400"
                  placeholder="you@college.edu" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy">
                Password
              </label>
              <div className="relative">
                <LockIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-hairline pl-10 pr-11 text-sm text-navy" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 transition-colors duration-150 ease-out hover:text-gray-600">
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand" />
                Remember me
              </label>
            </div>

            {error &&
            <p className="rounded-lg border border-red-200 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
                {error}
              </p>
            }

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-bold text-white transition-colors duration-150 ease-out hover:bg-blue-700 disabled:opacity-60">
              {busy ? 'Signing in…' : 'Sign In'}
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <div className="mt-6 flex gap-3 rounded-card border border-blue-100 bg-brand-soft px-4 py-3.5">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand">
                {active.label} access
              </p>
              <p className="mt-1 text-sm leading-relaxed text-blue-900">{active.info}</p>
              <p className="mt-1 text-xs font-semibold text-blue-700">
                Accounts are created by the Admin — ask your admin for your email and password.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
