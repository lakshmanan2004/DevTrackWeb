import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOutIcon, SearchIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { navFor } from './navConfig';

interface SidebarProps {
  role: Role;
}

const avatarTone: Record<Role, 'blue' | 'purple' | 'red'> = {
  developer: 'blue',
  leader: 'blue',
  manager: 'purple',
  admin: 'red'
};

const roleLabels: Record<Role, string> = {
  developer: 'Developer',
  leader: 'Team Leader',
  manager: 'Project Manager',
  admin: 'Admin'
};

export const Sidebar = React.memo(function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, badges, settings, logout } = useAuth();
  const appName = settings?.companyName || 'DevTrack';
  const appTagline = settings?.brandTagline || 'Pro';
  const appLogo = settings?.logoUrl || '/Simats-logo.png';
  const nav = navFor(role, badges);

  const isItemActive = (to: string) => {
    if (to.split('/').length === 2) {
      return location.pathname === to;
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('devtrack_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('devtrack_sidebar_collapsed', String(next));
      } catch {
        /* ignore localStorage errors */
      }
      return next;
    });
  };

  const context = user?.email || (role === 'admin' ? 'System owner' : '');

  return (
    <aside
      className={`relative glass-dark flex h-full shrink-0 flex-col text-slate-800 dark:text-[#F5F5F5] select-none z-40 transition-all duration-300 ease-in-out overscroll-none border-r border-slate-200/80 dark:border-white/10 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* APP BRANDING HEADER — FIXED 68px HEIGHT */}
      <div className={`flex h-[68px] shrink-0 items-center border-b border-slate-200/80 dark:border-white/10 ${
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4 gap-2'
      }`}>
        <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
          {/* APP LOGO BUTTON AS COLLAPSE/EXPAND TOGGLE */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="group relative flex items-center justify-center rounded-xl p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            aria-label={isCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
            title={isCollapsed ? 'Expand sidebar (Click logo)' : 'Collapse sidebar (Click logo)'}
          >
            <img
              src={appLogo}
              alt={appName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/Simats-logo.png';
              }}
              className="h-8 w-8 rounded-xl object-contain bg-white p-1 shrink-0 shadow-md ring-1 ring-slate-200 dark:ring-white/30 group-hover:ring-blue-500/80 transition-all"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            
            {/* Tooltip in collapsed mode for logo */}
            {isCollapsed && (
              <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center rounded-xl border border-slate-200 dark:border-white/20 bg-white/95 dark:bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-2xl backdrop-blur-xl z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                <span>Expand sidebar</span>
              </div>
            )}
          </button>

          {/* APP TITLE & ROLE (Hidden in collapsed mode) */}
          {!isCollapsed && (
            <div className="min-w-0 flex-1 transition-opacity duration-200">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white truncate" title={appName}>
                  {appName}
                </span>
                <span className="shrink-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/25 dark:border-blue-400/30 text-[9px] px-1.5 py-0.2 font-extrabold uppercase tracking-wider">
                  {appTagline}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate font-semibold">{roleLabels[role]}</p>
            </div>
          )}
        </div>

        {/* THEME TOGGLE (Hidden in collapsed mode) */}
        {!isCollapsed && <ThemeToggle variant="compact" />}
      </div>

      {/* COMMAND PALETTE LAUNCHER (CTRL+K) */}
      <div className={`pt-2.5 pb-1 ${isCollapsed ? 'px-2 flex justify-center' : 'px-3'}`}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('devtrack:open-command-palette'))}
            className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-300/40 dark:border-white/10 transition-colors cursor-pointer"
            aria-label="Open command palette (Ctrl+K)"
            title="Search & Commands (Ctrl+K)"
          >
            <SearchIcon className="h-4 w-4" />
            <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center rounded-xl border border-slate-200 dark:border-white/20 bg-white/95 dark:bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-2xl backdrop-blur-xl z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
              Command Palette (Ctrl+K)
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('devtrack:open-command-palette'))}
            className="w-full flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-300/40 dark:border-white/10 transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-slate-200">
              <SearchIcon className="h-3.5 w-3.5" />
              <span>Search or jump to...</span>
            </span>
            <kbd className="rounded bg-slate-300/60 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* NAVIGATION LINKS */}
      <nav
        className={`flex-1 space-y-1.5 py-4 overflow-y-auto overflow-x-hidden overscroll-none ${
          isCollapsed ? 'px-2' : 'px-3'
        }`}
        aria-label="Primary"
      >
        {nav.map((item) => {
          const isActive = isItemActive(item.to);
          return (
            <button
              key={item.to}
              type="button"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.button === 1) {
                  window.open(item.to, '_blank');
                } else {
                  navigate(item.to);
                }
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full group relative flex items-center text-xs transition-all duration-200 cursor-pointer text-left ${
                isCollapsed
                  ? 'justify-center p-2 h-10 w-12 mx-auto rounded-xl'
                  : 'gap-3 px-3.5 py-2.5 rounded-xl'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 dark:bg-gradient-to-r dark:from-blue-600/30 dark:to-blue-500/15 dark:text-white dark:border dark:border-blue-400/40 dark:shadow-[0_0_20px_rgba(37,99,235,0.25)] dark:ring-1 dark:ring-blue-400/30 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.08] border border-transparent hover:border-slate-300/60 dark:hover:border-white/10 font-semibold'
              }`}
            >
              <span
                className={`shrink-0 transition-all duration-200 ${
                  isActive
                    ? 'text-white dark:text-blue-400 scale-105'
                    : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-950 dark:group-hover:text-slate-200 group-hover:scale-105'
                }`}
              >
                {item.icon}
              </span>

              {/* LABEL (EXPANDED MODE) */}
              {!isCollapsed && (
                <span className={`flex-1 truncate tracking-tight transition-colors ${
                  isActive
                    ? 'text-white dark:text-white font-bold'
                    : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white font-semibold'
                }`}>
                  {item.label}
                </span>
              )}

              {/* BADGE (EXPANDED MODE) */}
              {!isCollapsed && item.badge && item.badge !== '0' && (
                <span
                  className={`min-w-[20px] h-5 rounded-full px-1.5 inline-flex items-center justify-center text-[10px] font-black tabular-nums transition-all ${
                    isActive
                      ? 'bg-white/25 text-white shadow-xs font-black'
                      : 'bg-rose-500 text-white shadow-xs font-bold'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* BADGE DOT (COLLAPSED MODE) */}
              {isCollapsed && item.badge && item.badge !== '0' && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                  {item.badge}
                </span>
              )}

              {/* FLOATING HOVER TOOLTIP (COLLAPSED MODE) */}
              {isCollapsed && (
                <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/20 bg-white/95 dark:bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-2xl backdrop-blur-xl z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                  <span>{item.label}</span>
                  {item.badge && item.badge !== '0' && (
                    <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* FOOTER USER PROFILE CARD */}
      <div className="border-t border-slate-200/80 dark:border-white/10 p-3 bg-white/50 dark:bg-black/25 shrink-0">
        {isCollapsed ? (
          /* COLLAPSED COMPACT PROFILE */
          <div className="flex flex-col items-center gap-3 py-1">
            <button
              type="button"
              onClick={() => navigate(`/${role}/profile`)}
              className="group relative flex items-center justify-center rounded-2xl p-1 transition-all hover:bg-slate-900/5 dark:hover:bg-white/[0.08] cursor-pointer"
              aria-label="View My Profile"
              title={user?.name || 'View Profile'}
            >
              <Avatar initials={user?.initials || '··'} tone={avatarTone[role]} />
              <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center rounded-xl border border-slate-200 dark:border-white/20 bg-white/95 dark:bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-2xl backdrop-blur-xl z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                {user?.name || 'My Profile'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="group relative flex items-center justify-center rounded-xl p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-300 transition-all cursor-pointer"
              aria-label="Logout"
              title="Logout"
            >
              <LogOutIcon className="h-4 w-4" aria-hidden="true" />
              <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center rounded-xl border border-slate-200 dark:border-white/20 bg-white/95 dark:bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 shadow-2xl backdrop-blur-xl z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                Logout
              </div>
            </button>
          </div>
        ) : (
          /* EXPANDED FULL PROFILE */
          <>
            <button
              type="button"
              onClick={() => navigate(`/${role}/profile`)}
              className="w-full flex items-center gap-3 rounded-2xl p-2.5 transition-all hover:bg-white dark:hover:bg-white/[0.08] group cursor-pointer border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white/90 dark:bg-white/[0.03] text-left shadow-xs"
              title="View My Profile"
            >
              <div className="relative">
                <Avatar initials={user?.initials || '··'} tone={avatarTone[role]} />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {user?.name || 'Loading…'}
                </p>
                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 font-medium">{context}</p>
              </div>
            </button>

            <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
              <Badge tone={avatarTone[role]} className="text-[10px] font-extrabold shadow-2xs">
                {roleLabels[role]}
              </Badge>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-all hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-300 hover:border-red-500/30 border border-transparent cursor-pointer"
              >
                <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
});
