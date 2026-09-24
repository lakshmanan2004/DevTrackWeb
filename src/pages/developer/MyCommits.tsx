import React, { useState } from 'react';
import {
  CalendarIcon,
  CheckCircle2Icon,
  GitBranchIcon,
  GithubIcon,
  LightbulbIcon,
  PlusIcon,
  XIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Button } from '../../components/ui/Button';
import { Commit } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCommits } from '../../hooks/useLive';
import { api } from '../../api/client';

function CommitRow({ commit }: { commit: Commit }) {
  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ok" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy">{commit.message}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <GitBranchIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {commit.branch}
          </span>
          <span aria-hidden="true">·</span>
          <span>{commit.time}</span>
          <span aria-hidden="true">·</span>
          <span>{commit.files} files</span>
        </p>
      </div>
      {commit.url && (
        <a href={commit.url} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] font-semibold text-brand hover:underline">
          view
        </a>
      )}
      <code className="shrink-0 rounded bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-600">
        {commit.sha}
      </code>
    </li>);
}

export function MyCommits() {
  const { user } = useAuth();
  const { data, refetch } = useCommits();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [branch, setBranch] = useState('');
  const [files, setFiles] = useState(1);
  const [url, setUrl] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [fetchingGithub, setFetchingGithub] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const commitsToday = data?.today || [];
  const commitsYesterday = data?.yesterday || [];
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const yesterdayLabel = new Date(Date.now() - 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const handleFetchGithub = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.includes('github.com')) return;
    setFetchingGithub(true);
    setError('');
    try {
      const res = await api<{ meta: any }>(`/api/commits/fetch-github?url=${encodeURIComponent(targetUrl)}`);
      if (res?.meta) {
        if (res.meta.message) setMessage(res.meta.message);
        if (res.meta.files) setFiles(res.meta.files);
        if (res.meta.committedAt) {
          const dt = new Date(res.meta.committedAt);
          // format YYYY-MM-DDTHH:mm for datetime-local input
          const localISO = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setCustomTime(localISO);
        }
      }
    } catch {
      // non-fatal if url is private or invalid
    } finally {
      setFetchingGithub(false);
    }
  };

  const submit = async () => {
    if (!message.trim()) return;
    setBusy(true);
    setError('');
    try {
      const committedAtISO = customTime ? new Date(customTime).toISOString() : undefined;
      await api('/api/commits', { method: 'POST', body: { message, branch: branch.trim() || 'main', files, url, committedAt: committedAtISO } });
      setMessage('');
      setUrl('');
      setFiles(1);
      setCustomTime('');
      setShowForm(false);
      refetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const lastSync = commitsToday[0]?.time || 'no commits yet today';

  return (
    <>
      <PageHeader
        title="My GitHub Commits"
        subtitle="Commit proof attached to your hourly logs"
        actions={
        <span className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white px-3 py-2 text-xs font-semibold text-navy">
            <GithubIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
            {user?.github || 'no github linked'}
          </span>
        } />

      <div className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Banner
            tone="green"
            icon={<CheckCircle2Icon className="h-4 w-4" />}
            className="flex-1"
            title={commitsToday.length > 0 ? `${commitsToday.length} commits today` : 'No commits today yet'}>
            Last commit: {lastSync} · commits appear in your team leader's overview instantly
          </Banner>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white px-3 py-2.5 text-sm font-semibold text-navy">
              <CalendarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              Today
            </label>
            <Button onClick={() => setShowForm((v) => !v)} icon={<PlusIcon className="h-4 w-4" />}>
              Log Commit
            </Button>
          </div>
        </div>

        {showForm && (
          <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
            <h2 className="text-sm font-bold text-navy">Log a commit</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 flex gap-2">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={(e) => handleFetchGithub(e.target.value)}
                  placeholder="Paste GitHub commit URL (e.g. https://github.com/owner/repo/commit/sha)"
                  className="h-10 flex-1 rounded-lg border border-hairline px-3 text-sm text-navy"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={fetchingGithub || !url.includes('github.com')}
                  onClick={() => handleFetchGithub(url)}
                >
                  {fetchingGithub ? 'Fetching…' : 'Fetch Details'}
                </Button>
              </div>

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Commit message"
                className="h-10 rounded-lg border border-hairline px-3 text-sm text-navy sm:col-span-2"
              />

              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Branch (e.g. main)"
                className="h-10 rounded-lg border border-hairline px-3 text-sm text-navy"
              />

              <input
                type="number"
                min={1}
                value={files}
                onChange={(e) => setFiles(Number(e.target.value))}
                placeholder="Files changed"
                className="h-10 rounded-lg border border-hairline px-3 text-sm text-navy"
              />

              <div className="sm:col-span-2 flex flex-col gap-1">
                <label htmlFor="commit-created-at" className="text-xs font-semibold text-gray-500">
                  Commit Creation Time (optional — defaults to current time or fetched GitHub time)
                </label>
                <input
                  id="commit-created-at"
                  type="datetime-local"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="h-10 rounded-lg border border-hairline px-3 text-sm text-navy"
                />
              </div>
            </div>

            {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)} icon={<XIcon className="h-3.5 w-3.5" />}>Cancel</Button>
              <Button onClick={submit} disabled={busy || !message.trim()}>{busy ? 'Saving…' : 'Save Commit'}</Button>
            </div>
          </section>
        )}

        <section className="rounded-card border border-hairline bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
            <h2 className="text-sm font-bold text-navy">Today · {dateLabel}</h2>
            <span className="text-xs font-semibold text-gray-500">{commitsToday.length} commits</span>
          </div>
          <ol className="divide-y divide-gray-100">
            {commitsToday.map((commit: Commit) =>
            <CommitRow key={commit.id} commit={commit} />
            )}
            {commitsToday.length === 0 && (
              <li className="px-5 py-6 text-center text-xs text-gray-500">No commits today yet.</li>
            )}
          </ol>
        </section>

        <section className="rounded-card border border-hairline bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
            <h2 className="text-sm font-bold text-navy">Yesterday · {yesterdayLabel}</h2>
            <span className="text-xs font-semibold text-gray-500">{commitsYesterday.length} commits</span>
          </div>
          <ol className="divide-y divide-gray-100">
            {commitsYesterday.map((commit: Commit) =>
            <CommitRow key={commit.id} commit={commit} />
            )}
            {commitsYesterday.length === 0 && (
              <li className="px-5 py-6 text-center text-xs text-gray-500">No commits yesterday.</li>
            )}
          </ol>
        </section>

        <Banner tone="blue" icon={<LightbulbIcon className="h-4 w-4" />}>
          Commits you log here appear instantly in your Team Leader's commits overview and attach to your work logs as proof.
        </Banner>
      </div>
    </>);
}
