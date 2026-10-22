import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  CodeIcon,
  FolderKanbanIcon,
  LayersIcon,
  LockIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
  UserCogIcon,
  UsersIcon,
  ZapIcon,
  ChevronRightIcon,
  SettingsIcon,
  AwardIcon,
  CheckIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  KeyIcon,
  XIcon,
  LogOutIcon,
  FileTextIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePublicStats } from '../hooks/useLive';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { HeaderClock } from '../components/layout/HeaderClock';
import { Role } from '../types';

export function LandingPage() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const { data: stats } = usePublicStats();
  const [activeRoleTab, setActiveRoleTab] = useState<Role>('developer');

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const [redirectingMessage, setRedirectingMessage] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Policy & Governance modal states
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<'privacy' | 'terms' | 'security'>('privacy');

  const roleHomeRoutes: Record<Role, string> = {
    developer: '/developer',
    leader: '/leader',
    manager: '/manager',
    admin: '/admin'
  };

  const roleLabels: Record<Role, string> = {
    developer: 'Developer',
    leader: 'Team Leader',
    manager: 'Project Manager',
    admin: 'Administrator'
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError('');
    setBusy(true);
    setRedirectingMessage(null);
    try {
      const loggedIn = await login(email.trim(), password, remember);
      const target = roleHomeRoutes[loggedIn.role] || '/developer';
      setRedirectingMessage(`Welcome back, ${loggedIn.name || 'User'}! Launching ${roleLabels[loggedIn.role]} Portal…`);
      setTimeout(() => {
        navigate(target, { replace: true });
      }, 400);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
      setBusy(false);
    }
  };

  const scrollToSignIn = () => {
    const el = document.getElementById('signin-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const emailInput = document.getElementById('landing-email');
      if (emailInput) {
        setTimeout(() => emailInput.focus(), 300);
      }
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const roleDetails: Record<
    Role,
    {
      title: string;
      subtitle: string;
      icon: React.ReactNode;
      color: string;
      badge: string;
      features: string[];
      previewTitle: string;
      previewStats: { label: string; val: string }[];
      workflowSteps: string[];
    }
  > = {
    developer: {
      title: 'Developer Workspace',
      subtitle: 'Focused, distraction-free productivity tracking built specifically for software engineers.',
      icon: <TerminalIcon className="h-5 w-5" />,
      color: 'from-blue-600 to-cyan-600 text-blue-500',
      badge: 'Core Contributor Portal',
      features: [
        '4 Scheduled 2-Hour Work Blocks (9:30 AM – 6:30 PM)',
        'Automated GitHub commit linking & branch synchronization',
        'Mandatory verified proof-of-work with screenshot attachments',
        'End-of-Day (EOD) self-evaluations and blockers reporting',
        'Targeted feedback tasks with line-by-line reviewer annotations'
      ],
      previewTitle: 'Daily Work-Block Dashboard',
      previewStats: [
        { label: 'Today’s Work Blocks', val: '4 of 4 Logged' },
        { label: 'Active Coding Time', val: '7.5 Hours' },
        { label: 'GitHub Commits', val: '6 Commits' }
      ],
      workflowSteps: [
        'Check into current 2-hour block',
        'Attach commit SHA & proof screenshots',
        'Submit for Team Lead review',
        'Complete 5:00 PM EOD report'
      ]
    },
    leader: {
      title: 'Team Leader Portal',
      subtitle: 'Real-time engineering supervision, attendance radar, and high-velocity code approvals.',
      icon: <UsersIcon className="h-5 w-5" />,
      color: 'from-indigo-600 to-blue-600 text-indigo-500',
      badge: 'Supervisory Command Center',
      features: [
        'Live developer attendance radar & active slot status',
        '1-Click Work Log approvals, rejections & change requests',
        'Visual targeted feedback tool with screenshot highlighting',
        'Real-time blocker escalation and direct task delegations',
        'Daily AI-consolidated executive team summaries'
      ],
      previewTitle: 'Live Attendance & Review Queue',
      previewStats: [
        { label: 'Developers Supervised', val: '8 Active' },
        { label: 'Pending Approvals', val: '3 In Queue' },
        { label: 'Team Velocity', val: '98% On-Time' }
      ],
      workflowSteps: [
        'Monitor live developer presence',
        'Review incoming block submissions',
        'Annotate screenshots with feedback',
        'Generate AI end-of-day digest'
      ]
    },
    manager: {
      title: 'Project Manager Portal',
      subtitle: 'Macro project governance, module percentage allocations, and cross-team delivery metrics.',
      icon: <UserCogIcon className="h-5 w-5" />,
      color: 'from-purple-600 to-indigo-600 text-purple-500',
      badge: 'Portfolio & Delivery Control',
      features: [
        'Multi-project portfolio oversight & sprint health indicators',
        'Module percentage weighting engine (strict 100% distribution)',
        'Single-project team allocations & seamless developer handovers',
        'Sprint burndown velocity and delivery timeline forecasting',
        'Direct task assignment to developers with priority flags'
      ],
      previewTitle: 'Project Control & Milestones',
      previewStats: [
        { label: 'Active Projects', val: '5 Projects' },
        { label: 'Overall Completion', val: '76% Weighted' },
        { label: 'Health Status', val: 'On Track' }
      ],
      workflowSteps: [
        'Define project scope & repo URL',
        'Assign modules & percentage weights',
        'Assign Team Leader & Developers',
        'Track module milestone deliverables'
      ]
    },
    admin: {
      title: 'Administrator Portal',
      subtitle: 'Enterprise-wide user provisioning, scheduling rules, and holistic performance analytics.',
      icon: <SettingsIcon className="h-5 w-5" />,
      color: 'from-rose-600 to-purple-600 text-rose-500',
      badge: 'Executive Governance Suite',
      features: [
        'Unified user management: add, promote, and deactivate accounts',
        'Instant Admin-assisted password reset for locked-out users',
        'Cross-organizational employee performance rankings & stats',
        'Configurable work-block hours, lunch slots, and grace periods',
        'Official holiday calendar and weekend working day overrides'
      ],
      previewTitle: 'Organization Overview & Analytics',
      previewStats: [
        { label: 'Total Workspace Users', val: '34 Users' },
        { label: 'System Compliance', val: '99.2%' },
        { label: 'Platform Uptime', val: '100% Live' }
      ],
      workflowSteps: [
        'Provision user roles & credentials',
        'Configure work schedule & deadlines',
        'Set holiday calendar dates',
        'Audit organization productivity'
      ]
    }
  };

  const activeRole = roleDetails[activeRoleTab];

  return (
    <div className="fixed inset-0 h-full w-full overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#E0EFFF] dark:bg-[#07090e] text-slate-900 dark:text-[#F5F5F5] selection:bg-brand/20 selection:text-brand transition-colors duration-500">
      {/* Background Fluid Ambient Glowing Blobs */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/20 via-sky-300/15 to-transparent blur-[140px] dark:from-[#1683FF]/15 dark:via-transparent z-0" />
      <div className="pointer-events-none fixed top-1/3 right-0 w-[650px] h-[650px] rounded-full bg-radial from-indigo-300/15 via-purple-300/10 to-transparent blur-[150px] dark:from-[#1683FF]/08 dark:via-transparent z-0" />
      <div className="pointer-events-none fixed -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-blue-400/15 via-teal-300/10 to-transparent blur-[160px] dark:from-[#1683FF]/10 dark:via-transparent z-0" />

      {/* LANDING PAGE FIXED TOP STICKY HEADER — 68px HEIGHT MATCHING BACKGROUND */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '68px',
          minHeight: '68px',
          width: '100%',
          boxSizing: 'border-box'
        }}
        className="sticky top-0 z-50 flex h-[68px] w-full shrink-0 items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 select-none bg-[#E0EFFF]/85 dark:bg-[#07090e]/85 backdrop-blur-2xl border-b border-blue-200/50 dark:border-white/10 shadow-xs dark:shadow-glass transition-colors duration-300"
      >
        {/* Left Side: Brand Logo & App Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white p-1 shadow-md ring-1 ring-blue-500/20 dark:ring-white/30 shrink-0">
              <img src="/Simats-logo.png" alt="DevTrack Logo" className="h-full w-full object-contain" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">DevTrack</span>
                <span className="rounded-full bg-blue-500/15 dark:bg-[#1683FF]/20 border border-blue-500/30 px-1.5 py-0.2 text-[9px] font-extrabold text-blue-600 dark:text-[#5AA9FF] uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <span className="hidden sm:block text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                Software Development &amp; Team Tracking Suite
              </span>
            </div>
          </div>
        </div>

        {/* Center: In-Page Section Jump Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/60 dark:bg-white/5 p-1 rounded-2xl border border-blue-200/50 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs">
          <button
            type="button"
            onClick={() => scrollToSection('overview')}
            className="px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-white transition-all cursor-pointer"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('roles')}
            className="px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-white transition-all cursor-pointer"
          >
            4 Roles
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('workflow')}
            className="px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-white transition-all cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-white transition-all cursor-pointer"
          >
            Key Features
          </button>
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="hidden xl:block">
            <HeaderClock />
          </div>

          <ThemeToggle variant="button" />

          {user ? (
            <button
              type="button"
              onClick={() => navigate(roleHomeRoutes[user.role] || '/developer')}
              className="btn-glass-primary h-9 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-glass-hover"
            >
              <span>{roleLabels[user.role]} Dashboard</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={scrollToSignIn}
              className="btn-glass-primary h-9 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-glass-hover"
            >
              <span>Sign In</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* HERO SECTION WITH EMBEDDED LIQUID GLASS LOGIN CARD */}
      <section id="overview" className="relative z-10 pt-10 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column (Brand Narrative & Live Metrics) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-400/30 dark:border-[rgba(22,131,255,0.35)] bg-white/80 dark:bg-[rgba(22,131,255,0.16)] backdrop-blur-xl px-4 py-1.5 text-xs font-bold text-blue-700 dark:text-[#5AA9FF] shadow-[0_4px_16px_rgba(37,99,235,0.08)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-[#1683FF]" />
              </span>
              <span>Live Project Tracking & Accountability Portal</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white">
              Real Work.<br />
              <span className="relative inline-block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-[#5AA9FF] dark:via-[#8CC5FF] dark:to-white bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(22,131,255,0.25)]">
                Real Proof.
              </span><br />
              Real Time.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-2xl">
              A unified engineering workspace connecting Developers, Team Leads, Project Managers, and Admins to track verified work logs, manage module delivery, and measure productivity in real time.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl px-3 py-1.5 shadow-sm">
                <ClockIcon className="h-3.5 w-3.5 text-blue-500" />
                4 Scheduled 2-Hour Blocks
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl px-3 py-1.5 shadow-sm">
                <CodeIcon className="h-3.5 w-3.5 text-indigo-500" />
                GitHub Commit &amp; Screenshot Proof
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl px-3 py-1.5 shadow-sm">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                Role-Based Portals (Dev, Lead, PM, Admin)
              </span>
            </div>

            {/* Live Metrics Counter Cards */}
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
              <div className="hover-tile rounded-2xl border border-white/90 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl p-4 shadow-glass text-left">
                <dt className="text-xs font-bold text-slate-500 dark:text-slate-400">Monitored Developers</dt>
                <dd className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stats ? stats.developers : '12+'}
                </dd>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2Icon className="h-3 w-3" /> Active Roster
                </span>
              </div>

              <div className="hover-tile rounded-2xl border border-white/90 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl p-4 shadow-glass text-left">
                <dt className="text-xs font-bold text-slate-500 dark:text-slate-400">Verified Work Logs</dt>
                <dd className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stats ? stats.logsToday : '36+'}
                </dd>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 flex items-center gap-1 mt-1">
                  <ClockIcon className="h-3 w-3" /> Today's Submissions
                </span>
              </div>

              <div className="hover-tile rounded-2xl border border-white/90 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl p-4 shadow-glass text-left">
                <dt className="text-xs font-bold text-slate-500 dark:text-slate-400">On-Time Rate</dt>
                <dd className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stats ? `${stats.onTimeRate}%` : '98.4%'}
                </dd>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1">
                  <ZapIcon className="h-3 w-3" /> Enforced Check-Ins
                </span>
              </div>
            </dl>

            <div className="pt-2">
              <a
                href="#roles"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#5AA9FF] hover:underline"
              >
                <span>Explore the 4 specialized portals below</span>
                <ChevronRightIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Column: Floating Elevated Liquid Glass Authentication Card */}
          <div className="lg:col-span-5" id="signin-card">
            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/85 dark:bg-[#101319]/90 backdrop-blur-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] space-y-5 transition-all">
              
              {user ? (
                /* Authenticated State Quick Launcher */
                <div className="space-y-5 py-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl shadow-lg shadow-blue-500/25">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Welcome Back, {user.name}!
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      You are logged in with verified institutional credentials.
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-700 dark:text-sky-300">
                      <ShieldCheckIcon className="h-3.5 w-3.5" />
                      <span>Assigned Portal: {roleLabels[user.role]}</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={() => navigate(roleHomeRoutes[user.role] || '/developer')}
                      className="btn-glass-primary w-full h-12 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-glass-hover"
                    >
                      <span>Open {roleLabels[user.role]} Workspace</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <LogOutIcon className="h-3.5 w-3.5" />
                      <span>Switch Account / Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Unauthenticated Sign-In Form */
                <>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-[#5AA9FF]">
                        Workspace Access
                      </span>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                        Live System
                      </span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
                      Sign In to DevTrack
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      Enter your institutional credentials to automatically route to your assigned portal.
                    </p>
                  </div>

                  {/* Feedback Messages */}
                  {redirectingMessage && (
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/40 p-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
                      <Loader2Icon className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{redirectingMessage}</span>
                    </div>
                  )}

                  {loginError && (
                    <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/40 p-3.5 text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2.5 animate-in fade-in">
                      <XIcon className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form className="space-y-4 pt-1" onSubmit={handleLoginSubmit}>
                    <div>
                      <label htmlFor="landing-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          id="landing-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="glass-input h-11 w-full pl-10 pr-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                          placeholder="name@saveetha.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="landing-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <div className="relative">
                        <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          id="landing-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="glass-input h-11 w-full pl-10 pr-11 text-sm font-medium text-slate-900 dark:text-white"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                        />
                        <span>Remember device</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(true)}
                        className="font-bold text-blue-600 dark:text-[#5AA9FF] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-glass-primary w-full h-12 text-sm font-bold flex items-center justify-center gap-2.5 cursor-pointer shadow-glass-hover"
                    >
                      {busy ? (
                        <>
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                          <span>Verifying Credentials…</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Workspace</span>
                          <ArrowRightIcon className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="pt-2 text-center border-t border-slate-200/50 dark:border-white/5">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Support: <span className="font-bold text-slate-700 dark:text-slate-300">admin.sse@saveetha.com</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4-ROLE ARCHITECTURE SHOWCASE */}
      <section id="roles" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/50 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400">
            Tailored Experiences
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            One Unified Platform. Four Specialized Portals.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Every user receives a customized interface designed strictly around their operational responsibilities and governance workflows.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
          {(['developer', 'leader', 'manager', 'admin'] as Role[]).map((roleKey) => {
            const r = roleDetails[roleKey];
            const isActive = activeRoleTab === roleKey;
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setActiveRoleTab(roleKey)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25 scale-105 ring-2 ring-blue-500/50'
                    : 'bg-white/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 shadow-sm'
                }`}
              >
                {r.icon}
                <span>{r.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Role Showcase Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/80 dark:border-white/10 shadow-glass-modal transition-all animate-in fade-in zoom-in-98 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Col: Details & Features */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-700 dark:text-sky-300">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  <span>{activeRole.badge}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {activeRole.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {activeRole.subtitle}
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Core Capabilities &amp; Governance
                </span>
                <ul className="space-y-2.5">
                  {activeRole.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <div className="rounded-full bg-emerald-500/15 p-0.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={scrollToSignIn}
                  className="btn-glass-primary h-11 px-6 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-glass-hover"
                >
                  <span>Sign In as {roleLabels[activeRoleTab]}</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Col: Interactive Visual Mockup / Stats */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/60 p-5 shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      {activeRole.previewTitle}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold bg-blue-500/10 text-blue-600 dark:text-sky-400 px-2 py-0.5 rounded-md">
                    Live Telemetry
                  </span>
                </div>

                {/* Simulated Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeRole.previewStats.map((st, i) => (
                    <div key={i} className="rounded-xl bg-white dark:bg-white/[0.05] p-3 border border-slate-200/50 dark:border-white/5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{st.label}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">{st.val}</span>
                    </div>
                  ))}
                </div>

                {/* 4-Step Pipeline for this Role */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Execution Workflow
                  </span>
                  <div className="space-y-1.5">
                    {activeRole.workflowSteps.map((step, stepIdx) => (
                      <div
                        key={stepIdx}
                        className="flex items-center gap-2.5 rounded-lg bg-white/60 dark:bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-white/5"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 dark:text-sky-400 font-bold text-[10px] shrink-0">
                          {stepIdx + 1}
                        </span>
                        <span className="truncate">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS WORKFLOW */}
      <section id="workflow" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/50 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400">
            Systematic Accountability
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            How DevTrack Works Daily
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            A frictionless cadence engineered to guarantee verified software output every single working day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Scheduled Work Blocks',
              desc: 'Engineers check into four 2-hour daily slots (9:30 AM – 6:30 PM). Punctuality is timestamped automatically.',
              icon: <ClockIcon className="h-6 w-6 text-blue-500" />
            },
            {
              step: '02',
              title: 'Commit Proof & Screenshots',
              desc: 'Logs require Git commit hashes and proof-of-work visual attachments to verify actual progress.',
              icon: <CodeIcon className="h-6 w-6 text-indigo-500" />
            },
            {
              step: '03',
              title: 'Team Lead Verification',
              desc: 'Team leaders inspect logs in real-time, approve, reject, or annotate feedback directly on screenshots.',
              icon: <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
            },
            {
              step: '04',
              title: 'Sprint Burndown & AI Digest',
              desc: 'Executive telemetry calculates module completion percentages and compiles daily AI performance digests.',
              icon: <ZapIcon className="h-6 w-6 text-purple-500" />
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-card hover-tile rounded-3xl p-6 border border-white/80 dark:border-white/10 shadow-glass flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-white/[0.05] border border-blue-500/20">
                    {item.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-300 dark:text-slate-700 font-mono">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KEY FEATURES BENTO GRID */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/50 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400">
            Engineered For Precision
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Built-In Productivity Innovations
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Eliminate guesswork, phantom tasks, and unverified status updates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card hover-tile rounded-3xl p-7 border border-white/80 dark:border-white/10 shadow-glass space-y-4 md:col-span-2">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-sky-400">
              <FolderKanbanIcon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Strict 100% Module Weight Allocation
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Project Managers assign weighted percentages to each module. When developers complete tasks, the system calculates true weighted project completion percentages in real time.
            </p>
          </div>

          <div className="glass-card hover-tile rounded-3xl p-7 border border-white/80 dark:border-white/10 shadow-glass space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <UsersIcon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Live Team Radar
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              See who is currently active, who checked into the 2-hour slot, and receive live audio-visual pings on new submissions.
            </p>
          </div>

          <div className="glass-card hover-tile rounded-3xl p-7 border border-white/80 dark:border-white/10 shadow-glass space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Automated Role Routing
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              No manual role switches. One single login field verifies credentials and instantly routes each user to their designated dashboard.
            </p>
          </div>

          <div className="glass-card hover-tile rounded-3xl p-7 border border-white/80 dark:border-white/10 shadow-glass space-y-4 md:col-span-2">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Admin-Assisted Password Recovery &amp; Provisioning
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Forgot password requests are resolved securely through institutional administrators via one-click temporary credential resets.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-[#07090e]/90 backdrop-blur-2xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-1">
              <img src="/Simats-logo.png" alt="DevTrack Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">DevTrack Pro</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-semibold">
            <a href="#overview" className="hover:text-blue-600 dark:hover:text-white transition-colors">Overview</a>
            <a href="#roles" className="hover:text-blue-600 dark:hover:text-white transition-colors">Portals</a>
            <a href="#workflow" className="hover:text-blue-600 dark:hover:text-white transition-colors">Workflow</a>
            <button
              type="button"
              onClick={() => {
                setPolicyTab('privacy');
                setPolicyModalOpen(true);
              }}
              className="hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => {
                setPolicyTab('terms');
                setPolicyModalOpen(true);
              }}
              className="hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => {
                setPolicyTab('security');
                setPolicyModalOpen(true);
              }}
              className="hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              Security
            </button>
            <button
              type="button"
              onClick={scrollToSignIn}
              className="text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Sign In
            </button>
            <span className="text-slate-400">Admin: admin.sse@saveetha.com</span>
          </div>

          <div>
            &copy; {new Date().getFullYear()} SIMATS DevTrack. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ADMIN-ASSISTED FORGOT PASSWORD MODAL */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/80 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-sky-400">
                  <KeyIcon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Password Recovery</h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                To maintain verified academic and enterprise integrity, passwords are reset through the workspace <strong className="text-slate-900 dark:text-white">Administrator</strong>.
              </p>

              <div className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/30 p-3.5 space-y-2">
                <span className="font-bold text-blue-900 dark:text-blue-300 block">How to request:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  <li>Send an email to your workspace Admin with your registered email ID.</li>
                  <li>The Admin will issue a temporary one-time password via User Management.</li>
                  <li>Log in with the temporary password and update it anytime in your Profile.</li>
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
                Got It, Return to Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY, TERMS & DATA SECURITY MODAL */}
      {policyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-white/80 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-sky-400">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Governance &amp; Legal Policies</h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">DevTrack Academic &amp; Enterprise Standards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPolicyModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/10 pb-3 shrink-0">
              <button
                type="button"
                onClick={() => setPolicyTab('privacy')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  policyTab === 'privacy'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setPolicyTab('terms')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  policyTab === 'terms'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setPolicyTab('security')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  policyTab === 'security'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Data Security
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto pr-1 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
              {policyTab === 'privacy' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">1. Telemetry &amp; Work Log Collection</h4>
                    <p>
                      DevTrack records developer activity strictly within designated 2-hour work slots. Collected telemetry includes check-in timestamps, slot completion status, commit hashes, and visual screenshot attachments uploaded by the user to demonstrate task completion.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">2. Scope of Access</h4>
                    <p>
                      Access to developer work logs is strictly role-scoped:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700 dark:text-slate-300">
                      <li><strong>Developers</strong>: Can only view and edit their own logs, pending works, and submitted reports.</li>
                      <li><strong>Team Leaders</strong>: Have supervisory review access only over developers allocated to their assigned project.</li>
                      <li><strong>Project Managers</strong>: View aggregated module completion percentages and milestone burn-down velocity.</li>
                      <li><strong>Administrators</strong>: Manage system credentials, work schedules, and organization analytics without accessing personal credentials.</li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">3. Proof-of-Work Screenshots</h4>
                    <p>
                      Screenshots uploaded as proof-of-work are stored securely on the institution server and are accessible only to authorized project supervisors for review and annotation. Screenshots are never shared publicly or transferred to third-party services.
                    </p>
                  </div>
                </div>
              )}

              {policyTab === 'terms' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">1. Honest &amp; Verified Logging</h4>
                    <p>
                      Users agree to log genuine engineering activities performed during designated work slots. Misrepresenting work logs, submitting fabricated commit hashes, or uploading unrelated image proofs violates workplace and academic integrity standards.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">2. Timeliness &amp; Accountability</h4>
                    <p>
                      Developers are expected to adhere to scheduled work block check-ins. On-time check-in rates and daily log completion percentages contribute directly to employee and student performance reviews.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">3. Reviewer Code of Conduct</h4>
                    <p>
                      Team Leaders must provide constructive, actionable, and professional annotations on rejected or pending work block logs. Feedback tasks must specify the exact technical criteria required for approval.
                    </p>
                  </div>
                </div>
              )}

              {policyTab === 'security' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">1. Credential Security &amp; Encryption</h4>
                    <p>
                      All passwords are salted and hashed using industry-standard cryptography before storage in the database. Authentication tokens are transmitted over encrypted sessions and stored in protected local storage.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">2. Admin-Assisted Password Recovery</h4>
                    <p>
                      To prevent unauthorized account takeovers or unverified email resets, all credential resets are governed through verified Administrator action via the User Management portal.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">3. Data Retention &amp; Inquiries</h4>
                    <p>
                      Project telemetry is retained across the project sprint lifecycle and archived for semester governance. For data inquiries or account deactivations, contact:
                    </p>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 p-2.5 font-bold text-slate-800 dark:text-slate-200 mt-2">
                      <MailIcon className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>admin.sse@saveetha.com</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">Last updated: {new Date().getFullYear()}</span>
              <button
                type="button"
                onClick={() => setPolicyModalOpen(false)}
                className="btn-glass-primary px-5 h-9 text-xs font-bold cursor-pointer"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
