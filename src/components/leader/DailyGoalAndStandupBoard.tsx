import React, { useState } from 'react';
import {
  CheckCircle2Icon,
  SparklesIcon,
  CopyIcon,
  RefreshCwIcon,
  TargetIcon,
  OctagonAlertIcon
} from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { TaskStatusBadge } from '../ui/TaskStatusBadge';

interface SubTaskGoal {
  id: string;
  task: string;
  status: 'done' | 'progress' | 'blocked';
  hourLabel: string;
}

interface Props {
  devName: string;
  dateLabel: string;
  logs: any[];
}

// Auto-generated standup summary from the developer's real logs.
export function DailyGoalAndStandupBoard({ devName, dateLabel, logs }: Props) {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const subTasks: SubTaskGoal[] = logs.map((log) => ({
    id: log.id,
    task: log.task,
    status: log.status === 'todo' ? 'progress' : log.status,
    hourLabel: log.hourLabel
  }));

  const completedCount = subTasks.filter((t) => t.status === 'done').length;
  const overallProgress = subTasks.length ? Math.round((completedCount / subTasks.length) * 100) : 0;

  const accomplished = logs.filter((l) => l.status === 'done').map((l) => l.task);
  const next = logs.filter((l) => l.status === 'progress').map((l) => l.task);
  const blockers = logs.filter((l) => l.status === 'blocked');

  const standupText = `*DevTrack Standup Summary — ${devName} (${dateLabel})*

*What I accomplished today:*
${accomplished.length ? accomplished.map((t) => `- ${t}`).join('\n') : '- No completed tasks logged yet.'}

*What I am working on next:*
${next.length ? next.map((t) => `- ${t}`).join('\n') : '- Nothing in progress.'}

*Current Blockers:*
${blockers.length ? blockers.map((l) => `- ${l.task}: ${l.blocker || 'blocked'}`).join('\n') : '- None.'}`;

  const handleCopyStandup = () => {
    navigator.clipboard.writeText(standupText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* DAILY GOALS & SUB-TASK PROGRESS */}
      <section className="glass-card rounded-3xl border border-white/80 p-6 shadow-glass">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 text-brand shadow-glass">
              <TargetIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-navy tracking-tight">Daily Sprint Goals &amp; Sub-Task Progress</h3>
              <p className="text-xs text-slate-500 font-medium">
                {completedCount} of {subTasks.length} tasks completed today
              </p>
            </div>
          </div>

          <Badge tone="purple" className="font-extrabold text-xs">
            {overallProgress}% Complete
          </Badge>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Milestone Progress</span>
            <span className="text-brand font-bold">{overallProgress}%</span>
          </div>
          <ProgressBar value={overallProgress} tone={overallProgress >= 75 ? 'green' : 'purple'} label="Sprint progress" />
        </div>

        <div className="mt-5 space-y-3">
          {subTasks.map((st) => (
            <div
              key={st.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 backdrop-blur-md shadow-2xs transition-all ${
                st.status === 'done'
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : st.status === 'blocked'
                  ? 'border-rose-500/30 bg-rose-500/10'
                  : 'glass-surface border-white/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border shadow-xs ${
                    st.status === 'done'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 dark:border-white/20 bg-white/80 dark:bg-slate-800'
                  }`}
                >
                  {st.status === 'done' && <CheckCircle2Icon className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${st.status === 'done' ? 'line-through text-slate-400' : 'text-navy'}`}>
                    {st.task}
                  </p>
                  <span className="text-[11px] text-slate-400 font-medium">Scheduled: {st.hourLabel}</span>
                </div>
              </div>
              <TaskStatusBadge status={st.status} />
            </div>
          ))}
          {subTasks.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-400 font-medium">No logs submitted today yet.</p>
          )}
        </div>
      </section>

      {/* AUTO STANDUP SUMMARY */}
      <section className="glass-card rounded-3xl border border-purple-300/40 p-6 shadow-glass">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-200/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-600 shadow-glass">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                Automated Daily Standup Summary
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  Auto Generated
                </span>
              </h3>
              <p className="text-xs text-purple-800 dark:text-purple-300 font-medium">
                Synthesized from the developer's work logs &amp; commits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsRegenerating(true);
                setTimeout(() => setIsRegenerating(false), 600);
              }}
              className="btn-glass-secondary h-9 px-3 text-xs font-bold cursor-pointer"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleCopyStandup}
              className="btn-glass-primary h-9 px-3 text-xs font-bold !bg-purple-600 hover:!bg-purple-700 cursor-pointer shadow-purple-500/30"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy Standup'}
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 backdrop-blur-md shadow-2xs">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
              1. What I accomplished today
            </h4>
            <ul className="mt-2.5 space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed list-disc list-inside font-medium">
              {accomplished.length
                ? accomplished.map((t) => <li key={t}>{t}</li>)
                : <li>No completed tasks logged yet.</li>}
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 backdrop-blur-md shadow-2xs">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
              <TargetIcon className="h-4 w-4 text-blue-600" />
              2. What I am working on next
            </h4>
            <ul className="mt-2.5 space-y-1.5 text-xs text-blue-950 dark:text-blue-200 leading-relaxed list-disc list-inside font-medium">
              {next.length
                ? next.map((t) => <li key={t}>{t}</li>)
                : <li>Nothing in progress.</li>}
            </ul>
          </div>

          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 backdrop-blur-md shadow-2xs">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300">
              <OctagonAlertIcon className="h-4 w-4 text-rose-600" />
              3. Current Blockers &amp; Dependencies
            </h4>
            <p className="mt-2 text-xs text-rose-950 dark:text-rose-200 font-medium leading-relaxed">
              {blockers.length
                ? blockers.map((l) => `${l.task}: ${l.blocker || 'blocked'}`).join(' · ')
                : 'None reported.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
