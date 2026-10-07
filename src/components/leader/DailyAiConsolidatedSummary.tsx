import React, { useState } from 'react';
import {
  SparklesIcon,
  CalendarIcon,
  CopyIcon,
  RefreshCwIcon,
  LayersIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  HourglassIcon,
  ChevronRightIcon,
  CpuIcon,
  FileTextIcon
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { useDailyAiSummary } from '../../hooks/useLive';

interface Props {
  developerId?: string;
  developerName?: string;
}

export function DailyAiConsolidatedSummary({ developerId, developerName }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, loading, refetch } = useDailyAiSummary(selectedDate, developerId);
  const summary = data?.summary;

  const handleCopyReport = () => {
    if (!summary) return;
    const modulesText = (summary.mainModulesAndFocusAreas || [])
      .map((m: any) => `• *${m.module}* (${m.status.toUpperCase()}): ${m.focus}\n  - Tasks: ${m.completedTasksCount}/${m.totalTasksCount} | Active: ${m.activeHours}`)
      .join('\n');

    const pendingText = (summary.inProgressAndPendingWorks || [])
      .map((p: any) => `• *${p.task}* [${p.developerName || 'Dev'}] — Status: ${p.status.toUpperCase()}${p.blocker ? `\n  - Blocker: ${p.blocker}` : ''}`)
      .join('\n');

    const fullReport = `*🤖 DevTrack Daily AI Consolidated Summary — ${summary.dateLabel || selectedDate}*
${developerName ? `_Scope: ${developerName}_\n` : '_Scope: Entire Team_\n'}
*Executive Summary:*
${summary.executiveSummary || 'No summary available.'}

*📊 Main Modules & Focus Areas:*
${modulesText || 'No module logs recorded.'}

*⏳ InProgress & Pending Works:*
${pendingText || 'No pending tasks or blockers reported.'}
`;

    navigator.clipboard.writeText(fullReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickDate = (type: 'today' | 'yesterday') => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="space-y-6">
      {/* MAIN CONSOLIDATED AI CARD */}
      <section className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-glass space-y-5">
        <div className="ambient-orb -top-20 -right-20 w-64 h-64 bg-purple-500/10 pointer-events-none" />

        {/* HEADER WITH CALENDAR DATE PICKER */}
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-glass shrink-0">
              <SparklesIcon className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold tracking-tight text-navy">
                  Daily AI Consolidated Summary
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-500/20 shadow-2xs">
                  <CpuIcon className="h-3 w-3 text-purple-600" />
                  {summary?.model === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'NLP Engine'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {developerName ? `Consolidated report for ${developerName}` : 'Automated team standup & work synthesis'}
              </p>
            </div>
          </div>

          {/* DATE SELECTOR & ACTIONS TOOLBAR */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Today / Yesterday Toggle */}
            <div className="inline-flex items-center rounded-full border border-slate-200/60 bg-white/70 backdrop-blur-md p-1 shadow-glass shrink-0">
              <button
                type="button"
                onClick={() => handleQuickDate('today')}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isToday
                    ? 'bg-purple-600 text-white shadow-glass'
                    : 'text-slate-600 hover:text-navy'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('yesterday')}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  !isToday
                    ? 'bg-purple-600 text-white shadow-glass'
                    : 'text-slate-600 hover:text-navy'
                }`}
              >
                Yesterday
              </button>
            </div>

            {/* Calendar Native Date Picker */}
            <div className="relative inline-flex items-center shrink-0">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="glass-input h-9 pl-8 pr-3.5 text-xs font-bold text-navy shadow-glass cursor-pointer rounded-full"
              />
              <CalendarIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-purple-600" />
            </div>

            {/* Action Buttons Group */}
            <div className="inline-flex items-center gap-2.5 shrink-0">
              {/* Regenerate Button */}
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  await refetch();
                  setTimeout(() => setIsRefreshing(false), 600);
                }}
                className="btn-glass-secondary inline-flex items-center gap-2 h-9 px-4 text-xs font-bold whitespace-nowrap shadow-glass cursor-pointer rounded-full shrink-0"
                title="Refresh AI analysis"
              >
                <RefreshCwIcon className={`h-3.5 w-3.5 shrink-0 ${isRefreshing || loading ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
                <span>Refresh</span>
              </button>

              {/* Copy Report */}
              <button
                type="button"
                onClick={handleCopyReport}
                disabled={!summary || summary.totalLogs === 0}
                className="btn-glass-primary inline-flex items-center gap-2 h-9 px-5 text-xs font-bold whitespace-nowrap shadow-glass disabled:opacity-50 cursor-pointer rounded-full shrink-0"
              >
                <CopyIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{copied ? 'Copied ✓' : 'Copy Summary'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* EXECUTIVE DAILY SYNOPSIS */}
        <div className="rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md p-5 shadow-glass space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-950">
              <FileTextIcon className="h-4 w-4 text-purple-600" />
              Executive Daily Summary ({summary?.dateLabel || selectedDate})
            </span>
            {summary && summary.totalLogs > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Completion:</span>
                <Badge tone={summary.completionRate >= 75 ? 'green' : 'amber'}>
                  {summary.completionRate}%
                </Badge>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-navy font-normal">
            {loading ? (
              <span className="flex items-center gap-2 text-slate-400 italic">
                <RefreshCwIcon className="h-3.5 w-3.5 animate-spin text-purple-600" />
                Synthesizing logs, module deliverables, and commit timelines with Gemini NLP...
              </span>
            ) : summary?.executiveSummary ? (
              summary.executiveSummary
            ) : (
              'No logs submitted on this date. Select another date using the calendar above.'
            )}
          </p>

          {summary && summary.totalLogs > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/60 text-[11px]">
              <div className="rounded-xl bg-slate-100/70 p-2.5 border border-slate-200/40">
                <span className="text-slate-500 block font-medium">Total Logs</span>
                <strong className="text-navy font-mono font-bold text-sm">{summary.totalLogs}</strong>
              </div>
              <div className="rounded-xl bg-slate-100/70 p-2.5 border border-slate-200/40">
                <span className="text-slate-500 block font-medium">Active Devs</span>
                <strong className="text-navy font-mono font-bold text-sm">{summary.totalDevs}</strong>
              </div>
              <div className="rounded-xl bg-slate-100/70 p-2.5 border border-slate-200/40">
                <span className="text-slate-500 block font-medium">Code Commits</span>
                <strong className="text-navy font-mono font-bold text-sm">{summary.totalCommits || 0}</strong>
              </div>
              <div className="rounded-xl bg-slate-100/70 p-2.5 border border-slate-200/40">
                <span className="text-slate-500 block font-medium">Active Modules</span>
                <strong className="text-brand font-mono font-bold text-sm">{summary.mainModulesAndFocusAreas?.length || 0}</strong>
              </div>
            </div>
          )}
        </div>

        {/* 2 SUB-CARDS GRID */}
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 pt-1">
          {/* SUB-CARD 1: MAIN MODULES AND FOCUS AREA */}
          <div className="flex flex-col rounded-2xl border border-indigo-200/60 bg-indigo-50/40 backdrop-blur-md p-5 shadow-glass space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 shrink-0">
                  <LayersIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 truncate">
                    Main Modules &amp; Focus Area
                  </h4>
                  <p className="text-[11px] font-medium text-indigo-800/80 truncate">Key feature deliverables &amp; milestones</p>
                </div>
              </div>
              <span className="shrink-0 whitespace-nowrap inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-bold text-indigo-900 leading-none shadow-2xs">
                {summary?.mainModulesAndFocusAreas?.length || 0} Modules
              </span>
            </div>

            <div className="space-y-2.5 flex-1 max-h-80 overflow-y-auto pr-1">
              {summary?.mainModulesAndFocusAreas && summary.mainModulesAndFocusAreas.length > 0 ? (
                summary.mainModulesAndFocusAreas.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md p-3.5 shadow-glass space-y-2 hover:bg-white/90 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-navy">{m.module}</h5>
                        <p className="mt-0.5 text-[11px] text-slate-600 leading-snug font-normal">
                          {m.focus}
                        </p>
                      </div>
                      <Badge
                        tone={
                          m.status === 'completed'
                            ? 'green'
                            : m.status === 'blocked'
                            ? 'red'
                            : 'blue'
                        }
                        className="capitalize shrink-0"
                      >
                        {m.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                      <span>Tasks: <strong>{m.completedTasksCount}/{m.totalTasksCount}</strong> Done</span>
                      <span>Time: <strong>{m.activeHours || '—'}</strong></span>
                    </div>

                    {m.highlights && m.highlights.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {m.highlights.map((h: string, hIdx: number) => (
                          <div key={hIdx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                            <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="truncate">{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-medium text-slate-400 italic bg-white/40 rounded-2xl border border-dashed border-slate-200">
                  No module work recorded for this date.
                </div>
              )}
            </div>
          </div>

          {/* SUB-CARD 2: INPROGRESS OR PENDING WORKS */}
          <div className="flex flex-col rounded-2xl border border-amber-200/60 bg-amber-50/40 backdrop-blur-md p-5 shadow-glass space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-amber-100/80 pb-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 shrink-0">
                  <HourglassIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 truncate">
                    InProgress &amp; Pending Works
                  </h4>
                  <p className="text-[11px] font-medium text-amber-800/80 truncate">Active tasks, review items &amp; blockers</p>
                </div>
              </div>
              <span className="shrink-0 whitespace-nowrap inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-900 leading-none shadow-2xs">
                {summary?.inProgressAndPendingWorks?.length || 0} Pending
              </span>
            </div>

            <div className="space-y-2.5 flex-1 max-h-80 overflow-y-auto pr-1">
              {summary?.inProgressAndPendingWorks && summary.inProgressAndPendingWorks.length > 0 ? (
                summary.inProgressAndPendingWorks.map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    className={`rounded-2xl border p-3.5 shadow-glass space-y-2 ${
                      p.status === 'blocked' || p.blocker
                        ? 'border-rose-300/80 bg-rose-50/60'
                        : p.status === 'pending_review'
                        ? 'border-amber-300/80 bg-amber-50/60'
                        : 'border-white/80 bg-white/70 backdrop-blur-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-[10px] font-bold text-navy">
                          {p.developerInitials || (p.developerName ? p.developerName.slice(0, 2).toUpperCase() : 'DV')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-navy truncate">{p.task}</h5>
                          <span className="text-[10px] text-slate-500 font-medium">{p.developerName || 'Developer'}</span>
                        </div>
                      </div>

                      <Badge
                        tone={
                          p.status === 'blocked' || p.blocker
                            ? 'red'
                            : p.status === 'pending_review'
                            ? 'amber'
                            : 'blue'
                        }
                        className="capitalize shrink-0"
                      >
                        {p.status === 'pending_review' ? 'Pending Review' : p.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Blocker Alert Box */}
                    {p.blocker && (
                      <div className="rounded-xl border border-rose-200/80 bg-rose-50/90 p-2.5 text-[11px] text-rose-950 font-semibold flex items-start gap-1.5 shadow-2xs">
                        <AlertTriangleIcon className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span><strong>Blocker:</strong> {p.blocker}</span>
                      </div>
                    )}

                    {p.nextAction && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 pt-0.5">
                        <ChevronRightIcon className="h-3 w-3 text-brand shrink-0" />
                        <span>Next: {p.nextAction}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-medium text-slate-400 italic bg-white/40 rounded-2xl border border-dashed border-slate-200">
                  🎉 No active blockers or pending tasks reported for this date!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
