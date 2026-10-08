import React, { useState } from 'react';
import {
  Volume2Icon,
  PlayIcon,
  CheckIcon,
  XIcon,
  MusicIcon,
  SparklesIcon
} from 'lucide-react';
import {
  NOTIFICATION_SOUNDS,
  getSavedNotificationSound,
  setSavedNotificationSound,
  playMelodiousSound,
  NotificationSoundOption
} from '../../utils/audioAlerts';

interface NotificationSoundModalProps {
  open: boolean;
  onClose: () => void;
  onSoundChanged?: (soundId: string) => void;
}

export function NotificationSoundModal({
  open,
  onClose,
  onSoundChanged
}: NotificationSoundModalProps) {
  const [activeSoundId, setActiveSoundId] = useState<string>(getSavedNotificationSound());
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!open) return null;

  const handleSelectSound = (sound: NotificationSoundOption) => {
    setActiveSoundId(sound.id);
    setSavedNotificationSound(sound.id);
    setPlayingId(sound.id);
    playMelodiousSound(sound.id);
    if (onSoundChanged) {
      onSoundChanged(sound.id);
    }
    setTimeout(() => {
      setPlayingId(null);
    }, 600);
  };

  const handlePreviewPlay = (e: React.MouseEvent, soundId: string) => {
    e.stopPropagation();
    setPlayingId(soundId);
    playMelodiousSound(soundId);
    setTimeout(() => {
      setPlayingId(null);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 sm:p-6 backdrop-blur-xl animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-modal relative w-full max-w-xl overflow-hidden rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/40 dark:border-white/10 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-inner">
              <MusicIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Notification Alert Sound
                <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2.5 py-0.5">
                  10 Melodious Tones
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select your preferred melodious chime for check-in alerts and pop-ups
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close sound selector"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* List of 10 sounds */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {NOTIFICATION_SOUNDS.map((sound) => {
            const isSelected = activeSoundId === sound.id;
            const isCurrentlyPlaying = playingId === sound.id;

            return (
              <div
                key={sound.id}
                onClick={() => handleSelectSound(sound)}
                className={`glass-surface group flex items-center justify-between gap-3 rounded-2xl p-3.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500/80 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-glass'
                    : 'border-white/20 dark:border-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/40 dark:bg-white/10 text-lg shadow-2xs">
                    {sound.previewEmoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {sound.name}
                      </p>
                      {sound.isDefault && (
                        <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold uppercase px-2 py-0.2 tracking-wider">
                          Default
                        </span>
                      )}
                      {isSelected && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[9px] font-extrabold uppercase px-2 py-0.2">
                          <CheckIcon className="h-2.5 w-2.5" />
                          Active Sound
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {sound.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handlePreviewPlay(e, sound.id)}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                      isCurrentlyPlaying
                        ? 'bg-amber-500 text-white scale-105 shadow-glass'
                        : 'glass-surface text-slate-700 dark:text-slate-200 hover:bg-white/20'
                    }`}
                    title="Play preview"
                  >
                    {isCurrentlyPlaying ? (
                      <SparklesIcon className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <PlayIcon className="h-3.5 w-3.5 fill-current" />
                    )}
                    <span className="text-[11px]">{isCurrentlyPlaying ? 'Playing' : 'Preview'}</span>
                  </button>

                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500 text-white shadow-2xs'
                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
                    }`}
                  >
                    {isSelected && <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-200/50 dark:border-white/10 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Volume2Icon className="h-3.5 w-3.5 text-slate-400" />
            <span>Sound saved automatically across all device sessions</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="btn-glass-primary rounded-xl px-5 py-2 text-xs font-bold shadow-glass cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
