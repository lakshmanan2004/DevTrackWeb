import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  speedY: number;
  pulsePhase: number;
  pulseSpeed: number;
}

export const StarfieldBackground = React.memo(function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark, isLiteMode } = useTheme();

  useEffect(() => {
    // In lite mode, skip canvas rendering completely
    if (isLiteMode) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isPaused = document.hidden;

    // Resize handler
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Visibility listener to pause rAF loop when tab is hidden
    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize ~100 lightweight stars
    const starCount = 100;
    const stars: Star[] = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < starCount; i++) {
      const baseAlpha = 0.2 + Math.random() * 0.6;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.5 + Math.random() * 1.0,
        alpha: baseAlpha,
        baseAlpha,
        speedY: 0.08 + Math.random() * 0.18,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.03
      });
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      if (isPaused) return;

      const delta = Math.min((time - lastTime) / 16.666, 3);
      lastTime = time;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const starColor = isDark ? '255, 255, 255' : '15, 23, 42';

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (!prefersReducedMotion) {
          // Drift upwards slowly
          star.y -= star.speedY * delta;
          if (star.y < -5) {
            star.y = h + 5;
            star.x = Math.random() * w;
          }

          // Gentle pulse
          star.pulsePhase += star.pulseSpeed * delta;
          star.alpha = star.baseAlpha + Math.sin(star.pulsePhase) * 0.25;
        }

        const clampedAlpha = Math.max(0.05, Math.min(star.alpha, 0.9));

        ctx.fillStyle = `rgba(${starColor}, ${clampedAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDark, isLiteMode]);

  if (isLiteMode) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Ambient Space Nebulae Gradient Blobs */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[140px] dark:bg-blue-500/12 pointer-events-none" />
      <div className="absolute top-1/3 right-0 h-[650px] w-[650px] rounded-full bg-purple-600/08 blur-[160px] dark:bg-indigo-500/10 pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 h-[700px] w-[700px] rounded-full bg-cyan-600/08 blur-[150px] dark:bg-sky-500/08 pointer-events-none" />

      {/* 60fps rAF Starfield Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});

