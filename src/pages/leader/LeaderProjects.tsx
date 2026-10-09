import React, { useState } from 'react';
import {
  FolderKanbanIcon,
  LayersIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircle2Icon,
  TrendingUpIcon,
  UserIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { FilterPills } from '../../components/ui/FilterPills';
import { ProjectModulesSection } from '../../components/project/ProjectModulesSection';
import { useProjects, useDevelopers } from '../../hooks/useLive';
import { useAuth } from '../../context/AuthContext';

const healthTone = {
  'On Track': 'green',
  'Slightly Behind': 'yellow',
  Behind: 'red',
  'Delivered on time': 'green'
} as const;

export function LeaderProjects() {
  const { user } = useAuth();
  const { data: projectsData, refetch: refetchProjects } = useProjects('mine');
  const { data: devsData } = useDevelopers();

  const projects = projectsData?.projects || [];
  const developers = devsData?.developers || [];

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInspectionProjectId, setSelectedInspectionProjectId] = useState<string | null>(null);

  const activeCount = projects.filter((p: any) => p.status !== 'completed' && p.status !== 'hold').length;
  const completedCount = projects.filter((p: any) => p.status === 'completed').length;
  const totalDevs = developers.length;

  const filteredProjects = projects.filter((p: any) => {
    if (filter === 'active' && (p.status === 'completed' || p.status === 'hold')) return false;
    if (filter === 'completed' && p.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchTeam = (p.team || p.teamName || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      return matchName || matchTeam || matchDesc;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="Managed Projects"
        subtitle={`Projects supervised by ${user?.name || 'you'} (Team Leader) — inspect milestones, modules & developer submissions`}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 p-6 sm:p-8">
        {/* TOP SUMMARY STATS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="glass-card rounded-2xl p-4 shadow-glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Projects</span>
              <FolderKanbanIcon className="h-4 w-4 text-brand" />
            </div>
            <p className="mt-2 text-2xl font-black text-navy dark:text-white">{projects.length}</p>
          </div>

          <div className="glass-card rounded-2xl p-4 shadow-glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Delivery</span>
              <TrendingUpIcon className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">{activeCount}</p>
          </div>

          <div className="glass-card rounded-2xl p-4 shadow-glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Completed</span>
              <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</p>
          </div>

          <div className="glass-card rounded-2xl p-4 shadow-glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Supervised Devs</span>
              <UsersIcon className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">{totalDevs}</p>
          </div>
        </div>

        {/* FILTER ROW */}
        <div className="flex flex-wrap items-center gap-3">
          <FilterPills
            ariaLabel="Filter managed projects"
            value={filter}
            onChange={(val) => setFilter(val as any)}
            options={[
              { id: 'all', label: 'All Projects', count: projects.length },
              { id: 'active', label: 'Active', count: activeCount },
              { id: 'completed', label: 'Completed', count: completedCount }
            ]}
          />
        </div>

        {/* PROJECT CARDS LIST */}
        <div className="grid gap-6">
          {filteredProjects.map((proj: any) => {
            const isInspectOpen = selectedInspectionProjectId === proj.id;
            const modulesCount = proj.modules?.length || 0;
            const completedModules = (proj.modules || []).filter((m: any) => m.status === 'completed').length;
            const progressVal = typeof proj.progress === 'number' ? Math.min(100, Math.max(0, proj.progress)) : 0;

            return (
              <article
                key={proj.id}
                className={`glass-card rounded-3xl p-6 sm:p-7 shadow-glass transition-all hover:shadow-xl space-y-5 border ${
                  isInspectOpen ? 'ring-2 ring-blue-500/30 border-blue-500/40' : ''
                }`}
              >
                {/* Header row: Name, status, health & action buttons */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg sm:text-xl font-bold text-navy dark:text-white tracking-tight">
                        {proj.name}
                      </h2>
                      <Badge tone={proj.status === 'completed' ? 'green' : 'blue'}>
                        {proj.status === 'completed' ? 'Completed' : 'Active'}
                      </Badge>
                      <Badge tone={healthTone[proj.health as keyof typeof healthTone] || 'green'}>
                        {proj.health || 'On Track'}
                      </Badge>
                      {proj.team && (
                        <Badge tone="purple">
                          <UsersIcon className="h-3 w-3 mr-1 inline" />
                          {proj.team}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                      {proj.description || 'Supervised project milestone and weighted module management.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => setSelectedInspectionProjectId(isInspectOpen ? null : proj.id)}
                      icon={isInspectOpen ? <ChevronUpIcon className="h-4 w-4" /> : <LayersIcon className="h-4 w-4" />}
                      className="btn-glass-primary !from-blue-600 !to-indigo-600 text-white font-bold"
                    >
                      {isInspectOpen ? 'Close Module Inspector' : 'Inspect Modules'}
                    </Button>
                  </div>
                </div>

                {/* Info Metadata Grid */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="glass-surface rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <UsersIcon className="h-3.5 w-3.5 text-purple-500" />
                      <span>Supervised Team</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-navy dark:text-white truncate">
                      {proj.team || 'My Team'} ({proj.developerNames?.length || totalDevs} Developers)
                    </p>
                  </div>

                  <div className="glass-surface rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <CalendarIcon className="h-3.5 w-3.5 text-amber-500" />
                      <span>Target Timeline</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-navy dark:text-white">
                      {proj.started || 'Active'} {proj.targetDate ? `➔ ${proj.targetDate}` : ''}
                    </p>
                  </div>

                  <div className="glass-surface rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <LayersIcon className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Milestone Modules</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-navy dark:text-white">
                      {completedModules} / {modulesCount} Completed
                    </p>
                  </div>
                </div>

                {/* Progress Bar with Correct Percentage */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Overall Milestone Delivery</span>
                    <span className="text-navy dark:text-white font-extrabold">{progressVal}%</span>
                  </div>
                  <ProgressBar
                    value={progressVal}
                    tone={progressVal >= 70 ? 'green' : progressVal >= 40 ? 'blue' : 'yellow'}
                  />
                </div>

                {/* EXPANDABLE MODULE INSPECTION SECTION */}
                {isInspectOpen && (
                  <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
                    <ProjectModulesSection
                      project={proj}
                      allProjects={projects}
                      developers={developers}
                      onModuleUpdated={() => refetchProjects()}
                    />
                  </div>
                )}
              </article>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="glass-card rounded-3xl p-12 text-center shadow-glass">
              <FolderKanbanIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-3 text-base font-bold text-navy dark:text-white">No Managed Projects Found</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {searchQuery ? `No projects match "${searchQuery}"` : 'Projects assigned to your team will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
