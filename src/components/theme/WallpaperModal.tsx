import React from 'react';
import { XIcon, CheckCircle2Icon, SparklesIcon, PaletteIcon } from 'lucide-react';
import { useTheme, WALLPAPERS, WallpaperOption } from '../../context/ThemeContext';

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WallpaperModal({ isOpen, onClose }: WallpaperModalProps) {
  const { wallpaper, setWallpaper } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 sm:p-6 backdrop-blur-xl animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallpaper-modal-title"
    >
      <div className="glass-modal relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/40 dark:border-white/15 p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/20 dark:border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/20 shadow-xs">
                <PaletteIcon className="h-4 w-4" />
              </div>
              <h2 id="wallpaper-modal-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Workspace Background
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Choose between clean ambient Liquid Glass or scenic background wallpapers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Wallpaper Grid with Generous Gaps */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 max-h-[64vh] overflow-y-auto p-1 pr-2">
          {WALLPAPERS.map((item: WallpaperOption) => {
            const isSelected = wallpaper === item.file;

            return (
              <div
                key={item.id}
                onClick={() => setWallpaper(item.file)}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer text-left hover:-translate-y-1 ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/60 shadow-xl shadow-blue-500/20 bg-white/70 dark:bg-slate-900/80 scale-[1.01]'
                    : 'border-white/30 dark:border-white/10 bg-white/45 dark:bg-slate-900/50 hover:border-white/60 hover:bg-white/70 dark:hover:bg-slate-900/70 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-800">
                  {item.file ? (
                    <>
                      <img
                        src={item.file}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60" />
                    </>
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-950 overflow-hidden">
                      <div className="absolute -top-8 -left-8 h-28 w-28 rounded-full bg-blue-500/25 blur-2xl" />
                      <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-purple-500/20 blur-2xl" />
                      <div className="glass-surface relative z-10 flex items-center gap-1.5 rounded-xl px-3 py-1.5 border border-white/50 dark:border-white/15 shadow-xs">
                        <SparklesIcon className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Pure Liquid Glass</span>
                      </div>
                    </div>
                  )}

                  {/* Active Selection Pill Badge */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg backdrop-blur-md ring-1 ring-white/30">
                      <CheckCircle2Icon className="h-3.5 w-3.5" />
                      <span>Active</span>
                    </div>
                  )}
                </div>

                {/* Card Meta & Typography */}
                <div className="p-3.5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-white/20 dark:border-white/10 pt-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Settings persist across your authenticated sessions automatically.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-glass-primary px-6 py-2 text-xs font-bold rounded-xl shadow-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
