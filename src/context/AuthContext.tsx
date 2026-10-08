import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, onUnauthorized, setToken } from '../api/client';
import { connectSocket, disconnectSocket, onSocketEvent } from '../api/socket';
import { playAlertSound, showWindowsNotification } from '../utils/audioAlerts';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'leader' | 'manager' | 'admin';
  initials: string;
  github: string;
  jobTitle: string;
  teamName: string;
  projectName: string;
  leaderName: string;
  lunchSlot?: number;
}

export interface Badges {
  alerts: number;
  approvals: number;
  pendingWorks: number;
}

interface MeResponse {
  user: AuthUser;
  badges: Badges;
  serverDate: string;
  currentSlot: number;
  settings: { workStartHour: number; workEndHour: number; minWords: number; eodDeadline: string };
}

interface AuthContextValue {
  user: AuthUser | null;
  badges: Badges;
  settings: MeResponse['settings'] | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  badges: { alerts: 0, approvals: 0, pendingWorks: 0 },
  settings: null,
  loading: true,
  login: async () => {
    throw new Error('AuthContext not ready');
  },
  logout: () => {},
  refresh: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [badges, setBadges] = useState<Badges>({ alerts: 0, approvals: 0, pendingWorks: 0 });
  const [settings, setSettings] = useState<MeResponse['settings'] | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<MeResponse>('/api/auth/me');
      setUser(me.user);
      setBadges(me.badges);
      setSettings(me.settings);
    } catch (err: any) {
      if (err.status === 401 || err.message?.includes('401')) {
        setToken(null);
        setUser(null);
        disconnectSocket();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onUnauthorized(() => {
      setToken(null);
      setUser(null);
      disconnectSocket();
    });
    return unsub;
  }, []);

  useEffect(() => {
    refresh().then(() => {
      if (getToken()) connectSocket();
    });
  }, [refresh]);

  // Real-time audio and desktop popup notification listeners (ONLY for developers during work hours)
  useEffect(() => {
    if (!user) return;

    const isDevWorkHours = () => {
      if (user.role !== 'developer') return false;
      const h = new Date().getHours();
      return h >= 8 && h < 17; // Strictly 8:00 AM to 5:00 PM
    };

    const unsub1 = onSocketEvent('alert:new', (payload: any) => {
      refresh();
      if (isDevWorkHours()) {
        playAlertSound('urgent');
        showWindowsNotification('DevTrack Alert', payload?.title || 'New alert received');
      }
    });
    const unsub2 = onSocketEvent('task:assigned', (payload: any) => {
      refresh();
      if (isDevWorkHours()) {
        playAlertSound('notification');
        showWindowsNotification(
          'New Task Assigned',
          payload?.title ? `Task: ${payload.title}` : 'A new task was assigned to you'
        );
      }
    });
    const unsub3 = onSocketEvent('log:status', (payload: any) => {
      refresh();
      if (isDevWorkHours()) {
        playAlertSound('pop');
        const statusText = payload?.status === 'approved' ? 'Log Approved ✓' : 'Log Status Update';
        showWindowsNotification('DevTrack Work Log', statusText);
      }
    });
    const unsub4 = onSocketEvent('log:submitted', () => {
      refresh();
    });
    const unsub5 = onSocketEvent('task:new', () => {
      refresh();
    });
    const unsub6 = onSocketEvent('task:update', () => {
      refresh();
    });
    const unsub7 = onSocketEvent('log:review', () => {
      refresh();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
    };
  }, [user, refresh]);

  // keep sidebar badges fresh when alerts/tasks change server-side
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const poll = setInterval(() => {
      if (!cancelled) refresh();
    }, 60000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [user, refresh]);

  const login = useCallback(
    async (email: string, password: string, remember: boolean = true) => {
      const res = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password, remember }
      });
      setToken(res.token, remember);
      setUser(res.user);
      connectSocket();
      await refresh();
      return res.user;
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors
    } finally {
      setToken(null);
      disconnectSocket();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, badges, settings, loading, login, logout, refresh }),
    [user, badges, settings, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
