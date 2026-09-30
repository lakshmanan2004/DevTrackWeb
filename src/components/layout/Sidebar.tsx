import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
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

  const context =
    user?.role === 'developer'
      ? `${user.teamName || 'No team'}${user.projectName ? ` · ${user.projectName}` : ''}`
      : user?.role === 'leader'
      ? user.projectName || user.teamName || ''
      : user?.role === 'manager'
      ? user.projectName
      : 'System owner';

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-navy text-white overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-5">
        <img
          src="/SIMATS-logo.jpg"
          alt="DevTrack Logo"
          className="h-9 w-9 rounded-lg object-contain bg-white p-0.5 shrink-0 shadow-sm"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none truncate">DevTrack</p>
          <p className="mt-1 text-[11px] text-slate-400 truncate">{roleLabels[role]} workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Primary">
        {nav.map((item) =>
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length === 2}
            className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out ${
            isActive ?
            'bg-brand-light text-white' :
            'text-slate-300 hover:bg-navy-700 hover:text-white'}`
            }
          >
            {({ isActive }) =>
          <>
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && item.badge !== '0' && (
                  <span
                    className={`min-w-[20px] h-5 rounded-full px-1.5 inline-flex items-center justify-center text-[11px] font-bold tabular-nums transition-colors ${
                      isActive ? 'bg-white text-brand' : 'bg-danger text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
          }
          </NavLink>
        )}
      </nav>

      <div className="border-t border-navy-700 p-4">
        <NavLink
          to={`/${role}/profile`}
          className="flex items-center gap-3 rounded-lg p-1.5 -m-1.5 transition-colors duration-150 hover:bg-navy-700 group cursor-pointer"
          title="View My Profile"
        >
          <Avatar initials={user?.initials || '··'} tone={avatarTone[role]} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold group-hover:text-brand-light transition-colors">{user?.name || 'Loading…'}</p>
            <p className="truncate text-[11px] text-slate-400">{context}</p>
          </div>
        </NavLink>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge tone={avatarTone[role]}>{roleLabels[role]}</Badge>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-300 transition-colors duration-150 ease-out hover:bg-navy-700 hover:text-white">
            <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </aside>);
}
