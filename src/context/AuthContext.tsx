import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, getToken, onUnauthorized, setToken } from '../api/client';
import { connectSocket, disconnectSocket, onSocketEvent } from '../api/socket';
import { playAlertSound, showWindowsNotification } from '../utils/audioAlerts';
import { getClientHolidayInfo } from '../utils/workBlocks';

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

export interface OrgBrandingSettings {
  companyName?: string;
  logoUrl?: string;
  brandTagline?: string;
  supportEmail?: string;
  workStartHour?: number;
  workEndHour?: number;
  minWords?: number;
  eodDeadline?: string;
  workDays?: number[];
  holidays?: any[];
}

interface MeResponse {
  user: AuthUser;
  badges: Badges;
  serverDate: string;
  currentSlot: number;
  isWorkday?: boolean;
  isHoliday?: boolean;
  holiday?: any;
  settings: OrgBrandingSettings;
}

interface AuthContextValue {
  user: AuthUser | null;
  badges: Badges;
  settings: MeResponse['settings'] | null;
  isHoliday?: boolean;
  isWorkday?: boolean;
  holiday?: any;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  badges: { alerts: 0, approvals: 0, pendingWorks: 0 },
  settings: null,
  isHoliday: false,
  isWorkday: true,
  holiday: null,
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
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [isWorkday, setIsWorkday] = useState<boolean>(true);
  const [holiday, setHoliday] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isRefreshingRef = useRef(false);
  const refreshTimeoutRef = useRef<any>(null);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      api<OrgBrandingSettings>('/api/settings/public').then((pub) => {
        setSettings((prev) => ({ ...(prev || {}), ...pub }));
      }).catch(() => {});
      setLoading(false);
      return;
    }
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      const me = await api<MeResponse>('/api/auth/me');
      if (me.isHoliday !== undefined) setIsHoliday(!!me.isHoliday);
      if (me.isWorkday !== undefined) setIsWorkday(!!me.isWorkday);
      if (me.holiday !== undefined) setHoliday(me.holiday);
      
      setUser((prev) => {
        if (!prev && !me.user) return null;
        if (
          prev &&
          me.user &&
          prev.id === me.user.id &&
          prev.name === me.user.name &&
          prev.email === me.user.email &&
          prev.role === me.user.role &&
          prev.lunchSlot === me.user.lunchSlot &&
          prev.teamName === me.user.teamName &&
          prev.projectName === me.user.projectName &&
          prev.leaderName === me.user.leaderName &&
          prev.jobTitle === me.user.jobTitle &&
          prev.github === me.user.github
        ) {
          return prev;
        }
        return me.user;
      });

      setBadges((prev) => {
        if (
          prev.alerts === me.badges.alerts &&
          prev.approvals === me.badges.approvals &&
          prev.pendingWorks === me.badges.pendingWorks
        ) {
          return prev;
        }
        return me.badges;
      });

      setSettings((prev) => {
        if (!prev && !me.settings) return null;
        if (
          prev &&
          me.settings &&
          prev.workStartHour === me.settings.workStartHour &&
          prev.workEndHour === me.settings.workEndHour &&
          prev.minWords === me.settings.minWords &&
          prev.eodDeadline === me.settings.eodDeadline
        ) {
          return prev;
        }
        return me.settings;
      });
    } catch (err: any) {
      if (err.status === 401 || err.message?.includes('401')) {
        setToken(null);
        setUser(null);
      api<OrgBrandingSettings>('/api/settings/public').then((pub) => {
        setSettings((prev) => ({ ...(prev || {}), ...pub }));
      }).catch(() => {});
        disconnectSocket();
      }
    } finally {
      isRefreshingRef.current = false;
      setLoading(false);
    }
  }, []);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => {
      refresh();
    }, 150);
  }, [refresh]);

  useEffect(() => {
    const unsub = onUnauthorized(() => {
      setToken(null);
      setUser(null);
      api<OrgBrandingSettings>('/api/settings/public').then((pub) => {
        setSettings((prev) => ({ ...(prev || {}), ...pub }));
      }).catch(() => {});
      disconnectSocket();
    });
    return () => {
      unsub();
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
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
      const now = new Date();
      const holidayInfo = getClientHolidayInfo(
        now,
        (settings as any)?.holidays || [],
        (settings as any)?.workDays || [1, 2, 3, 4, 5]
      );
      if (holidayInfo.isHoliday || isHoliday) return false;
      const h = now.getHours();
      return h >= 8 && h < 17; // Strictly 8:00 AM to 5:00 PM
    };

    const unsub1 = onSocketEvent('alert:new', (payload: any) => {
      debouncedRefresh();
      if (isDevWorkHours()) {
        const title = payload?.title || 'DevTrack Alert';
        const body = payload?.body || (payload?.category ? `${payload.category}${payload.who ? ` (${payload.who})` : ''}` : 'New alert received');
        showWindowsNotification(title, body);
      }
    });
    const unsub2 = onSocketEvent('task:assigned', (payload: any) => {
      debouncedRefresh();
      if (isDevWorkHours()) {
        playAlertSound('notification');
        showWindowsNotification(
          'New Task Assigned',
          payload?.title ? `Task: ${payload.title}` : 'A new task was assigned to you'
        );
      }
    });
    const unsub3 = onSocketEvent('log:status', (payload: any) => {
      debouncedRefresh();
      if (isDevWorkHours()) {
        playAlertSound('pop');
        const statusText = payload?.status === 'approved' ? 'Log Approved ✓' : 'Log Status Update';
        showWindowsNotification('DevTrack Work Log', statusText);
      }
    });
    const unsub4 = onSocketEvent('log:submitted', () => {
      debouncedRefresh();
    });
    const unsub5 = onSocketEvent('task:new', () => {
      debouncedRefresh();
    });
    const unsub6 = onSocketEvent('task:update', () => {
      debouncedRefresh();
    });
    const unsub7 = onSocketEvent('log:review', () => {
      debouncedRefresh();
    });
    const unsub9 = onSocketEvent('setting:update', (payload: any) => {
      debouncedRefresh();
      if (payload) {
        setSettings((prev) => ({
          ...(prev || {}),
          ...(payload.companyName !== undefined ? { companyName: payload.companyName } : {}),
          ...(payload.logoUrl !== undefined ? { logoUrl: payload.logoUrl } : {}),
          ...(payload.brandTagline !== undefined ? { brandTagline: payload.brandTagline } : {}),
          ...(payload.supportEmail !== undefined ? { supportEmail: payload.supportEmail } : {})
        }));
      }
    });
    const unsub8 = onSocketEvent('alert:update', () => {
      debouncedRefresh();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
      unsub8();
      unsub9();
    };
  }, [user, debouncedRefresh]);

  // keep sidebar badges fresh when alerts/tasks change server-side
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const poll = setInterval(() => {
      if (!cancelled) debouncedRefresh();
    }, 60000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [user, debouncedRefresh]);

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
      api<OrgBrandingSettings>('/api/settings/public').then((pub) => {
        setSettings((prev) => ({ ...(prev || {}), ...pub }));
      }).catch(() => {});
    }
  }, []);

  const value = useMemo(
    () => ({ user, badges, settings, isHoliday, isWorkday, holiday, loading, login, logout, refresh }),
    [user, badges, settings, isHoliday, isWorkday, holiday, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
