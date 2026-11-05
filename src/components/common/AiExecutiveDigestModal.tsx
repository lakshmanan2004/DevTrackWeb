import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  PrinterIcon,
  RefreshCwIcon,
  FolderKanbanIcon,
  CalendarIcon,
  ZapIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ClockIcon,
  GitBranchIcon,
  Loader2Icon,
  BotIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { api } from '../../api/client';
import { useProjects } from '../../hooks/useLive';

interface DigestBullets {
  shipped: string;
  velocity: string;
  blockers: string;
}

interface ExecutiveDigestData {
  date: string;
  dateLabel: string;
  headline: string;
  bullets: DigestBullets;
  highlights?: string[];
  slackMarkdown: string;
  stats: {
    totalHours: number;
    totalLogs: number;
    totalCommits: number;
    activeDevsCount: number;
    blockersCount: number;
    completionRate: number;
  };
  aiPowered: boolean;
  model: string;
  generatedAt: string;
}

interface AiExecutiveDigestModalProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultDate?: string;
}

export function AiExecutiveDigestModal({
  open,
  onClose,
  defaultProjectId = '',
  defaultDate = ''
}: AiExecutiveDigestModalProps) {
  const { data: projData } = useProjects('mine');
  const projects = projData?.projects || [];

  const [projectId, setProjectId] = useState(defaultProjectId);
  const [date, setDate] = useState(() => defaultDate || new Date().toISOString().slice(0, 10));
  const [digest, setDigest] = useState<ExecutiveDigestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync defaults when modal opens
  useEffect(() => {
    if (open) {
      if (defaultProjectId) setProjectId(defaultProjectId);
      if (defaultDate) setDate(defaultDate);
    }
  }, [open, defaultProjectId, defaultDate]);

  const fetchDigest = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (projectId) params.set('projectId', projectId);

      const res = await api<{ digest: ExecutiveDigestData }>(`/api/ai/executive-digest?${params.toString()}`);
      if (res?.digest) {
        setDigest(res.digest);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI executive digest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDigest();
    }
  }, [open, projectId, date]);

  if (!open) return null;

  const handleCopy = () => {
    if (!digest) return;
    navigator.clipboard.writeText(digest.slackMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (!digest) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Executive Briefing — ${digest.dateLabel}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; line-height: 1.5; font-size: 12px; }
    h1 { font-size: 18px; color: #1e293b; margin-bottom: 4px; }
    .subtitle { color: #2563eb; font-weight: 600; margin-bottom: 16px; font-size: 11px; text-transform: uppercase; }
    .headline { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; font-size: 13px; font-weight: 600; margin-bottom: 20px; border-radius: 4px; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 14px; }
    .card-title { font-weight: 800; font-size: 12px; margin-bottom: 6px; }
    .kpi { display: flex; gap: 16px; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #64748b; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>🚀 DevTrack Executive Briefing</h1>
  <div class="subtitle">${digest.dateLabel} · AI Standup Digest</div>
  <div class="headline">${digest.headline}</div>

  <div class="card">
    <div class="card-title" style="color: #16a34a;">1. 🚀 Shipped Deliverables &amp; Technical Milestones</div>
    <div>${digest.bullets.shipped}</div>
  </div>

  <div class="card">
    <div class="card-title" style="color: #2563eb;">2. ⚡ Team Velocity &amp; Active Focus</div>
    <div>${digest.bullets.velocity}</div>
  </div>

  <div class="card">
    <div class="card-title" style="color: #ea580c;">3. 🛑 Impediments &amp; Directives</div>
    <div>${digest.bullets.blockers}</div>
  </div>

  <div class="kpi">
    <div><strong>Total Hours:</strong> ${digest.stats.totalHours} hrs</div>
    <div><strong>Tasks Completed:</strong> ${digest.stats.completionRate}%</div>
    <div><strong>Commits:</strong> ${digest.stats.totalCommits}</div>
    <div><strong>Blockers:</strong> ${digest.stats.blockersCount}</div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl border border-white/80 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200/60 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <SparklesIcon className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-navy dark:text-white">
                  AI Executive Team Digest
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <BotIcon className="h-3 w-3" />
                  {digest?.model || 'Gemini Flash'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-Click C-level 3-bullet team briefing synthesized from daily work blocks and commits.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] p-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="w-44">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input h-9 w-full px-3 text-xs font-semibold text-navy dark:text-white"
              />
            </div>

            <div className="w-56">
              <Select
                size="sm"
                fullWidth
                value={projectId}
                onChange={(val) => setProjectId(val)}
                options={[
                  { value: '', label: 'All Projects Combined' },
                  ...projects.map((p: any) => ({ value: p.id, label: p.name }))
                ]}
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDigest}
            disabled={loading}
            icon={<RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            {loading ? 'Analyzing...' : 'Regenerate'}
          </Button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 animate-pulse">
              <SparklesIcon className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold text-navy dark:text-white">Synthesizing Daily Engineering Activity...</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Gemini is reviewing active tasks, code commits, and blockers to draft your 3-bullet briefing.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-600">
            {error}
          </div>
        ) : digest ? (
          <div className="space-y-4">
            {/* Executive Headline Banner */}
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-4 shadow-glass">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-600 dark:text-sky-400 block mb-0.5">
                    Executive Briefing Headline · {digest.dateLabel}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-navy dark:text-white leading-relaxed">
                    {digest.headline}
                  </p>
                </div>
              </div>
            </div>

            {/* The 3-Bullet Team Briefing Bento Grid */}
            <div className="space-y-3">
              {/* Bullet 1: Shipped & Milestones */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4 transition-all hover:bg-emerald-500/[0.07]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2Icon className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-300">
                      1. Shipped Deliverables &amp; Technical Milestones
                    </h4>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                    Delivered
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium pl-8">
                  {digest.bullets.shipped}
                </p>
              </div>

              {/* Bullet 2: Velocity & Focus */}
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.04] p-4 transition-all hover:bg-blue-500/[0.07]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-sky-400">
                      <ZapIcon className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                      2. Team Velocity &amp; Active Focus
                    </h4>
                  </div>
                  <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 dark:text-sky-300">
                    Momentum
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium pl-8">
                  {digest.bullets.velocity}
                </p>
              </div>

              {/* Bullet 3: Impediments & Directives */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-4 transition-all hover:bg-amber-500/[0.07]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <AlertTriangleIcon className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      3. Critical Impediments &amp; Directives
                    </h4>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                    {digest.stats.blockersCount > 0 ? `${digest.stats.blockersCount} Blockers` : 'All Clear'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium pl-8">
                  {digest.bullets.blockers}
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Active Hours</span>
                <span className="text-sm font-extrabold text-navy dark:text-white">{digest.stats.totalHours} hrs</span>
              </div>
              <div className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Completion Rate</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{digest.stats.completionRate}%</span>
              </div>
              <div className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Code Commits</span>
                <span className="text-sm font-extrabold text-navy dark:text-white">{digest.stats.totalCommits}</span>
              </div>
              <div className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Blockers</span>
                <span className={`text-sm font-extrabold ${digest.stats.blockersCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {digest.stats.blockersCount}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5">
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              icon={<PrinterIcon className="h-4 w-4" />}
              disabled={!digest || loading}
              onClick={handlePrint}
            >
              Print Digest
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={copied ? <CheckIcon className="h-4 w-4 text-emerald-300" /> : <CopyIcon className="h-4 w-4" />}
              disabled={!digest || loading}
              onClick={handleCopy}
              className="!bg-gradient-to-r !from-indigo-600 !to-purple-600 hover:!from-indigo-500 hover:!to-purple-500 text-white shadow-md shadow-purple-500/20"
            >
              {copied ? 'Copied Slack Markdown!' : 'Copy Slack / Email Digest'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
