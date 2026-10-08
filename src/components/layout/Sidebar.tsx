import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';
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

export function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();
  const { user, badges, logout } = useAuth();
  const nav = navFor(role, badges);

  const context = user?.email || (role === 'admin' ? 'System owner' : '');

  return (
    <aside className="glass-dark flex h-screen w-64 shrink-0 flex-col text-[#F5F5F5] overflow-hidden select-none z-40">
      {/* APP BRANDING HEADER */}
      <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <img
              src="/Simats-logo.png"
              alt="DevTrack Logo"
              className="h-8 w-8 rounded-xl object-contain bg-white/95 p-1 shrink-0 shadow-md ring-1 ring-white/30"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black tracking-tight text-[#F5F5F5] truncate flex items-center gap-1">
              DevTrack
              <span className="rounded-full bg-[rgba(22,131,255,0.16)] text-[#5AA9FF] border border-[rgba(22,131,255,0.35)] text-[8px] px-1.5 py-0.2 font-extrabold uppercase">
                Pro
              </span>
            </p>
            <p className="text-[10px] text-[#A1A1AA] truncate font-medium">{roleLabels[role]}</p>
          </div>
        </div>
        <ThemeToggle variant="compact" />
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto" aria-label="Primary">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length === 2}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-[rgba(22,131,255,0.16)] text-[#5AA9FF] border border-[rgba(22,131,255,0.35)] shadow-[0_0_24px_rgba(22,131,255,0.16)] translate-x-0.5'
                  : 'text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#F5F5F5] border border-transparent hover:border-white/10'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`shrink-0 transition-all duration-200 ${isActive ? 'text-[#5AA9FF] scale-110 drop-shadow-[0_0_12px_rgba(22,131,255,0.5)]' : 'text-[#71717A] group-hover:text-[#A1A1AA]'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate tracking-tight">{item.label}</span>
                {item.badge && item.badge !== '0' && (
                  <span
                    className={`min-w-[20px] h-5 rounded-full px-1.5 inline-flex items-center justify-center text-[10px] font-black tabular-nums transition-all ${
                      isActive
                        ? 'bg-[#1683FF] text-white shadow-xs shadow-blue-500/30 font-black'
                        : 'bg-rose-500/80 text-white shadow-xs'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER USER PROFILE CARD */}
      <div className="border-t border-white/10 p-3 bg-black/25 backdrop-blur-md">
        <NavLink
          to={`/${role}/profile`}
          className="flex items-center gap-3 rounded-2xl p-2.5 transition-all hover:bg-white/[0.06] group cursor-pointer border border-white/5 hover:border-white/15"
          title="View My Profile"
        >
          <div className="relative">
            <Avatar initials={user?.initials || '··'} tone={avatarTone[role]} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#F5F5F5] group-hover:text-[#5AA9FF] transition-colors">
              {user?.name || 'Loading…'}
            </p>
            <p className="truncate text-[10px] text-[#A1A1AA] font-medium">{context}</p>
          </div>
        </NavLink>

        <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          <Badge tone={avatarTone[role]} className="text-[10px] font-extrabold">
            {roleLabels[role]}
          </Badge>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold text-[#A1A1AA] transition-all hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 border border-transparent cursor-pointer"
          >
            <LogOutIcon className="h-3 w-3" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
