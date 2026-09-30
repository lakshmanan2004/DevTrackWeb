// Web Audio API synthesizer for system alert sounds without external assets
export function playAlertSound(type: 'pop' | 'notification' | 'urgent' | 'late') {
  if (new Date().getHours() >= 17) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'pop') {
      // 20 min pop sound: 600Hz -> 150Hz soft frequency sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'notification') {
      // 10 min notification chime: double pleasant tone (880Hz then 1760Hz)
      const now = ctx.currentTime;
      [880, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.3, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.2);
      });
    } else if (type === 'urgent') {
      // 5 min urgent warning: 3 rapid high pitch alert beeps
      const now = ctx.currentTime;
      [1000, 1200, 1400].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.35, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.08);
      });
    } else if (type === 'late') {
      // Late submission warning: low buzz pitch (220Hz -> 110Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    console.warn('Audio alert playback error:', err);
  }
}

// Request and trigger Windows Desktop Pop-up Notification natively via ServiceWorker & Notification API
export async function showWindowsNotification(title: string, body: string): Promise<boolean> {
  if (new Date().getHours() >= 17) return false;
  if (typeof Notification === 'undefined') return false;

  let perm = Notification.permission;
  if (perm === 'default') {
    try {
      perm = await Notification.requestPermission();
    } catch {
      /* fallback */
    }
  }

  if (perm !== 'granted') {
    console.warn('Notification permission not granted by browser settings:', perm);
    return false;
  }

  // 1. Service Worker Notification (Native Windows Action Center integration)
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/vite.svg',
          tag: 'devtrack-checkin',
          requireInteraction: true,
          badge: '/vite.svg'
        });
        return true;
      }
    } catch (e) {
      console.warn('Service worker notification error, attempting direct API:', e);
    }
  }

  // 2. Fallback to Direct Notification API
  try {
    const notif = new Notification(title, {
      body,
      icon: '/vite.svg',
      tag: 'devtrack-checkin',
      requireInteraction: true
    });
    notif.onclick = () => {
      window.focus();
    };
    return true;
  } catch (e) {
    console.warn('Standard notification failed:', e);
    return false;
  }
}
