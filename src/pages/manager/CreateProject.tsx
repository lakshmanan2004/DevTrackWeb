import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, GithubIcon, PlusIcon, Trash2Icon, XIcon, SparklesIcon, LayersIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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

  const [modules, setModules] = useState<Array<{ id: string; name: string; description: string; weightPercentage: number }>>([
    { id: '1', name: 'UI & Wireframe Design', description: 'Design mockups, wireframes & user experience flows', weightPercentage: 20 },
    { id: '2', name: 'Frontend Implementation', description: 'React screens, components & responsive layout', weightPercentage: 30 },
    { id: '3', name: 'Backend & API Integration', description: 'Database schema, authentication & REST API endpoints', weightPercentage: 35 },
    { id: '4', name: 'QA & Final Deployment', description: 'Testing, bug fixes and cloud deployment', weightPercentage: 15 }
  ]);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]);

  const totalModuleWeight = modules.reduce((sum, m) => sum + (Number(m.weightPercentage) || 0), 0);

  const addModuleRow = () => {
    setModules((prev) => [
      ...prev,
      { id: String(Date.now()), name: '', description: '', weightPercentage: 10 }
    ]);
  };

  const removeModuleRow = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
  };

  const updateModuleField = (id: string, field: 'name' | 'description' | 'weightPercentage', value: any) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: field === 'weightPercentage' ? Number(value) : value } : m))
    );
  };

  const loadDefaultTemplate = () => {
    setModules([
      { id: 't1', name: 'UI & Wireframe Design', description: 'Figma mockups, layout structure & design tokens', weightPercentage: 20 },
      { id: 't2', name: 'Frontend Implementation', description: 'Component development, views & routing', weightPercentage: 30 },
      { id: 't3', name: 'Backend & DB Architecture', description: 'Schema models, REST API endpoints & Auth', weightPercentage: 35 },
      { id: 't4', name: 'Testing & Cloud Launch', description: 'End-to-end integration tests & deployment', weightPercentage: 15 }
    ]);
  };

  const submit = async () => {
    setError('');
    if (!name.trim() || !teamName.trim() || !leader || selected.length === 0) {
      setError('Project name, team name, a leader and at least one developer are required.');
      return;
    }
    if (modules.length === 0) {
      setError('Please add at least one project module/task.');
      return;
    }
    if (modules.some((m) => !m.name.trim())) {
      setError('All modules must have a valid Module Name.');
      return;
    }
    if (totalModuleWeight !== 100) {
      setError(`Total module weight must equal exactly 100% (currently ${totalModuleWeight}%). Please adjust the weights.`);
      return;
    }

    setBusy(true);
    try {
      await api('/api/projects', {
        method: 'POST',
        body: {
          name, description, startedAt: start,
          targetDate: end || null, repoUrl: repo, status,
          teamName, leaderId: leader, developerIds: selected,
          modules
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
      <PageHeader title="Create New Project" subtitle="Project details, team assignment & weighted modules" />

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
                  <label key={option} className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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
                Add Developers <span className="text-danger">*</span> (Developers can only belong to one project)
              </legend>
              <ul className="grid gap-2 sm:grid-cols-2">
                {availableDevelopers.map((dev) => {
                  const isAssigned = dev.hasProject || !!dev.teamName;
                  return (
                    <li key={dev.id}>
                      <label
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          isAssigned
                            ? 'border-gray-200 bg-gray-100/70 text-gray-400 cursor-not-allowed'
                            : 'border-hairline text-navy cursor-pointer hover:bg-canvas'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            disabled={isAssigned}
                            checked={selected.includes(dev.id)}
                            onChange={() => !isAssigned && toggle(dev.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand disabled:opacity-40"
                          />
                          <span className={isAssigned ? 'line-through text-gray-500 font-normal' : 'font-medium'}>
                            {dev.name}
                          </span>
                        </div>
                        {isAssigned ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                            🔒 {dev.projectName || dev.teamName || 'Assigned'}
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            ✓ Available
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
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

          {/* SECTION 3: PROJECT MODULES & WEIGHTAGE */}
          <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                  <LayersIcon className="h-4 w-4 text-brand" />
                  3 · Project Modules & Weightage % <span className="text-danger">*</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Define project modules (e.g. UI Design, Backend, Implementation). Team Lead marks these complete to update overall project progress.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={loadDefaultTemplate} icon={<SparklesIcon className="h-3.5 w-3.5 text-brand" />}>
                  Default Template
                </Button>
                <Badge tone={totalModuleWeight === 100 ? 'green' : totalModuleWeight > 100 ? 'red' : 'yellow'}>
                  Total Weight: {totalModuleWeight}% {totalModuleWeight === 100 ? '✓' : '(Target 100%)'}
                </Badge>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {modules.map((m, idx) => (
                <div key={m.id} className="grid items-start gap-3 rounded-xl border border-hairline bg-canvas p-3 sm:grid-cols-[1fr_1.5fr_100px_40px]">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Module Name #{idx + 1}</label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateModuleField(m.id, 'name', e.target.value)}
                      placeholder="e.g. UI Wireframing"
                      className="h-9 w-full rounded-lg border border-hairline bg-white px-3 text-xs font-medium text-navy focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                    <input
                      type="text"
                      value={m.description}
                      onChange={(e) => updateModuleField(m.id, 'description', e.target.value)}
                      placeholder="Short detail of what this module covers..."
                      className="h-9 w-full rounded-lg border border-hairline bg-white px-3 text-xs text-navy focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Weight %</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={m.weightPercentage}
                        onChange={(e) => updateModuleField(m.id, 'weightPercentage', e.target.value)}
                        className="h-9 w-full rounded-lg border border-hairline bg-white pl-3 pr-6 text-xs font-bold text-navy focus:border-brand focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center pt-6">
                    <button
                      type="button"
                      onClick={() => removeModuleRow(m.id)}
                      disabled={modules.length === 1}
                      title="Remove Module"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-danger disabled:opacity-30"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={addModuleRow} icon={<PlusIcon className="h-4 w-4" />}>
                  Add Another Module
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-card border border-hairline bg-canvas p-5">
            <h2 className="text-sm font-bold text-navy">4 · Preview</h2>
            <dl className="mt-3 space-y-1.5 text-sm text-gray-700">
              {[
                { label: 'Project', value: name || '—' },
                { label: 'Team', value: teamName || '—' },
                { label: 'Leader', value: leaders.find((l) => l.id === leader)?.name || '—' },
                { label: 'Developers', value: selectedNames.join(', ') || '—' },
                { label: 'Modules', value: `${modules.length} modules (${totalModuleWeight}% total weight)` },
                { label: 'Start', value: start }
              ].map((row) => (
                <div key={row.label} className="flex gap-2">
                  <dt className="w-28 shrink-0 font-semibold text-navy">{row.label}:</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
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
              {busy ? 'Creating…' : 'Create Project & Modules'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

