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
    <div className="space-y-5">
      {/* MAIN CONSOLIDATED AI CARD */}
      <section className="rounded-2xl border-2 border-purple-200/90 bg-gradient-to-b from-purple-50/40 via-white to-white p-5 shadow-card space-y-4">
        {/* HEADER WITH CALENDAR DATE PICKER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-navy">
                  Daily AI Consolidated Summary
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black text-purple-900 border border-purple-200">
                  <CpuIcon className="h-3 w-3 text-purple-700" />
                  {summary?.model === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'NLP Engine'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {developerName ? `Consolidated report for ${developerName}` : 'Automated team standup & work synthesis'}
              </p>
            </div>
          </div>

          {/* DATE SELECTOR & ACTIONS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-purple-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleQuickDate('today')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  isToday
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('yesterday')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  !isToday
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                Yesterday
              </button>
            </div>

            {/* Calendar Native Date Picker */}
            <div className="relative flex items-center">
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 rounded-xl border border-purple-200 bg-white pl-8 pr-3 text-xs font-extrabold text-navy shadow-2xs hover:border-purple-400 focus:border-purple-600 focus:outline-hidden cursor-pointer"
                />
                <CalendarIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-purple-600" />
              </div>
            </div>

            {/* Regenerate Button */}
            <button
              type="button"
              onClick={async () => {
                setIsRefreshing(true);
                await refetch();
                setTimeout(() => setIsRefreshing(false), 600);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline bg-white px-3 text-xs font-bold text-navy shadow-2xs hover:bg-gray-50 cursor-pointer"
              title="Refresh AI analysis"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${isRefreshing || loading ? 'animate-spin text-purple-600' : 'text-gray-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Copy Report */}
            <button
              type="button"
              onClick={handleCopyReport}
              disabled={!summary || summary.totalLogs === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              <span>{copied ? 'Copied ✓' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* EXECUTIVE DAILY SYNOPSIS */}
        <div className="rounded-xl border border-purple-100 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-950">
              <FileTextIcon className="h-4 w-4 text-purple-600" />
              Executive Daily Summary ({summary?.dateLabel || selectedDate})
            </span>
            {summary && summary.totalLogs > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-gray-500">Completion:</span>
                <Badge tone={summary.completionRate >= 75 ? 'green' : 'amber'}>
                  {summary.completionRate}%
                </Badge>
              </div>
            )}
          </div>

          <p className="text-xs leading-relaxed text-navy font-medium">
            {loading ? (
              <span className="flex items-center gap-2 text-gray-400 italic">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-100 text-[11px]">
              <div className="rounded-lg bg-canvas p-2">
                <span className="text-gray-500 block">Total Logs</span>
                <strong className="text-navy font-black text-sm">{summary.totalLogs}</strong>
              </div>
              <div className="rounded-lg bg-canvas p-2">
                <span className="text-gray-500 block">Active Devs</span>
                <strong className="text-navy font-black text-sm">{summary.totalDevs}</strong>
              </div>
              <div className="rounded-lg bg-canvas p-2">
                <span className="text-gray-500 block">Code Commits</span>
                <strong className="text-navy font-black text-sm">{summary.totalCommits || 0}</strong>
              </div>
              <div className="rounded-lg bg-canvas p-2">
                <span className="text-gray-500 block">Active Modules</span>
                <strong className="text-brand font-black text-sm">{summary.mainModulesAndFocusAreas?.length || 0}</strong>
              </div>
            </div>
          )}
        </div>

        {/* 2 SUB-CARDS GRID */}
        <div className="grid gap-4 md:grid-cols-2 pt-1">
          {/* SUB-CARD 1: MAIN MODULES AND FOCUS AREA */}
          <div className="flex flex-col rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <LayersIcon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                    Main Modules &amp; Focus Area
                  </h4>
                  <p className="text-[11px] text-indigo-800">Key feature deliverables &amp; milestones</p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-900">
                {summary?.mainModulesAndFocusAreas?.length || 0} Modules
              </span>
            </div>

            <div className="space-y-2.5 flex-1 max-h-80 overflow-y-auto pr-1">
              {summary?.mainModulesAndFocusAreas && summary.mainModulesAndFocusAreas.length > 0 ? (
                summary.mainModulesAndFocusAreas.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-hairline bg-white p-3 shadow-2xs space-y-2 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-black text-navy">{m.module}</h5>
                        <p className="mt-0.5 text-[11px] text-gray-600 leading-snug font-medium">
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

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-500">
                      <span>Tasks: <strong>{m.completedTasksCount}/{m.totalTasksCount}</strong> Done</span>
                      <span>Time: <strong>{m.activeHours || '—'}</strong></span>
                    </div>

                    {m.highlights && m.highlights.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {m.highlights.map((h: string, hIdx: number) => (
                          <div key={hIdx} className="flex items-start gap-1.5 text-[11px] text-gray-700">
                            <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="truncate">{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400 italic bg-canvas/60 rounded-xl border border-dashed border-gray-200">
                  No module work recorded for this date.
                </div>
              )}
            </div>
          </div>

          {/* SUB-CARD 2: INPROGRESS OR PENDING WORKS */}
          <div className="flex flex-col rounded-xl border border-amber-100 bg-gradient-to-b from-amber-50/50 to-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-amber-100/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <HourglassIcon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                    InProgress &amp; Pending Works
                  </h4>
                  <p className="text-[11px] text-amber-800">Active tasks, review items &amp; blockers</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900">
                {summary?.inProgressAndPendingWorks?.length || 0} Pending
              </span>
            </div>

            <div className="space-y-2.5 flex-1 max-h-80 overflow-y-auto pr-1">
              {summary?.inProgressAndPendingWorks && summary.inProgressAndPendingWorks.length > 0 ? (
                summary.inProgressAndPendingWorks.map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    className={`rounded-xl border p-3 shadow-2xs space-y-2 ${
                      p.status === 'blocked' || p.blocker
                        ? 'border-red-200 bg-red-50/40'
                        : p.status === 'pending_review'
                        ? 'border-amber-200 bg-amber-50/40'
                        : 'border-hairline bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-[10px] font-black text-navy">
                          {p.developerInitials || (p.developerName ? p.developerName.slice(0, 2).toUpperCase() : 'DV')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-navy truncate">{p.task}</h5>
                          <span className="text-[10px] text-gray-500">{p.developerName || 'Developer'}</span>
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
                      <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-950 font-semibold flex items-start gap-1.5">
                        <AlertTriangleIcon className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                        <span><strong>Blocker:</strong> {p.blocker}</span>
                      </div>
                    )}

                    {p.nextAction && (
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-600 pt-0.5">
                        <ChevronRightIcon className="h-3 w-3 text-brand shrink-0" />
                        <span>Next: {p.nextAction}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400 italic bg-canvas/60 rounded-xl border border-dashed border-gray-200">
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
