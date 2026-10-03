import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { onSocketEvent } from '../api/socket';

// Live data hook: fetches on mount and refetches whenever any of the given
// socket events fire (or every `pollMs` as a safety net).
export function useLive<T = any>(
  path: string | null,
  events: string[] = [],
  pollMs = 45000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;

  const refetch = useCallback(async () => {
    const p = pathRef.current;
    if (!p) return;
    try {
      const res = await api<T>(p);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refetch();
  }, [path, refetch]);

  useEffect(() => {
    if (!path) return;
    const offs = events.map((e) => onSocketEvent(e, () => refetch()));
    let poll: number | undefined;
    if (pollMs > 0) poll = window.setInterval(() => refetch(), pollMs);
    return () => {
      offs.forEach((off) => off());
      if (poll) window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, refetch, events.join(','), pollMs]);

  return { data, loading, error, refetch };
}

// ---- typed helpers -------------------------------------------------------

export interface DeveloperStat {
  id: string;
  name: string;
  initials: string;
  email: string;
  activeMinutes: number;
  logs: number;
  done: number;
  missed: number;
  commits: number;
  lastSeen: string;
  online: boolean;
  team: string;
  project: string;
  topPerformer?: boolean;
  note: string;
}

export const useDevelopers = () =>
  useLive<{ developers: DeveloperStat[]; currentSlot: number; date: string }>(
    '/api/developers',
    ['log:new', 'log:review', 'commit:new', 'eod:new', 'presence:update', 'alert:new', 'setting:update'],
    30000
  );

export const useDeveloperDetail = (id: string | null) =>
  useLive<any>(id ? `/api/developers/${id}` : null, ['log:new', 'log:review', 'commit:new', 'presence:update', 'eod:new', 'setting:update'], 20000);

export const useAlerts = () => useLive<{ alerts: any[] }>('/api/alerts', ['alert:new', 'alert:update', 'log:review'], 20000);

export const useTasks = () => useLive<{ tasks: any[] }>('/api/tasks', ['task:new', 'task:update'], 30000);

export const useMyLogs = (date?: string) =>
  useLive<{ logs: any[]; stats?: any }>(`/api/logs${date ? `?date=${date}` : ''}`, ['log:new', 'log:review', 'setting:update'], 20000);

export const useCalendar = (month: string, developerId?: string) =>
  useLive<{ days: any[] }>(`/api/logs/calendar?month=${month}${developerId ? `&developerId=${developerId}` : ''}`, ['log:new', 'log:review', 'eod:new', 'setting:update'], 60000);

export const usePendingWorks = () =>
  useLive<{ items: any[] }>('/api/logs/pending-works', ['log:review', 'task:new', 'task:update'], 30000);

export const useCommits = (date?: string) =>
  useLive<any>(`/api/commits${date ? `?date=${date}` : ''}`, ['commit:new', 'log:new'], 30000);

export const useEod = () => useLive<any>('/api/eod', ['eod:new', 'log:new'], 30000);

export const useProjects = (scope: 'mine' | 'all' = 'mine') =>
  useLive<{ projects: any[] }>(`/api/projects?scope=${scope}`, ['project:new', 'team:update', 'log:new', 'log:review'], 30000);

export const useProjectOverview = (id: string | null) =>
  useLive<any>(id ? `/api/projects/${id}/overview` : null, ['project:new', 'team:update', 'log:new'], 30000);

export const useTeams = () => useLive<{ teams: any[] }>('/api/teams', ['team:update', 'project:new'], 30000);

export const useUsers = () => useLive<{ users: any[] }>('/api/users', ['user:new', 'user:update'], 30000);

export const useWeeklyReport = (developerId: string, week = 0) =>
  useLive<any>(`/api/reports/weekly?developerId=${developerId}&week=${week}`, ['log:new', 'log:review', 'eod:new'], 60000);

export const usePerformance = () => useLive<any>('/api/reports/performance', ['log:new', 'log:review', 'task:update', 'eod:new'], 60000);

export const useTeamCalendar = (month: string) =>
  useLive<any>(`/api/logs/team-calendar?month=${month}`, ['log:new', 'log:review', 'task:new', 'task:update', 'presence:update', 'setting:update'], 30000);

export const usePublicStats = () => useLive<any>('/api/auth/stats/public', ['log:new'], 60000);

