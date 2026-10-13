import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Role } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { WallpaperModal } from '../theme/WallpaperModal';

interface AppShellProps {
  role: Role;
}

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-12 min-h-[300px]">
      <div className="h-7 w-7 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
    </div>
  );
}

export function AppShell({ role }: AppShellProps) {
  const { wallpaper, isWallpaperModalOpen, closeWallpaperModal } = useTheme();
  const location = useLocation();
  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
      mainRef.current.scrollLeft = 0;
    }
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-transparent">
      {/* SCENIC WALLPAPER BACKGROUND — Fixed & Theme-Independent Layer */}
      {wallpaper ? (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-slate-950 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${wallpaper})`
          }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-0 bg-transparent" />
      )}

      {/* FLOATING FROSTED SIDEBAR */}
      <Sidebar role={role} />

      {/* MAIN CONTENT AREA WITH CLEAN SCROLLING */}
      <main
        ref={mainRef}
        className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-transparent w-full max-w-full"
      >
        <div key={location.pathname} className="animate-page-enter flex min-w-0 flex-1 flex-col w-full max-w-full">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* WALLPAPER THEME MODAL */}
      <WallpaperModal isOpen={isWallpaperModalOpen} onClose={closeWallpaperModal} />
    </div>
  );
}
