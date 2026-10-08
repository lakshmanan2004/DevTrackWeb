// Web Audio API synthesizer for system alert sounds and 10 melodious customizable tones

export interface NotificationSoundOption {
  id: string;
  name: string;
  description: string;
  previewEmoji: string;
  isDefault?: boolean;
}

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  {
    id: 'crystal_chime',
    name: 'Crystal Chime',
    description: 'Sparkling crystalline bell tones with harmonic shimmer',
    previewEmoji: '✨',
    isDefault: true
  },
  {
    id: 'soft_marimba',
    name: 'Soft Marimba',
    description: 'Warm acoustic wooden mallet chord with gentle decay',
    previewEmoji: '🪵'
  },
  {
    id: 'ethereal_harp',
    name: 'Ethereal Harp',
    description: 'Cascading celestial harp arpeggio',
    previewEmoji: '🎶'
  },
  {
    id: 'zen_bell',
    name: 'Zen Bowl',
    description: 'Deep soothing Tibetan singing bowl resonance',
    previewEmoji: '🧘'
  },
  {
    id: 'digital_droplet',
    name: 'Liquid Droplet',
    description: 'Crisp organic water bubble droplet pop',
    previewEmoji: '💧'
  },
  {
    id: 'sunset_kalimba',
    name: 'Sunset Kalimba',
    description: 'Melodic thumb piano double-pluck',
    previewEmoji: '🌅'
  },
  {
    id: 'starlight_glock',
    name: 'Starlight Ping',
    description: 'High-pitch glockenspiel sparkle',
    previewEmoji: '⭐'
  },
  {
    id: 'breeze_flute',
    name: 'Breeze Flute',
    description: 'Soft warm acoustic flute octave swell',
    previewEmoji: '🍃'
  },
  {
    id: 'electric_melody',
    name: 'Modern Cyber Pop',
    description: 'Upbeat 3-note modern digital chime',
    previewEmoji: '⚡'
  },
  {
    id: 'cosmic_pulse',
    name: 'Cosmic Harmony',
    description: 'Lush ambient harmonic crystal sweep',
    previewEmoji: '🌌'
  }
];

export const DEFAULT_NOTIFICATION_SOUND = 'crystal_chime';
const STORAGE_KEY = 'devtrack_notification_sound';

export function getSavedNotificationSound(): string {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SOUND;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_NOTIFICATION_SOUND;
}

export function setSavedNotificationSound(soundId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, soundId);
}

// Global shared AudioContext singleton
let globalAudioCtx: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    globalAudioCtx = new AudioCtx();
  }
  return globalAudioCtx;
}

// User-gesture audio unlocker
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

// Synthesize the 10 distinct melodious sound profiles
export async function playMelodiousSound(soundId?: string, isUrgentVariation = false) {
  const selectedId = soundId || getSavedNotificationSound();
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch {
    // continue
  }

  try {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.85, now);
    master.connect(ctx.destination);

    switch (selectedId) {
      case 'soft_marimba': {
        // Warm wooden marimba chord: A4 (440Hz), C#5 (554.37Hz), E5 (659.25Hz)
        const freqs = isUrgentVariation ? [554.37, 659.25, 880] : [440, 554.37, 659.25];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.65, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.4);
        });
        break;
      }

      case 'ethereal_harp': {
        // Celestial harp ascending arpeggio: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.55, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.45);
        });
        break;
      }

      case 'zen_bell': {
        // Tibetan singing bowl 432Hz with soothing 864Hz harmonic
        const fundamental = isUrgentVariation ? 540 : 432;
        [fundamental, fundamental * 2].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          const vol = i === 0 ? 0.65 : 0.35;
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 1.0);
        });
        break;
      }

      case 'digital_droplet': {
        // Fluid droplet pop sweep
        const startFreq = isUrgentVariation ? 850 : 650;
        const peakFreq = isUrgentVariation ? 2200 : 1850;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.25);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'sunset_kalimba': {
        // Gentle thumb piano double pluck: F#5 (739.99) & B5 (987.77)
        const notes = [739.99, 987.77];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.11);
          gain.gain.setValueAtTime(0.65, now + i * 0.11);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.42);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + i * 0.11);
          osc.stop(now + i * 0.11 + 0.42);
        });
        break;
      }

      case 'starlight_glock': {
        // Sparkling dual glockenspiel tone
        const freqs = isUrgentVariation ? [1567.98, 2093.00] : [1318.51, 1975.53];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.6, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.4);
        });
        break;
      }

      case 'breeze_flute': {
        // Soft acoustic flute swell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.65, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }

      case 'electric_melody': {
        // Cyber 3-note upbeat sequence: D5 (587.33), F#5 (739.99), A5 (880.00)
        const notes = [587.33, 739.99, 880.00];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.65, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.3);
        });
        break;
      }

      case 'cosmic_pulse': {
        // Ambient glass crystal resonance: G4 (392) + D5 (587.33) + G5 (783.99)
        const freqs = [392, 587.33, 783.99];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.5, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.7);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.7);
        });
        break;
      }

      case 'crystal_chime':
      default: {
        // Default Crystal Chime: High C6 (1046.50Hz) and G6 (1567.98Hz)
        const notes = isUrgentVariation ? [1046.50, 1318.51, 1567.98] : [1046.50, 1567.98];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.09);
          gain.gain.setValueAtTime(0.65, now + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.4);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + i * 0.09);
          osc.stop(now + i * 0.09 + 0.4);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Melodious audio playback error:', err);
  }
}

// Master alert sound router that respects user preference
export function playAlertSound(type: 'pop' | 'notification' | 'urgent' | 'late' = 'pop', force = false) {
  if (!force) {
    const currentHour = new Date().getHours();
    // Strictly 8:00 AM to 5:00 PM (17:00)
    if (currentHour < 8 || currentHour >= 17) return;
  }

  if (type === 'urgent') {
    playMelodiousSound(undefined, true);
  } else if (type === 'late') {
    // Late submission tone
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      playMelodiousSound(undefined, true);
    }
  } else {
    playMelodiousSound();
  }
}

// Request and trigger Windows Desktop Pop-up Notification natively via ServiceWorker & Notification API
export async function showWindowsNotification(title: string, body: string, force = false): Promise<boolean> {
  if (!force) {
    const currentHour = new Date().getHours();
    // Strictly 8:00 AM to 5:00 PM (17:00)
    if (currentHour < 8 || currentHour >= 17) return false;
  }

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
          icon: '/Simats-logo.png',
          tag: 'devtrack-checkin',
          requireInteraction: true,
          badge: '/Simats-logo.png'
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
      icon: '/Simats-logo.png',
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
