import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Role } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { WallpaperModal } from '../theme/WallpaperModal';

interface AppShellProps {
  role: Role;
}

export function AppShell({ role }: AppShellProps) {
  const { wallpaper, isWallpaperModalOpen, closeWallpaperModal } = useTheme();
  const location = useLocation();

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-transparent">
      {/* SCENIC WALLPAPER BACKGROUND — Fixed & Theme-Independent Layer */}
      {wallpaper ? (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
          style={{
            backgroundImage: `url(${wallpaper})`
          }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-0 bg-[#E0EFFF] dark:bg-[#090d16] transition-colors duration-500" />
      )}

      {/* FLOATING FROSTED SIDEBAR */}
      <Sidebar role={role} />

      {/* MAIN CONTENT AREA WITH SMOOTH ROUTE TRANSITION */}
      <main className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-transparent w-full">
        <div key={location.pathname} className="flex min-w-0 flex-1 flex-col w-full animate-page-enter">
          <Outlet />
        </div>
      </main>

      {/* WALLPAPER THEME MODAL */}
      <WallpaperModal isOpen={isWallpaperModalOpen} onClose={closeWallpaperModal} />
    </div>
  );
}
