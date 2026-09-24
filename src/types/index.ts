export type Role = 'developer' | 'leader' | 'manager' | 'admin';


export type TaskStatus = 'todo' | 'progress' | 'done' | 'blocked';

export type ReviewState = 'approved' | 'pending' | 'rejected' | 'changes_requested';

export interface TargetedFeedback {
  id: string;
  highlightedText: string;
  comment: string;
  screenshotUrl?: string;
  screenshotName?: string;
  createdAt: string;
}

export interface Developer {
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
  note: string;
  team: string;
  project: string;
  topPerformer?: boolean;

}

export interface WorkLog {
  id: string;
  hourLabel: string;
  hourSlot: number;
  task: string;
  status: TaskStatus;
  description: string;
  submittedAt: string;
  activeMinutes: number;
  attachment: string;
  commits: number;
  review: ReviewState;
  reviewNote?: string;
  targetedFeedback?: TargetedFeedback[];
  blocker?: string;
  project: string;
  wordCount: number;
}

export interface Commit {
  id: string;
  message: string;
  branch: string;
  time: string;
  files: number;
  sha: string;
  url?: string;
}

export interface DevAlert {
  id: string;
  kind: 'reminder' | 'approval' | 'rejection' | 'eod';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  action?: string;
}

export interface LeaderAlert {
  id: string;
  severity: 'critical' | 'warning' | 'flag' | 'seen';
  category: 'Missed Log' | 'Batch Submit' | 'EOD Missing';
  who: string;
  title: string;
  body: string;
  meta: string;
  detection: string;
  unread: boolean;
  actions: string[];
  timeline?: {at: string;what: string;}[];
  time?: string;
  developerId?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'ongoing' | 'completed' | 'hold';
  manager: string;
  managerId?: string;
  leader: string;
  leaderId?: string;
  team: string;
  teamId?: string;
  repoUrl?: string;
  developers: number;
  developerNames?: string[];
  started: string;
  targetDate?: string;
  ended?: string;
  progress: number;
  health: 'On Track' | 'Slightly Behind' | 'Behind' | 'Delivered on time';
  tasksDone: number;
  blockers: number;
  activeDevs: number;
  inProgress: number;
}

export interface ManagedUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  active: boolean;
  joined: string;
}