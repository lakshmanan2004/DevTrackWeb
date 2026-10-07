import React, { useState } from 'react';
import { PlusIcon, PlusCircleIcon, FolderIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useTeams, useLive } from '../../hooks/useLive';
import { AssignTaskModal } from '../../components/common/AssignTaskModal';
import { api } from '../../api/client';

export function ManageTeams() {
  const { data } = useTeams();
  const teams = data?.teams || [];
  const { data: dir } = useLive<{ users: any[] }>('/api/directory', [], 0);
  const directory = dir?.users || [];

  const [tab, setTab] = useState('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetDevId, setTargetDevId] = useState<string | undefined>();
  const [addSelect, setAddSelect] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  const visible = tab === 'all' ? teams : teams.filter((team: any) => team.id === tab);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const changeLeader = async (teamId: string, leaderId: string) => {
    try {
      await api(`/api/teams/${teamId}`, { method: 'PATCH', body: { leaderId } });
      showToast('Team leader updated.');
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const addMember = async (teamId: string) => {
    const memberId = addSelect[teamId];
    if (!memberId) return;
    try {
      await api(`/api/teams/${teamId}`, { method: 'PATCH', body: { addMemberId: memberId } });
      showToast('Developer added to the team.');
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const removeMember = async (teamId: string, memberId: string) => {
    try {
      await api(`/api/teams/${teamId}`, { method: 'PATCH', body: { removeMemberId: memberId } });
      showToast('Developer removed from the team.');
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const availableToAdd = (team: any) =>
    directory.filter(
      (u: any) => u.role === 'developer' && !u.hasProject && !u.teamName && !team.members.some((m: any) => m.id === u.id)
    );

  return (
    <>
      <PageHeader
        title="Manage Teams"
        subtitle="Assign leaders and developers across your projects"
        actions={
          <Button
            variant="purple"
            size="md"
            onClick={() => setAssignModalOpen(true)}
            icon={<PlusCircleIcon className="h-4.5 w-4.5" />}
          >
            Assign Task to Developer
          </Button>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        {toast && (
          <div className="flex items-center gap-2 rounded-xl bg-green-700 p-3 text-xs font-bold text-white shadow-md animate-in fade-in">
            {toast}
          </div>
        )}

        {/* PROJECT FILTER DROPDOWN */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-4 shadow-glass">
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-sky-400">
              <FolderIcon className="h-5 w-5" />
            </div>
            <div>
              <label htmlFor="project-filter-select" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 block">
                Filter by Project / Team
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <select
                  id="project-filter-select"
                  value={tab}
                  onChange={(e) => setTab(e.target.value)}
                  className="h-10 min-w-[280px] max-w-lg rounded-xl border border-hairline dark:border-white/10 bg-canvas/60 dark:bg-slate-800 px-3 text-sm font-semibold text-navy dark:text-white shadow-2xs focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                >
                  <option value="all">📁 All Projects &amp; Teams ({teams.length})</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.project ? `${t.project} (${t.name})` : t.name}
                    </option>
                  ))}
                </select>

                {tab !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setTab('all')}
                    className="rounded-xl border border-hairline dark:border-white/10 bg-canvas dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 text-xs font-bold text-gray-600 dark:text-slate-200 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
            <span>Showing <strong className="text-navy dark:text-white">{visible.length}</strong> of <strong className="text-navy dark:text-white">{teams.length}</strong> teams</span>
          </div>
        </div>

        <div className="space-y-5">
          {visible.map((team: any) => (
            <section key={team.id} className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-glass">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline dark:border-white/10 px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-navy dark:text-white">{team.name}</h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{team.project}</p>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 dark:border-sky-500/20 bg-brand-soft/40 dark:bg-sky-950/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={team.leader?.initials || '··'} />
                    <div>
                      <p className="text-sm font-bold text-navy dark:text-white">{team.leader?.name}</p>
                      <Badge tone="blue" className="mt-1">
                        Team Leader
                      </Badge>
                    </div>
                  </div>
                  <select
                    value=""
                    onChange={(e) => e.target.value && changeLeader(team.id, e.target.value)}
                    className="h-9 rounded-xl border border-hairline dark:border-white/10 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-navy dark:text-white cursor-pointer"
                  >
                    <option value="">Change leader to…</option>
                    {directory.filter((u: any) => u.role === 'leader').map((l: any) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Developers ({team.members.length})
                </h3>
                <ul className="mt-2.5 divide-y divide-gray-100 dark:divide-white/10 rounded-xl border border-hairline dark:border-white/10">
                  {team.members.map((member: any) => (
                    <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar initials={member.initials} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy dark:text-white">{member.name}</p>
                        <p className="truncate text-[11px] text-gray-500 dark:text-slate-400">{member.email}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="purple"
                        onClick={() => {
                          setTargetDevId(member.id);
                          setAssignModalOpen(true);
                        }}
                        icon={<PlusIcon className="h-3.5 w-3.5" />}
                      >
                        Assign Task
                      </Button>

                      <button
                        type="button"
                        onClick={() => removeMember(team.id, member.id)}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-danger transition-colors duration-150 ease-out hover:bg-danger-soft dark:hover:bg-rose-950/40"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>

                {availableToAdd(team).length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 px-4 py-3.5">
                    <p className="text-sm font-semibold text-navy dark:text-white">Add Developer</p>
                    <label className="sr-only" htmlFor={`add-${team.id}`}>
                      Select a developer to add to {team.name}
                    </label>
                    <select
                      id={`add-${team.id}`}
                      value={addSelect[team.id] || ''}
                      onChange={(e) => setAddSelect({ ...addSelect, [team.id]: e.target.value })}
                      className="h-9 flex-1 rounded-xl border border-hairline dark:border-white/10 bg-white dark:bg-slate-800 px-3 text-sm text-navy dark:text-white cursor-pointer"
                    >
                      <option value="">Select developer…</option>
                      {availableToAdd(team).map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="purple"
                      onClick={() => addMember(team.id)}
                      disabled={!addSelect[team.id]}
                      icon={<PlusIcon className="h-3.5 w-3.5" />}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </section>
          ))}
          {teams.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-12 text-center">
              <p className="text-sm font-semibold text-navy dark:text-white">No teams yet</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Teams appear here once you create projects.</p>
            </div>
          )}
        </div>
      </div>

      <AssignTaskModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        defaultDeveloperId={targetDevId}
        assignerRole="PM"
        assignerName="Project Manager"
        developers={directory
          .filter((u: any) => u.role === 'developer')
          .map((u: any) => ({ id: u.id, name: u.name, team: u.teamName, project: '' }))}
      />
    </>
  );
}
