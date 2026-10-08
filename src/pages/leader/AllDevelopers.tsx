import React, { useState } from 'react';
import { SearchIcon, PlusIcon, UsersIcon, UserCheckIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { FilterPills } from '../../components/ui/FilterPills';
import { Select } from '../../components/ui/Select';
import { useDevelopers } from '../../hooks/useLive';
import { AssignTaskModal } from '../../components/common/AssignTaskModal';
import { useAuth } from '../../context/AuthContext';

export function AllDevelopers() {
  const { user } = useAuth();
  const { data } = useDevelopers();
  const developers = data?.developers || [];
  const [filter, setFilter] = useState('all');
  const [selectedDevId, setSelectedDevId] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetDevId, setTargetDevId] = useState<string | undefined>();

  const counts = {
    all: developers.length,
    online: developers.filter((dev: any) => dev.online).length,
    missed: developers.filter((dev: any) => dev.missed > 0).length,
    top: developers.filter((dev: any) => dev.topPerformer || (dev.activeMinutes >= 240 && dev.missed === 0)).length
  };

  const visible = developers
    .filter((dev: any) => {
      if (selectedDevId !== 'all') {
        const dId = String(dev.id || dev._id || '');
        if (dId !== selectedDevId && dev.name.toLowerCase() !== selectedDevId.toLowerCase()) {
          return false;
        }
      }
      if (filter === 'online') return dev.online;
      if (filter === 'missed') return dev.missed > 0;
      if (filter === 'top') return dev.topPerformer || (dev.activeMinutes >= 240 && dev.missed === 0);
      return true;
    })
    .filter((dev: any) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        dev.name?.toLowerCase().includes(q) ||
        dev.email?.toLowerCase().includes(q) ||
        dev.team?.toLowerCase().includes(q) ||
        dev.project?.toLowerCase().includes(q)
      );
    });

  const handleOpenAssign = (devId?: string) => {
    setTargetDevId(devId || (selectedDevId !== 'all' ? selectedDevId : undefined));
    setAssignModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="All Developers"
        subtitle="Developer directory, performance indicators, module assignments, and task delegation"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {developers.length > 1 && (
              <div className="w-52 xl:w-60">
                <Select
                  size="sm"
                  fullWidth
                  value={selectedDevId}
                  onChange={(val) => setSelectedDevId(val)}
                  icon={<UsersIcon className="h-3.5 w-3.5 text-slate-400" />}
                  placeholder={`All Developers (${developers.length})`}
                  options={[
                    { value: 'all', label: `All Developers (${developers.length})` },
                    ...developers.map((dev: any) => ({
                      value: String(dev.id || dev._id),
                      label: dev.name,
                      description: dev.email ? `${dev.email}` : undefined,
                      badge: dev.online ? 'Online' : undefined,
                      tone: (dev.online ? 'green' : undefined) as any
                    }))
                  ]}
                  searchable
                />
              </div>
            )}

            <label className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <span className="sr-only">Search developers</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search developer..."
                className="glass-input h-9 w-44 sm:w-52 rounded-xl pl-8 pr-3 text-xs font-medium text-navy dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </label>

            <Button
              size="sm"
              icon={<PlusIcon className="h-4 w-4" />}
              onClick={() => handleOpenAssign()}
              className="btn-glass-primary !from-indigo-600 !to-violet-600 text-white font-bold border-none"
            >
              Assign New Task
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        <FilterPills
          ariaLabel="Filter developers"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'online', label: 'Online Now', count: counts.online },
            { id: 'missed', label: 'Needs Attention', count: counts.missed },
            { id: 'top', label: 'Top Coverage', count: counts.top }
          ]}
        />

        <section className="glass-card overflow-hidden rounded-3xl shadow-glass">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs uppercase tracking-wide text-slate-400">
                <th scope="col" className="px-6 py-3.5 font-semibold">Developer</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">Coverage</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">Logs</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">Missed</th>
                <th scope="col" className="px-3 py-3.5 font-semibold">Commits</th>
                <th scope="col" className="px-6 py-3.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <UsersIcon className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-navy dark:text-white">No developers found</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        No team developers match the current search or filter selection.
                      </p>
                      {(selectedDevId !== 'all' || query || filter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDevId('all');
                            setQuery('');
                            setFilter('all');
                          }}
                          className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((dev: any) => (
                  <tr key={dev.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="relative">
                          <Avatar initials={dev.initials} size="sm" />
                          {dev.online && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#101726] bg-emerald-500 shadow-sm" title="Online now" />
                          )}
                        </span>
                        <div>
                          <p className="font-semibold text-navy dark:text-white">{dev.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{dev.email} · last seen {dev.lastSeen}</p>
                        </div>
                      </div>
                    </td>
                    <td className="w-32 px-3 py-3.5">
                      <ProgressBar
                        value={Math.round((dev.activeMinutes / 480) * 100)}
                        label={`${dev.name} coverage`}
                      />
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">{dev.logs}</td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`font-semibold tabular-nums ${
                          dev.missed > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'
                        }`}
                      >
                        {dev.missed}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">{dev.commits}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleOpenAssign(dev.id)}
                          className="btn-glass-primary !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 text-white font-bold border-none"
                          icon={<PlusIcon className="h-3.5 w-3.5" />}
                        >
                          Assign Task
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <AssignTaskModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        defaultDeveloperId={targetDevId}
        assignerRole="TL"
        assignerName={`${user?.name || ''} (Team Lead)`}
        developers={developers}
      />
    </>
  );
}
