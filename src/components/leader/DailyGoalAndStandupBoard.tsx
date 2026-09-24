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
      <section className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <TargetIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">Daily Sprint Goals &amp; Sub-Task Progress</h3>
              <p className="text-xs text-gray-500">
                {completedCount} of {subTasks.length} tasks completed today
              </p>
            </div>
          </div>

          <Badge tone="purple" className="font-bold">
            {overallProgress}% Complete
          </Badge>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-500">Milestone Progress</span>
            <span className="text-brand font-bold">{overallProgress}%</span>
          </div>
          <ProgressBar value={overallProgress} tone={overallProgress >= 75 ? 'green' : 'purple'} label="Sprint progress" />
        </div>

        <div className="mt-5 space-y-3">
          {subTasks.map((st) => (
            <div
              key={st.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 ${
                st.status === 'done'
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : st.status === 'blocked'
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-hairline bg-canvas'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    st.status === 'done' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white'
                  }`}
                >
                  {st.status === 'done' && <CheckCircle2Icon className="h-3 w-3" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${st.status === 'done' ? 'line-through text-gray-400' : 'text-navy'}`}>
                    {st.task}
                  </p>
                  <span className="text-[11px] text-gray-400">Scheduled: {st.hourLabel}</span>
                </div>
              </div>
              <TaskStatusBadge status={st.status} />
            </div>
          ))}
          {subTasks.length === 0 && (
            <p className="py-4 text-center text-xs text-gray-500">No logs submitted today yet.</p>
          )}
        </div>
      </section>

      {/* AUTO STANDUP SUMMARY */}
      <section className="rounded-2xl border border-purple-200/80 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                Automated Daily Standup Summary
                <span className="rounded-full bg-purple-200/80 px-2 py-0.5 text-[10px] font-extrabold text-purple-900">
                  Auto Generated
                </span>
              </h3>
              <p className="text-xs text-purple-800">
                Synthesized from the developer's work logs & commits
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hairline bg-white px-3 text-xs font-semibold text-navy hover:bg-gray-50"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleCopyStandup}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-purple-600 px-3 text-xs font-semibold text-white hover:bg-purple-700"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy Standup'}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
              <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
              1. What I accomplished today
            </h4>
            <ul className="mt-2.5 space-y-1.5 text-xs text-emerald-950 leading-relaxed list-disc list-inside">
              {accomplished.length
                ? accomplished.map((t) => <li key={t}>{t}</li>)
                : <li>No completed tasks logged yet.</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
              <TargetIcon className="h-4 w-4 text-brand" />
              2. What I am working on next
            </h4>
            <ul className="mt-2.5 space-y-1.5 text-xs text-blue-950 leading-relaxed list-disc list-inside">
              {next.length
                ? next.map((t) => <li key={t}>{t}</li>)
                : <li>Nothing in progress.</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-900">
              <OctagonAlertIcon className="h-4 w-4 text-red-600" />
              3. Current Blockers &amp; Dependencies
            </h4>
            <p className="mt-2 text-xs text-red-950 font-medium leading-relaxed">
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
