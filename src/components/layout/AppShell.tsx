import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Role } from '../../types';

interface AppShellProps {
  role: Role;
}

export function AppShell({ role }: AppShellProps) {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#f6f8fc] dark:bg-[#0b0f19] transition-colors duration-300">
      {/* AMBIENT BACKGROUND GLOW ORBS (Liquid Glass Depth) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
        <div className="absolute -top-[15%] left-[10%] h-[480px] w-[480px] rounded-full bg-gradient-to-br from-blue-400/15 dark:from-blue-600/20 via-indigo-300/10 dark:via-indigo-500/15 to-transparent blur-3xl" />
        <div className="absolute top-[20%] right-[5%] h-[540px] w-[540px] rounded-full bg-gradient-to-bl from-purple-400/12 dark:from-purple-600/20 via-pink-300/8 dark:via-pink-500/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-[10%] left-[30%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-emerald-400/10 dark:from-emerald-600/15 via-teal-300/8 dark:via-teal-500/10 to-transparent blur-3xl" />
      </div>

      {/* FLOATING FROSTED SIDEBAR */}
      <Sidebar role={role} />

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
