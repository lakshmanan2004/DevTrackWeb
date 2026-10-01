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
    .filter((_dev: any) => filter === 'all' ? true : true)
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
              className="bg-brand text-white hover:bg-brand/90"
            >
              Assign New Task
            </Button>
            <label className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <span className="sr-only">Search developers</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search developer..."
                className="h-9 w-56 rounded-lg border border-hairline pl-9 pr-3 text-sm text-navy placeholder:text-gray-400"
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
          options={[
            { id: 'all', label: 'All', count: developers.length }
          ]}
        />

        <section className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-canvas text-xs uppercase tracking-wide text-gray-500">
                <th scope="col" className="px-5 py-3 font-semibold">Developer</th>
                <th scope="col" className="px-3 py-3 font-semibold">Coverage</th>
                <th scope="col" className="px-3 py-3 font-semibold">Logs</th>
                <th scope="col" className="px-3 py-3 font-semibold">Missed</th>
                <th scope="col" className="px-3 py-3 font-semibold">Commits</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((dev: any) => (
                <tr key={dev.id}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="relative">
                        <Avatar
                          initials={dev.initials}
                          size="sm"
                        />
                        {dev.online && (
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-ok" title="Online now" />
                        )}
                      </span>
                      <div>
                        <p className="font-semibold text-navy">{dev.name}</p>
                        <p className="text-xs text-gray-500">{dev.email} · last seen {dev.lastSeen}</p>
                      </div>
                    </div>
                  </td>
                  <td className="w-32 px-3 py-3.5">
                    <ProgressBar
                      value={Math.round((dev.activeMinutes / 480) * 100)}
                      label={`${dev.name} coverage`}
                    />
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-gray-600">{dev.logs}</td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`font-semibold tabular-nums ${
                        dev.missed > 0 ? 'text-danger' : 'text-green-600'
                      }`}
                    >
                      {dev.missed}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-gray-600">{dev.commits}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenAssign(dev.id)}
                        className="bg-amber-600 text-white hover:bg-amber-700"
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
