import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, GithubIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useLive } from '../../hooks/useLive';
import { api } from '../../api/client';

export function CreateProject() {
  const navigate = useNavigate();
  const { data: dir } = useLive<{ users: any[] }>('/api/directory', [], 0);
  const directory = dir?.users || [];
  const leaders = directory.filter((u) => u.role === 'leader');
  const availableDevelopers = directory.filter((u) => u.role === 'developer');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState('');
  const [repo, setRepo] = useState('');
  const [status, setStatus] = useState<'ongoing' | 'hold'>('ongoing');
  const [teamName, setTeamName] = useState('');
  const [leader, setLeader] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: string) =>
  setSelected((prev) => prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]);

  const submit = async () => {
    setError('');
    if (!name.trim() || !teamName.trim() || !leader || selected.length === 0) {
      setError('Project name, team name, a leader and at least one developer are required.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/projects', {
        method: 'POST',
        body: {
          name, description, startedAt: start,
          targetDate: end || null, repoUrl: repo, status,
          teamName, leaderId: leader, developerIds: selected
        }
      });
      navigate('/manager');
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setBusy(false);
    }
  };

  const selectedNames = selected
    .map((id) => availableDevelopers.find((d) => d.id === id)?.name)
    .filter(Boolean);

  return (
    <>
      <PageHeader title="Create New Project" subtitle="Project, team and assignments in one step" />

      <div className="flex-1 p-6">
        <div className="max-w-4xl space-y-5">
          <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
            <h2 className="text-sm font-bold text-navy">1 · Project Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="cp-name" className="mb-1.5 block text-sm font-medium text-navy">
                  Project Name <span className="text-danger">*</span>
                </label>
                <input
                  id="cp-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. College ERP System"
                  className="h-10 w-full rounded-lg border border-hairline px-3 text-sm text-navy" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="cp-desc" className="mb-1.5 block text-sm font-medium text-navy">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea
                  id="cp-desc"
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-lg border border-hairline px-3 py-2.5 text-sm leading-relaxed text-navy" />
              </div>
              <div>
                <label htmlFor="cp-start" className="mb-1.5 block text-sm font-medium text-navy">
                  Start Date <span className="text-danger">*</span>
                </label>
                <input
                  id="cp-start"
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline px-3 text-sm text-navy" />
              </div>
              <div>
                <label htmlFor="cp-end" className="mb-1.5 block text-sm font-medium text-navy">
                  Expected End Date
                </label>
                <input
                  id="cp-end"
                  type="date"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline px-3 text-sm text-navy" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="cp-repo" className="mb-1.5 block text-sm font-medium text-navy">
                  GitHub Repository URL <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <GithubIcon
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden="true" />
                  <input
                    id="cp-repo"
                    type="url"
                    value={repo}
                    onChange={(event) => setRepo(event.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="h-10 w-full rounded-lg border border-hairline pl-10 pr-3 text-sm text-navy placeholder:text-gray-400" />
                </div>
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-sm font-medium text-navy">Status</legend>
                <div className="flex gap-5">
                  {(['ongoing', 'hold'] as const).map((option) =>
                  <label key={option} className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                      type="radio"
                      name="cp-status"
                      checked={status === option}
                      onChange={() => setStatus(option)}
                      className="h-4 w-4 border-gray-300 text-brand" />
                    {option === 'ongoing' ? 'Ongoing' : 'On Hold'}
                    </label>
                  )}
                </div>
              </fieldset>
            </div>
          </section>

          <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
            <h2 className="text-sm font-bold text-navy">2 · Team Setup</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cp-team" className="mb-1.5 block text-sm font-medium text-navy">
                  Team Name <span className="text-danger">*</span>
                </label>
                <input
                  id="cp-team"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="e.g. Team Alpha"
                  className="h-10 w-full rounded-lg border border-hairline px-3 text-sm text-navy" />
              </div>
              <div>
                <label htmlFor="cp-leader" className="mb-1.5 block text-sm font-medium text-navy">
                  Assign Team Leader <span className="text-danger">*</span>
                </label>
                <select
                  id="cp-leader"
                  value={leader}
                  onChange={(event) => setLeader(event.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-navy">
                  <option value="">Select leader…</option>
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}{l.teamName ? ` (leads ${l.teamName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-medium text-navy">
                Add Developers <span className="text-danger">*</span>
              </legend>
              <ul className="grid gap-2 sm:grid-cols-2">
                {availableDevelopers.map((dev) =>
                <li key={dev.id}>
                    <label className="flex items-center gap-2.5 rounded-lg border border-hairline px-3 py-2.5 text-sm text-navy">
                      <input
                      type="checkbox"
                      checked={selected.includes(dev.id)}
                      onChange={() => toggle(dev.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand" />
                    {dev.name}{dev.teamName ? ` (${dev.teamName})` : ''}
                    </label>
                  </li>
                )}
              </ul>

              {selectedNames.length > 0 &&
              <div className="mt-3 flex flex-wrap gap-2">
                  {selected.map((id) => {
                    const devName = availableDevelopers.find((d) => d.id === id)?.name || '';
                    return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-pm-soft px-3 py-1.5 text-xs font-semibold text-pm">
                      {devName}
                      <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label={`Remove ${devName}`}
                      className="rounded-full p-0.5 transition-colors duration-150 ease-out hover:bg-violet-200">
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                    );
                  })}
                </div>
              }
            </fieldset>
          </section>

          <section className="rounded-card border border-hairline bg-canvas p-5">
            <h2 className="text-sm font-bold text-navy">3 · Preview</h2>
            <dl className="mt-3 space-y-1.5 text-sm text-gray-700">
              {[
              { label: 'Project', value: name || '—' },
              { label: 'Team', value: teamName || '—' },
              { label: 'Leader', value: leaders.find((l) => l.id === leader)?.name || '—' },
              { label: 'Developers', value: selectedNames.join(', ') || '—' },
              { label: 'Start', value: start }].
              map((row) =>
              <div key={row.label} className="flex gap-2">
                  <dt className="w-28 shrink-0 font-semibold text-navy">{row.label}:</dt>
                  <dd>{row.value}</dd>
                </div>
              )}
            </dl>
          </section>

          {error && (
            <p className="rounded-lg border border-red-200 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="lg" onClick={() => navigate('/manager')}>
              Cancel
            </Button>
            <Button size="lg" onClick={submit} disabled={busy} icon={<ArrowRightIcon className="h-4 w-4" />}>
              {busy ? 'Creating…' : 'Create Project & Team'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
