import React, { useState } from 'react';
import { SearchIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { FilterPills } from '../../components/ui/FilterPills';
import { useDevelopers } from '../../hooks/useLive';
import { AssignTaskModal } from '../../components/common/AssignTaskModal';
import { useAuth } from '../../context/AuthContext';

export function AllDevelopers() {
  const { user } = useAuth();
  const { data } = useDevelopers();
  const developers = data?.developers || [];
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetDevId, setTargetDevId] = useState<string | undefined>();

  const visible = developers
    .filter((_dev: any) => (filter === 'all' ? true : true))
    .filter((dev: any) => dev.name.toLowerCase().includes(query.toLowerCase()));

  const handleOpenAssign = (devId?: string) => {
    setTargetDevId(devId);
    setAssignModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="All Developers"
        subtitle="Developer directory, performance indicators, module assignments, and task delegation"
        actions={
          <div className="flex items-center gap-3">
            <Button
              icon={<PlusIcon className="h-4 w-4" />}
              onClick={() => handleOpenAssign()}
              className="btn-glass-primary !from-indigo-600 !to-violet-600 text-white font-bold border-none"
            >
              Assign New Task
            </Button>
            <label className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <span className="sr-only">Search developers</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search developer..."
                className="glass-input h-10 w-56 rounded-2xl pl-9 pr-3 text-xs font-medium text-navy dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </label>
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        <FilterPills
          ariaLabel="Filter developers"
          value={filter}
          onChange={setFilter}
          options={[{ id: 'all', label: 'All', count: developers.length }]}
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
              {visible.map((dev: any) => (
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
              ))}
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
