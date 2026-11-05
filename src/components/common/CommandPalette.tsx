import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  SearchIcon,
  LayoutDashboardIcon,
  FolderKanbanIcon,
  ClockIcon,
  ListChecksIcon,
  GitCommitVerticalIcon,
  FileTextIcon,
  BellIcon,
  UserIcon,
  RadioIcon,
  UsersIcon,
  TrendingUpIcon,
  CheckSquareIcon,
  FilePlus2Icon,
  UsersRoundIcon,
  BriefcaseIcon,
  BarChart3Icon,
  SettingsIcon,
  TrophyIcon,
  SunIcon,
  MoonIcon,
  ZapIcon,
  PaletteIcon,
  LogOutIcon,
  ArrowRightIcon,
  XIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Role } from '../../types';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme, isLiteMode, toggleLiteMode, openWallpaperModal } = useTheme();

  // Listen for Ctrl+K / Cmd+K and custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('devtrack:open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('devtrack:open-command-palette', handleCustomOpen);
    };
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    setSearch('');
    command();
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass-strong w-full max-w-xl rounded-2xl border border-slate-200/80 dark:border-white/15 overflow-hidden shadow-2xl transition-transform animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="Global Command Palette"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setOpen(false);
            }
          }}
          className="flex flex-col w-full bg-transparent text-slate-800 dark:text-slate-100"
        >
          {/* Input Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/60 dark:border-white/10">
            <SearchIcon className="h-5 w-5 text-slate-400 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                }
              }}
              placeholder="Type a command, jump to page, or search..."
              className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              autoFocus
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Clear search text"
                title="Clear search"
              >
                <XIcon className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 border border-slate-300/40 dark:border-white/10 transition-colors cursor-pointer"
              aria-label="Close command palette (Escape)"
              title="Close (Escape)"
            >
              <span className="text-[11px] font-bold">Close</span>
              <kbd className="hidden sm:inline-flex items-center rounded bg-slate-300/60 dark:bg-white/15 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                ESC
              </kbd>
            </button>
          </div>

          {/* Results List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-8 text-center text-xs font-semibold text-slate-400">
              No matching commands found.
            </Command.Empty>

            {/* Quick Actions (All Roles) */}
            <Command.Group
              heading="Quick Actions"
              className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 py-1.5"
            >
              <Command.Item
                value="Toggle Lite Mode Performance 60fps"
                onSelect={() => runCommand(toggleLiteMode)}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ZapIcon className="h-4 w-4 text-amber-500" />
                  <span>Toggle Lite Mode (60 FPS Safe)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  {isLiteMode ? 'Active' : 'Off'}
                </span>
              </Command.Item>

              <Command.Item
                value="Toggle Dark Light Theme Appearance"
                onSelect={() => runCommand(toggleTheme)}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'dark' ? (
                    <SunIcon className="h-4 w-4 text-amber-500" />
                  ) : (
                    <MoonIcon className="h-4 w-4 text-blue-500" />
                  )}
                  <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {theme}
                </span>
              </Command.Item>

              <Command.Item
                value="Change Wallpaper Theme Scenic Background"
                onSelect={() => runCommand(openWallpaperModal)}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PaletteIcon className="h-4 w-4 text-purple-500" />
                  <span>Customize Wallpaper Theme</span>
                </div>
                <ArrowRightIcon className="h-3.5 w-3.5 text-slate-400" />
              </Command.Item>
            </Command.Group>

            {/* Role Guarded Navigation: Developer */}
            {role === 'developer' && (
              <Command.Group
                heading="Developer Navigation"
                className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 py-1.5"
              >
                <Command.Item
                  value="Developer Dashboard Home Checkin"
                  onSelect={() => runCommand(() => navigate('/developer'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboardIcon className="h-4 w-4 text-brand dark:text-blue-400" />
                    <span>My Dashboard</span>
                  </div>
                  <kbd className="text-[10px] text-slate-400">/developer</kbd>
                </Command.Item>

                <Command.Item
                  value="Submit Log Work Check In"
                  onSelect={() => runCommand(() => navigate('/developer/submit'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ListChecksIcon className="h-4 w-4 text-emerald-500" />
                    <span>Log Work Now (Check-in)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Quick Action
                  </span>
                </Command.Item>

                <Command.Item
                  value="Developer Badges Achievements XP Gamification"
                  onSelect={() => runCommand(() => navigate('/developer/badges'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TrophyIcon className="h-4 w-4 text-amber-500" />
                    <span>Achievements & Badges</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    XP & Streaks
                  </span>
                </Command.Item>

                <Command.Item
                  value="Developer Projects Involved Assigned"
                  onSelect={() => runCommand(() => navigate('/developer/projects'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderKanbanIcon className="h-4 w-4 text-blue-500" />
                    <span>My Projects</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Developer Pending Works Resubmit Tasks Feedback"
                  onSelect={() => runCommand(() => navigate('/developer/pending'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ClockIcon className="h-4 w-4 text-amber-500" />
                    <span>My Pending Works</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Developer Work Logs History Daily"
                  onSelect={() => runCommand(() => navigate('/developer/logs'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ListChecksIcon className="h-4 w-4 text-slate-500" />
                    <span>My Work Logs</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Developer Commits Git Repository"
                  onSelect={() => runCommand(() => navigate('/developer/commits'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <GitCommitVerticalIcon className="h-4 w-4 text-purple-500" />
                    <span>My Commits</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Developer EOD Report End of Day Summary"
                  onSelect={() => runCommand(() => navigate('/developer/eod'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileTextIcon className="h-4 w-4 text-teal-500" />
                    <span>EOD Report</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Developer Profile Account Settings"
                  onSelect={() => runCommand(() => navigate('/developer/profile'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <UserIcon className="h-4 w-4 text-slate-500" />
                    <span>My Profile</span>
                  </div>
                </Command.Item>
              </Command.Group>
            )}

            {/* Role Guarded Navigation: Leader */}
            {role === 'leader' && (
              <Command.Group
                heading="Leader Navigation"
                className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 py-1.5"
              >
                <Command.Item
                  value="Leader Live Dashboard Realtime"
                  onSelect={() => runCommand(() => navigate('/leader'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <RadioIcon className="h-4 w-4 text-emerald-500" />
                    <span>Live Dashboard</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Leader All Developers Team Members"
                  onSelect={() => runCommand(() => navigate('/leader/developers'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <UsersIcon className="h-4 w-4 text-blue-500" />
                    <span>All Developers</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Leader Managed Projects"
                  onSelect={() => runCommand(() => navigate('/leader/projects'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderKanbanIcon className="h-4 w-4 text-purple-500" />
                    <span>Managed Projects</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Leader Log Approvals Review"
                  onSelect={() => runCommand(() => navigate('/leader/approvals'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckSquareIcon className="h-4 w-4 text-teal-500" />
                    <span>Log Approvals</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Leader Weekly Reports Analytics"
                  onSelect={() => runCommand(() => navigate('/leader/reports'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUpIcon className="h-4 w-4 text-indigo-500" />
                    <span>Weekly Reports</span>
                  </div>
                </Command.Item>
              </Command.Group>
            )}

            {/* Role Guarded Navigation: Manager */}
            {role === 'manager' && (
              <Command.Group
                heading="Manager Navigation"
                className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 py-1.5"
              >
                <Command.Item
                  value="Manager My Projects Overview"
                  onSelect={() => runCommand(() => navigate('/manager'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderKanbanIcon className="h-4 w-4 text-brand dark:text-blue-400" />
                    <span>My Projects</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Manager Create Project New"
                  onSelect={() => runCommand(() => navigate('/manager/create'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FilePlus2Icon className="h-4 w-4 text-emerald-500" />
                    <span>Create Project</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Manager Manage Teams Engineering Squads"
                  onSelect={() => runCommand(() => navigate('/manager/teams'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <UsersRoundIcon className="h-4 w-4 text-purple-500" />
                    <span>Manage Teams</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Manager Project Overview Milestones"
                  onSelect={() => runCommand(() => navigate('/manager/overview'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUpIcon className="h-4 w-4 text-indigo-500" />
                    <span>Project Overview</span>
                  </div>
                </Command.Item>
              </Command.Group>
            )}

            {/* Role Guarded Navigation: Admin */}
            {role === 'admin' && (
              <Command.Group
                heading="Admin Navigation"
                className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 py-1.5"
              >
                <Command.Item
                  value="Admin User Management Accounts"
                  onSelect={() => runCommand(() => navigate('/admin'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <UsersIcon className="h-4 w-4 text-red-500" />
                    <span>User Management</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Admin Projects Overview Enterprise"
                  onSelect={() => runCommand(() => navigate('/admin/projects'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <BriefcaseIcon className="h-4 w-4 text-blue-500" />
                    <span>Projects Overview</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Admin Employee Performance Analytics"
                  onSelect={() => runCommand(() => navigate('/admin/performance'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3Icon className="h-4 w-4 text-purple-500" />
                    <span>Employee Performance</span>
                  </div>
                </Command.Item>

                <Command.Item
                  value="Admin Settings System Configuration"
                  onSelect={() => runCommand(() => navigate('/admin/settings'))}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 data-[selected=true]:bg-brand/10 dark:data-[selected=true]:bg-white/15 data-[selected=true]:text-brand dark:data-[selected=true]:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <SettingsIcon className="h-4 w-4 text-slate-500" />
                    <span>Settings</span>
                  </div>
                </Command.Item>
              </Command.Group>
            )}

            {/* Logout */}
            <Command.Group
              heading="Session"
              className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 py-1.5"
            >
              <Command.Item
                value="Logout Sign out Exit Session"
                onSelect={() =>
                  runCommand(() => {
                    logout();
                    navigate('/');
                  })
                }
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 data-[selected=true]:bg-red-500/15 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LogOutIcon className="h-4 w-4" />
                  <span>Log Out ({user?.name || 'Current User'})</span>
                </div>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer Keyboard Hints */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/60 dark:border-white/10 text-[11px] text-slate-400 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/10 font-mono text-[10px]">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/10 font-mono text-[10px]">↵</kbd>
                <span>Select</span>
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              Role: <strong className="capitalize text-slate-600 dark:text-slate-300">{role}</strong>
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

export default CommandPalette;
