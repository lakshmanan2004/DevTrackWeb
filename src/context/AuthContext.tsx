import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api/client';
import { connectSocket, disconnectSocket } from '../api/socket';

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
  login: (email: string, password: string) => Promise<AuthUser>;
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
      if (err.status === 401) {
        setToken(null);
        setUser(null);
        disconnectSocket();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().then(() => {
      if (getToken()) connectSocket();
    });
  }, [refresh]);

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
    async (email: string, password: string) => {
      const res = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      setToken(res.token);
      setUser(res.user);
      connectSocket();
      await refresh();
      return res.user;
    },
    [refresh]
  );

  const logout = useCallback(() => {
    setToken(null);
    disconnectSocket();
    setUser(null);
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
