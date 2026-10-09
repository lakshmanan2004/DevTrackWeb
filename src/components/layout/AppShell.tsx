import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Role } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { WallpaperModal } from '../theme/WallpaperModal';

interface AppShellProps {
  role: Role;
}

export function AppShell({ role }: AppShellProps) {
  const { wallpaper, isWallpaperModalOpen, closeWallpaperModal } = useTheme();

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-950">
      {/* SCENIC WALLPAPER BACKGROUND — Fixed & Theme-Independent Layer */}
      {wallpaper ? (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${wallpaper})`
          }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-0 bg-[#E0EFFF] dark:bg-slate-950" />
      )}

      {/* FLOATING FROSTED SIDEBAR */}
      <Sidebar role={role} />

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        <Outlet />
      </main>

      {/* WALLPAPER THEME MODAL */}
      <WallpaperModal isOpen={isWallpaperModalOpen} onClose={closeWallpaperModal} />
    </div>
  );
}
