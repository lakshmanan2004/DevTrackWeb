import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export function SplashScreen({ onComplete, minDurationMs = 1300 }: SplashScreenProps) {
  const [stage, setStage] = useState<'visible' | 'fading' | 'done'>('visible');
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Animate progress smoothly
    const progressTimer1 = setTimeout(() => setProgress(55), 250);
    const progressTimer2 = setTimeout(() => setProgress(88), 650);
    const progressTimer3 = setTimeout(() => setProgress(100), 1050);

    // Trigger fade-out transition after minDurationMs
    const fadeTimer = setTimeout(() => {
      setStage('fading');
    }, minDurationMs);

    // Completely unmount after fade transition ends
    const doneTimer = setTimeout(() => {
      setStage('done');
      if (onComplete) onComplete();
    }, minDurationMs + 450);

    return () => {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [minDurationMs, onComplete]);

  if (stage === 'done') return null;

  return (
    <div
      aria-label="Loading SIMATS DevTrack"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-500 ease-out bg-gradient-to-br from-[#f8fbff] via-[#edf5ff] to-[#e8f0fe] dark:from-[#090A0C] dark:via-[#111315] dark:to-[#181A1D] ${
        stage === 'fading'
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft Aurora / Ambient Glow Orbs behind (matches Login page) */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-blue-400/25 via-sky-300/20 to-transparent blur-[80px] dark:from-[#1683FF]/15 dark:via-transparent" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-radial from-white/95 via-sky-100/60 to-transparent blur-3xl dark:from-[#1683FF]/08 dark:via-transparent dark:to-transparent" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-indigo-300/25 via-purple-200/20 to-transparent blur-[90px] dark:from-[#1683FF]/06 dark:via-transparent" />

      {/* Center Floating Glass Card */}
      <div className="relative z-10 flex flex-col items-center text-center p-8 sm:p-10 rounded-3xl border border-white/80 dark:border-white/15 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(37,99,235,0.12)] max-w-sm w-full mx-4">
        {/* Glowing Logo Container */}
        <div className="relative mb-5">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-400/30 to-indigo-400/30 blur-xl opacity-80 animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/90 dark:border-white/20 bg-white/90 dark:bg-white/10 p-3 shadow-[0_8px_32px_rgba(59,130,246,0.16)] backdrop-blur-xl">
            <img
              src="/Simats-logo.png"
              alt="SIMATS Logo"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
        </div>

        {/* Brand Titles */}
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          SIMATS <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-sky-400 dark:to-indigo-300 bg-clip-text text-transparent">DevTrack</span>
        </h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Activity & Project Intelligence
        </p>

        {/* Progress Bar */}
        <div className="mt-6 w-48 max-w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10 p-[1px] backdrop-blur-sm">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(59,130,246,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Initializing workspace…
          </p>
        </div>

        {/* Bottom micro-tag */}
        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 w-full flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          <span>SIMATS Engineering</span>
          <span>•</span>
          <span>v2.0</span>
        </div>
      </div>
    </div>
  );
}
