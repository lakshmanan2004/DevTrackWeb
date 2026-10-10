import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, GithubIcon, PlusIcon, Trash2Icon, XIcon, SparklesIcon, LayersIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
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
  const [status, setStatus] = useState<'ongoing' | 'urgent' | 'hold'>('ongoing');
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
    if (!name.trim() || !teamName.trim() || !leader) {
      setError('Project name, team name, and a team leader are required.');
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="max-w-4xl space-y-6">
          <section className="glass-card rounded-3xl border border-white/80 p-6 sm:p-7 shadow-glass">
            <h2 className="text-sm font-black text-navy tracking-tight">1 · Project Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="cp-name" className="mb-1.5 block text-xs font-bold text-navy">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="cp-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. College ERP System"
                  className="glass-input h-10 w-full px-3.5 text-xs font-semibold text-navy placeholder:text-slate-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="cp-desc" className="mb-1.5 block text-xs font-bold text-navy">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="cp-desc"
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="glass-input w-full p-3.5 text-xs leading-relaxed text-navy font-medium placeholder:text-slate-400"
                />
              </div>
              <div>
                <label htmlFor="cp-start" className="mb-1.5 block text-xs font-bold text-navy">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="cp-start"
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="glass-input h-10 w-full px-3.5 text-xs font-semibold text-navy"
                />
              </div>
              <div>
                <label htmlFor="cp-end" className="mb-1.5 block text-xs font-bold text-navy">
                  Expected End Date
                </label>
                <input
                  id="cp-end"
                  type="date"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="glass-input h-10 w-full px-3.5 text-xs font-semibold text-navy"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="cp-repo" className="mb-1.5 block text-xs font-bold text-navy">
                  GitHub Repository URL <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <GithubIcon
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="cp-repo"
                    type="url"
                    value={repo}
                    onChange={(event) => setRepo(event.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="glass-input h-10 w-full pl-10 pr-3.5 text-xs text-navy placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-xs font-bold text-navy dark:text-white">Project Priority & Status</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: 'ongoing', label: '🔵 Ongoing', sub: 'Standard project (Available devs only)' },
                    { id: 'urgent', label: '🚨 Urgent Sprint', sub: 'Priority delivery (Unlocks all devs for reallocation)' },
                    { id: 'hold', label: '⏸️ On Hold', sub: 'Draft or paused project' }
                  ].map((option) => {
                    const isSelected = status === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex flex-col gap-1 rounded-2xl border p-3.5 text-xs transition-all cursor-pointer ${
                          isSelected
                            ? option.id === 'urgent'
                              ? 'border-rose-500/80 bg-rose-500/15 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/30 shadow-md'
                              : 'border-brand bg-brand-soft/70 text-navy dark:text-white ring-2 ring-brand/30 shadow-md'
                            : 'border-hairline dark:border-white/10 bg-white/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="cp-status"
                            checked={isSelected}
                            onChange={() => {
                              setStatus(option.id as any);
                              if (option.id !== 'urgent') {
                                // If leaving Urgent, deselect developers who are already assigned to other teams
                                setSelected((prev) =>
                                  prev.filter((id) => {
                                    const d = availableDevelopers.find((u) => u.id === id);
                                    return !d?.hasProject && !d?.teamName;
                                  })
                                );
                              }
                            }}
                            className="h-4 w-4 text-brand accent-blue-600 cursor-pointer"
                          />
                          <span className="font-bold text-sm">{option.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 leading-tight">
                          {option.sub}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </section>

          <section className="glass-card rounded-3xl border border-white/80 p-6 sm:p-7 shadow-glass">
            <h2 className="text-sm font-black text-navy tracking-tight">2 · Team Setup</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cp-team" className="mb-1.5 block text-xs font-bold text-navy">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="cp-team"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="e.g. Team Alpha"
                  className="glass-input h-10 w-full px-3.5 text-xs font-semibold text-navy placeholder:text-slate-400"
                />
              </div>
              <div>
                <Select
                  label="Assign Team Leader *"
                  size="lg"
                  fullWidth
                  value={leader}
                  onChange={(val) => setLeader(val)}
                  placeholder="Select leader…"
                  options={leaders.map((l) => ({
                    value: l.id,
                    label: l.name
                  }))}
                  searchable
                />
              </div>
            </div>

            <fieldset className="mt-5">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <legend className="text-xs font-bold text-navy dark:text-white">
                  Add Developers <span className="text-slate-400 font-normal">(1 Project per Dev)</span>
                </legend>
                {status === 'urgent' ? (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                    ⚡ Urgent Sprint: All assigned developers unlocked for reallocation
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">
                    Only available developers can be assigned
                  </span>
                )}
              </div>

              {status === 'urgent' ? (
                <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2.5">
                  <span className="text-base">🚨</span>
                  <div>
                    <span className="font-bold">Urgent Sprint Mode:</span> You can click & select any developer from existing teams to reallocate them to this urgent project.
                  </div>
                </div>
              ) : (
                availableDevelopers.every((d) => d.hasProject || !!d.teamName) && (
                  <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>🔒</span>
                      <span>All developers are currently assigned to active projects.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStatus('urgent')}
                      className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition-colors shadow-xs"
                    >
                      Switch to Urgent Sprint
                    </button>
                  </div>
                )
              )}

              <ul className="grid gap-2.5 sm:grid-cols-2">
                {availableDevelopers.map((dev) => {
                  const isAssigned = dev.hasProject || !!dev.teamName;
                  const isUrgent = status === 'urgent';
                  const isDisabled = isAssigned && !isUrgent;
                  const isSelected = selected.includes(dev.id);

                  return (
                    <li key={dev.id}>
                      <label
                        className={`glass-surface flex items-center justify-between rounded-2xl border px-3.5 py-3 text-xs transition-all shadow-2xs ${
                          isDisabled
                            ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50/50 dark:bg-slate-900/30'
                            : isSelected
                            ? isUrgent && isAssigned
                              ? 'border-rose-500/50 bg-rose-500/10 text-rose-950 dark:text-rose-200 cursor-pointer'
                              : 'border-purple-500/50 bg-purple-500/10 text-purple-950 dark:text-purple-200 cursor-pointer'
                            : isUrgent && isAssigned
                            ? 'border-amber-300/80 bg-amber-50/40 hover:bg-amber-100/50 dark:hover:bg-amber-950/20 text-navy cursor-pointer'
                            : 'border-white/80 text-navy cursor-pointer hover:bg-white/90'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={isSelected}
                            onChange={() => !isDisabled && toggle(dev.id)}
                            className="h-4 w-4 rounded accent-rose-600 disabled:opacity-40 cursor-pointer"
                          />
                          <span
                            className={`font-bold ${
                              isDisabled
                                ? 'line-through text-slate-400 font-normal'
                                : 'text-navy dark:text-white'
                            }`}
                          >
                            {dev.name}
                          </span>
                        </div>
                        {isSelected && isAssigned ? (
                          <span className="rounded-lg bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                            ⚡ Reallocating
                          </span>
                        ) : isAssigned ? (
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${
                              isUrgent
                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                                : 'bg-slate-200/60 text-slate-500 border-slate-300/60'
                            }`}
                          >
                            {isUrgent ? '⚡ In ' : '🔒 '}{dev.projectName || dev.teamName || 'Assigned'}
                          </span>
                        ) : (
                          <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                            ✓ Available
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>

              {selectedNames.length > 0 ? (
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Allocating ({selected.length}):</span>
                  {selected.map((id) => {
                    const dev = availableDevelopers.find((d) => d.id === id);
                    const devName = dev?.name || '';
                    const wasAssigned = dev?.hasProject || !!dev?.teamName;
                    return (
                      <span
                        key={id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md ${
                          wasAssigned
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-900 dark:text-rose-200'
                            : 'bg-purple-500/15 border-purple-500/30 text-purple-800 dark:text-purple-300'
                        }`}
                      >
                        {wasAssigned && '⚡'} {devName}
                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          aria-label={`Remove ${devName}`}
                          className="rounded-full p-0.5 hover:bg-black/10 transition-colors cursor-pointer"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-slate-900/40 p-3 text-xs text-slate-500">
                  💡 <span className="font-semibold text-navy dark:text-white">Tip:</span> You can create this project with just the Team Leader, and transfer developers into it anytime using <strong>Manage Teams</strong>.
                </div>
              )}
            </fieldset>
          </section>

          {/* SECTION 3: PROJECT MODULES & WEIGHTAGE */}
          <section className="glass-card rounded-3xl border border-white/80 p-6 sm:p-7 shadow-glass">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black text-navy tracking-tight">
                  <LayersIcon className="h-4 w-4 text-brand" />
                  3 · Project Modules &amp; Weightage % <span className="text-red-500">*</span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                  Define project modules (e.g. UI Design, Backend, Implementation). Team Lead marks these complete to update overall project progress.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
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
                <div key={m.id} className="glass-surface grid items-start gap-3 rounded-2xl border border-white/80 p-4 sm:grid-cols-[1fr_1.5fr_110px_40px] shadow-2xs">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Module #{idx + 1}</label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateModuleField(m.id, 'name', e.target.value)}
                      placeholder="e.g. UI Wireframing"
                      className="glass-input h-9 w-full px-3 text-xs font-bold text-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Description</label>
                    <input
                      type="text"
                      value={m.description}
                      onChange={(e) => updateModuleField(m.id, 'description', e.target.value)}
                      placeholder="Short detail of what this module covers..."
                      className="glass-input h-9 w-full px-3 text-xs text-navy font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Weight %</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={m.weightPercentage}
                        onChange={(e) => updateModuleField(m.id, 'weightPercentage', e.target.value)}
                        className="glass-input h-9 w-full pl-3 pr-7 text-xs font-black text-navy"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center pt-6">
                    <button
                      type="button"
                      onClick={() => removeModuleRow(m.id)}
                      disabled={modules.length === 1}
                      title="Remove Module"
                      className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 transition-colors cursor-pointer"
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

          <section className="glass-card rounded-3xl border border-white/80 p-6 shadow-glass">
            <h2 className="text-sm font-black text-navy tracking-tight">4 · Preview</h2>
            <dl className="mt-3 space-y-2 text-xs text-slate-600">
              {[
                { label: 'Project', value: name || '—' },
                { label: 'Team', value: teamName || '—' },
                { label: 'Leader', value: leaders.find((l) => l.id === leader)?.name || '—' },
                { label: 'Developers', value: selectedNames.join(', ') || '—' },
                { label: 'Modules', value: `${modules.length} modules (${totalModuleWeight}% total weight)` },
                { label: 'Start', value: start }
              ].map((row) => (
                <div key={row.label} className="flex gap-2">
                  <dt className="w-28 shrink-0 font-bold text-navy">{row.label}:</dt>
                  <dd className="font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {error && (
            <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
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

