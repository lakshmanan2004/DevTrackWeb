import React from 'react';
import {
  BarChart3Icon,
  BellIcon,
  BriefcaseIcon,
  CheckSquareIcon,
  ClockIcon,
  FilePlus2Icon,
  FileTextIcon,
  FolderKanbanIcon,
  GitCommitVerticalIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  RadioIcon,
  SettingsIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
  UsersRoundIcon } from
'lucide-react';
import { Role } from '../../types';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export interface Badges {
  alerts: number;
  approvals: number;
  pendingWorks: number;
}

const size = 'h-4 w-4';

// Live nav: badges come from /api/auth/me via AuthContext and update in real time.
export function navFor(role: Role, badges: Badges = { alerts: 0, approvals: 0, pendingWorks: 0 }): NavItem[] {
  if (role === 'developer') {
    return [
      { to: '/developer', label: 'My Dashboard', icon: <LayoutDashboardIcon className={size} /> },
      { to: '/developer/projects', label: 'My Projects', icon: <FolderKanbanIcon className={size} /> },
      { to: '/developer/pending', label: 'My Pending Works', icon: <ClockIcon className={size} />, badge: badges.pendingWorks > 0 ? String(badges.pendingWorks) : undefined },
      { to: '/developer/logs', label: 'My Work Logs', icon: <ListChecksIcon className={size} /> },
      { to: '/developer/commits', label: 'My Commits', icon: <GitCommitVerticalIcon className={size} /> },
      { to: '/developer/eod', label: 'EOD Report', icon: <FileTextIcon className={size} /> },
      { to: '/developer/alerts', label: 'My Alerts', icon: <BellIcon className={size} />, badge: badges.alerts > 0 ? String(badges.alerts) : undefined },
      { to: '/developer/profile', label: 'My Profile', icon: <UserIcon className={size} /> }
    ];
  }
  if (role === 'leader') {
    return [
      { to: '/leader', label: 'Live Dashboard', icon: <RadioIcon className={size} /> },
      { to: '/leader/developers', label: 'All Developers', icon: <UsersIcon className={size} /> },
      { to: '/leader/projects', label: 'Managed Projects', icon: <FolderKanbanIcon className={size} /> },
      { to: '/leader/alerts', label: 'Alerts', icon: <BellIcon className={size} />, badge: badges.alerts > 0 ? String(badges.alerts) : undefined },
      { to: '/leader/reports', label: 'Weekly Reports', icon: <TrendingUpIcon className={size} /> },
      { to: '/leader/commits', label: 'Commits Overview', icon: <GitCommitVerticalIcon className={size} /> },
      { to: '/leader/approvals', label: 'Log Approvals', icon: <CheckSquareIcon className={size} />, badge: badges.approvals > 0 ? String(badges.approvals) : undefined },
      { to: '/leader/profile', label: 'My Profile', icon: <UserIcon className={size} /> }
    ];
  }
  if (role === 'manager') {
    return [
      { to: '/manager', label: 'My Projects', icon: <FolderKanbanIcon className={size} /> },
      { to: '/manager/create', label: 'Create Project', icon: <FilePlus2Icon className={size} /> },
      { to: '/manager/teams', label: 'Manage Teams', icon: <UsersRoundIcon className={size} /> },
      { to: '/manager/overview', label: 'Project Overview', icon: <TrendingUpIcon className={size} /> },
      { to: '/manager/alerts', label: 'Alerts', icon: <BellIcon className={size} />, badge: badges.alerts > 0 ? String(badges.alerts) : undefined },
      { to: '/manager/profile', label: 'My Profile', icon: <UserIcon className={size} /> }
    ];
  }
  return [
    { to: '/admin', label: 'User Management', icon: <UsersIcon className={size} /> },
    { to: '/admin/projects', label: 'Projects Overview', icon: <BriefcaseIcon className={size} /> },
    { to: '/admin/performance', label: 'Employee Performance', icon: <BarChart3Icon className={size} /> },
    { to: '/admin/settings', label: 'Settings', icon: <SettingsIcon className={size} /> },
    { to: '/admin/profile', label: 'My Profile', icon: <UserIcon className={size} /> }
  ];
}
