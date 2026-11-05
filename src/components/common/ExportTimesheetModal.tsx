import React, { useState, useEffect } from 'react';
import {
  XIcon,
  DownloadIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  CalendarIcon,
  FolderKanbanIcon,
  UserIcon,
  CheckCircle2Icon,
  ClockIcon,
  GitBranchIcon,
  Loader2Icon,
  FilterIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { api } from '../../api/client';
import { useProjects, useDevelopers } from '../../hooks/useLive';
import {
  downloadCsvTimesheet,
  printTimesheetReport,
  TimesheetReportData
} from '../../utils/exportReports';

interface ExportTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultDeveloperId?: string;
  projectName?: string;
}

export function ExportTimesheetModal({
  open,
  onClose,
  defaultProjectId = '',
  defaultDeveloperId = '',
  projectName = ''
}: ExportTimesheetModalProps) {
  const { data: projData } = useProjects('mine');
  const { data: devData } = useDevelopers();

  const projects = projData?.projects || [];
  const developers = devData?.developers || [];

  const [projectId, setProjectId] = useState(defaultProjectId);
  const [developerId, setDeveloperId] = useState(defaultDeveloperId);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved'>('all');
  const [rangePreset, setRangePreset] = useState<'7days' | '30days' | 'all' | 'custom'>('7days');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<TimesheetReportData | null>(null);
  const [error, setError] = useState('');

  // Sync defaults when modal opens
  useEffect(() => {
    if (open) {
      if (defaultProjectId) setProjectId(defaultProjectId);
      if (defaultDeveloperId) setDeveloperId(defaultDeveloperId);
    }
  }, [open, defaultProjectId, defaultDeveloperId]);

  // Compute dates based on rangePreset
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (rangePreset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (rangePreset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (rangePreset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  }, [rangePreset]);

  // Fetch report data whenever filters change and modal is open
  useEffect(() => {
    if (!open) return;

    let active = true;
    const fetchTimesheet = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (projectId) params.set('projectId', projectId);
        if (developerId) params.set('developerId', developerId);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const res = await api<TimesheetReportData>(`/api/reports/timesheet?${params.toString()}`);
        if (active) {
          // Augment filter metadata with display names
          const projObj = projects.find((p: any) => p.id === projectId);
          const devObj = developers.find((d: any) => d.id === developerId);

          setReportData({
            ...res,
            filter: {
              ...res.filter,
              projectName: projObj?.name || projectName || (projectId ? 'Selected Project' : 'All Projects'),
              developerName: devObj?.name || (developerId ? 'Selected Developer' : undefined),
              startDate,
              endDate,
              status: statusFilter
            }
          });
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Failed to load timesheet data');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTimesheet();
    return () => {
      active = false;
    };
  }, [open, projectId, developerId, startDate, endDate, statusFilter, projects, developers, projectName]);

  if (!open) return null;

  const handleDownloadCsv = () => {
    if (!reportData) return;
    downloadCsvTimesheet(reportData);
  };

  const handlePrintPdf = () => {
    if (!reportData) return;
    printTimesheetReport(reportData);
  };

  const summary = reportData?.summary;
  const logsCount = summary?.totalLogs ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl border border-white/80 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200/60 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-sky-400">
              <FileSpreadsheetIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-navy dark:text-white">
                Export Client Timesheet &amp; Audit Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official delivery report formatted for executive sign-off, billing, and client reviews.
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

        {/* Filter Controls Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Project Filter */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-navy dark:text-white flex items-center gap-1.5">
              <FolderKanbanIcon className="h-3.5 w-3.5 text-slate-400" />
              Project Scope
            </label>
            <Select
              size="md"
              fullWidth
              value={projectId}
              onChange={(val) => setProjectId(val)}
              options={[
                { value: '', label: 'All Accessible Projects' },
                ...projects.map((p: any) => ({ value: p.id, label: p.name }))
              ]}
            />
          </div>

          {/* Developer Filter */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-navy dark:text-white flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-slate-400" />
              Developer Filter
            </label>
            <Select
              size="md"
              fullWidth
              value={developerId}
              onChange={(val) => setDeveloperId(val)}
              options={[
                { value: '', label: 'All Team Members' },
                ...developers.map((d: any) => ({ value: d.id, label: d.name }))
              ]}
              searchable
            />
          </div>

          {/* Date Range Preset */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-navy dark:text-white flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
              Timeframe
            </label>
            <Select
              size="md"
              fullWidth
              value={rangePreset}
              onChange={(val) => setRangePreset(val as any)}
              options={[
                { value: '7days', label: 'Last 7 Days (Sprint Review)' },
                { value: '30days', label: 'Last 30 Days (Monthly Invoice)' },
                { value: 'all', label: 'All Recorded Time' },
                { value: 'custom', label: 'Custom Date Range' }
              ]}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-navy dark:text-white flex items-center gap-1.5">
              <FilterIcon className="h-3.5 w-3.5 text-slate-400" />
              Audit Approval Filter
            </label>
            <Select
              size="md"
              fullWidth
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={[
                { value: 'all', label: 'All Submitted Logs' },
                { value: 'approved', label: 'Approved Only (Verified Hours)' }
              ]}
            />
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {rangePreset === 'custom' && (
          <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-3.5">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input h-9 w-full px-3 text-xs font-medium text-navy dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input h-9 w-full px-3 text-xs font-medium text-navy dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Live Metrics Preview Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Live Timesheet Audit Preview
            </span>
            {loading && (
              <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-sky-400 font-medium">
                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                Calculating...
              </span>
            )}
          </div>

          {error ? (
            <p className="text-xs font-semibold text-rose-500">{error}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/40 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <ClockIcon className="h-3.5 w-3.5 text-blue-500" />
                  Total Tracked
                </div>
                <div className="mt-1 text-base font-extrabold text-navy dark:text-white">
                  {summary?.totalHours.toFixed(1) || '0.0'} hrs
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/40 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <FileSpreadsheetIcon className="h-3.5 w-3.5 text-slate-500" />
                  Work Logs
                </div>
                <div className="mt-1 text-base font-extrabold text-navy dark:text-white">
                  {logsCount} check-in{logsCount === 1 ? '' : 's'}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/40 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500" />
                  Approval Rate
                </div>
                <div className="mt-1 text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {summary?.approvalRate || 0}%
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/40 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <GitBranchIcon className="h-3.5 w-3.5 text-purple-500" />
                  Verified Commits
                </div>
                <div className="mt-1 text-base font-extrabold text-navy dark:text-white">
                  {summary?.verifiedCommitsCount || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-white/5">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={<PrinterIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />}
              disabled={loading || logsCount === 0}
              onClick={handlePrintPdf}
            >
              Print / Save PDF
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={<DownloadIcon className="h-4 w-4" />}
              disabled={loading || logsCount === 0}
              onClick={handleDownloadCsv}
            >
              Download Excel (CSV)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
