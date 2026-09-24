import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Role } from '../../types';

interface AppShellProps {
  role: Role;
}

export function AppShell({ role }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      <Sidebar role={role} />
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
