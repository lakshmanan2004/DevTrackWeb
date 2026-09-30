import React, { useState } from 'react';
import {
  UserIcon,
  MailIcon,
  ShieldCheckIcon,
  UsersIcon,
  FolderIcon,
  GithubIcon,
  LockIcon,
  CheckCircle2Icon,
  SparklesIcon,
  LayersIcon,
  BriefcaseIcon,
  ActivityIcon,
  CalendarIcon,
  RadioIcon,
  CheckIcon,
  UtensilsIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useProjects, useTeams, useLive } from '../../hooks/useLive';
import { api } from '../../api/client';

const roleLabels: Record<string, string> = {
  developer: 'Developer',
  leader: 'Team Leader',
  manager: 'Project Manager',
  admin: 'System Administrator'
};

const roleTones: Record<string, 'blue' | 'purple' | 'red' | 'green'> = {
  developer: 'blue',
  leader: 'blue',
  manager: 'purple',
  admin: 'red'
};

export function UserProfile() {
  const { user, refresh } = useAuth();
  const role = user?.role || 'leader';

  const { data: projData } = useProjects('mine');
  const { data: teamData } = useTeams();
  const { data: dir } = useLive<{ users: any[] }>('/api/directory', [], 0);

  const projects = projData?.projects || [];
  const teams = teamData?.teams || [];
  const directory = dir?.users || [];

  // Compute all assigned projects for leader (from /api/projects or parsed from profile)
  const displayProjects =
    projects.length > 0
      ? projects
      : (user?.projectName || '')
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean)
          .map((name: string, idx: number) => ({
            id: `proj-${idx}`,
            name,
            status: 'ongoing',
            teamName: user?.teamName || 'Team',
            progress: 50,
            activeDevs: 0,
            targetDate: null,
            modules: []
          }));

  // Unique developer count supervised by the leader
  const supervisedDevCount = teams.reduce((acc: number, t: any) => {
    return acc + (Array.isArray(t.members) ? t.members.length : 0);
  }, 0) || (teams.length > 0 ? teams.length * 3 : (user?.role === 'leader' ? 5 : 0));

  const [name, setName] = useState(user?.name || '');
  const [github, setGithub] = useState(user?.github || '');
  const [lunchSlot, setLunchSlot] = useState<number>(user?.lunchSlot || 12);
  const [saved, setSaved] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api('/api/users/profile', { method: 'PATCH', body: { name, github, lunchSlot: role === 'developer' ? lunchSlot : undefined } });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match', error: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters', error: true });
      return;
    }

    try {
      await api('/api/users/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword }
      });
      setPasswordMessage({ text: 'Password changed successfully! ✓' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordMessage(null);
        setShowPasswordForm(false);
      }, 2500);
    } catch (err: any) {
      setPasswordMessage({ text: err.message || 'Failed to change password', error: true });
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="My Profile"
        subtitle={`Account details, security settings, and workspace preferences for ${roleLabels[role] || 'User'}`}
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-6 xl:grid-cols-12 items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: USER OVERVIEW CARD & SECURITY (5 COLUMNS)                    */}
          {/* ========================================================================= */}
          <div className="xl:col-span-5 space-y-6">
            {/* USER IDENTITY CARD */}
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card text-center">
              <div className="flex flex-col items-center">
                <div className="inline-block rounded-full ring-4 ring-slate-100 shadow-sm">
                  <Avatar initials={user?.initials || '··'} size="lg" tone={roleTones[role]} />
                </div>
                <h2 className="mt-3.5 text-xl font-bold text-navy">{user?.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>

                {/* ROLE BADGE ALONE */}
                <div className="mt-3 flex items-center justify-center">
                  <Badge tone={roleTones[role]}>{roleLabels[role]}</Badge>
                </div>

                {/* METADATA LIST */}
                <div className="mt-6 border-t border-hairline pt-4 text-left space-y-2.5 text-xs">
                  {/* Email Address */}
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
                    <span className="flex items-center gap-2 text-slate-500 shrink-0 font-medium">
                      <MailIcon className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Email Address</span>
                    </span>
                    <span className="font-semibold text-navy truncate text-right pl-2 max-w-[210px]" title={user?.email}>
                      {user?.email}
                    </span>
                  </div>

                  {/* Role Permissions */}
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
                    <span className="flex items-center gap-2 text-slate-500 shrink-0 font-medium">
                      <ShieldCheckIcon className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Role Permissions</span>
                    </span>
                    <span className="font-bold text-navy text-right">
                      {roleLabels[role] || role.toUpperCase()}
                    </span>
                  </div>

                  {/* Assigned Projects count for Leader & Manager */}
                  {(role === 'leader' || role === 'manager') && (
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
                      <span className="flex items-center gap-2 text-slate-500 shrink-0 font-medium">
                        <FolderIcon className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>Assigned Projects</span>
                      </span>
                      <span className="font-bold text-navy text-right pl-2">
                        {displayProjects.length} {displayProjects.length === 1 ? 'Project' : 'Projects'}
                      </span>
                    </div>
                  )}

                  {role === 'developer' && (
                    <>
                      {user?.teamName && (
                        <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
                          <span className="flex items-center gap-2 text-slate-500 shrink-0 font-medium">
                            <UsersIcon className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>Assigned Team</span>
                          </span>
                          <span className="font-semibold text-navy text-right pl-2">{user.teamName}</span>
                        </div>
                      )}

                      {user?.projectName && (
                        <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
                          <span className="flex items-center gap-2 text-slate-500 shrink-0 font-medium">
                            <FolderIcon className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>Active Project</span>
                          </span>
                          <span className="font-semibold text-navy text-right pl-2">{user.projectName}</span>
                        </div>
                      )}

                      {/* Lunch Break for Developer */}
                      <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
                        <span className="flex items-center gap-2 text-slate-500 shrink-0 font-medium">
                          <UtensilsIcon className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>Lunch Break</span>
                        </span>
                        <span className="font-semibold text-navy text-right pl-2">
                          {(user?.lunchSlot || lunchSlot) === 11 ? '11:00 AM – 12:00 PM' : '12:00 PM – 1:00 PM'}
                        </span>
                      </div>
                    </>
                  )}

                  {/* GitHub Profile */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="flex items-center gap-2 text-slate-500 shrink-0 font-medium">
                      <GithubIcon className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>GitHub Profile</span>
                    </span>
                    <span className="font-semibold text-navy text-right pl-2">
                      {user?.github ? (
                        <a
                          href={`https://github.com/${user.github}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand hover:underline font-bold"
                        >
                          @{user.github}
                        </a>
                      ) : (
                        <span className="text-gray-400 font-normal">Not linked</span>
                      )}
                    </span>
                  </div>
                </div>
            </div>
          </div>

          {/* PASSWORD & SECURITY CARD */}
          <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <LockIcon className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold text-navy">Password &amp; Security</h3>
              </div>
              <Button
                size="sm"
                variant={showPasswordForm ? 'outline' : 'secondary'}
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </Button>
            </div>

            {showPasswordForm ? (
              <form onSubmit={changePassword} className="mt-4 space-y-3.5">
                {passwordMessage && (
                  <div
                    className={`rounded-lg p-3 text-xs font-semibold ${
                      passwordMessage.error
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full rounded-lg border border-hairline px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters..."
                    className="w-full rounded-lg border border-hairline px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password..."
                    className="w-full rounded-lg border border-hairline px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="sm" className="w-full">
                    Update Password
                  </Button>
                </div>
              </form>
            ) : (
              <p className="mt-3 text-xs text-gray-500">
                Ensure your account is protected with a secure password. You can change your password anytime using your existing password.
              </p>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: PROFILE EDIT & ROLE-SPECIFIC WORKSPACE DETAILS (7 COLUMNS)   */}
        {/* ========================================================================= */}
        <div className="xl:col-span-7 space-y-6">
          {/* PROFILE EDIT FORM */}
          <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold text-navy">Edit Profile Information</h3>
              </div>
              {saved && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full animate-in fade-in">
                  <CheckIcon className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>

            <form onSubmit={saveProfile} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Full Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-hairline px-3 py-2 text-sm text-navy focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">GitHub Username</label>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="e.g. johndoe"
                    className="w-full rounded-lg border border-hairline px-3 py-2 text-sm text-navy focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-lg border border-hairline bg-slate-100/70 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Email address is managed by the administrator.
                </p>
              </div>

              {role === 'developer' && (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-navy mb-1">Lunch Break Time Slot</label>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Choose your daily lunch break hour. Check-ins and submission alerts are paused during this hour.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setLunchSlot(11)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all ${
                        lunchSlot === 11
                          ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-400/40'
                          : 'border-hairline bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>🍱</span>
                      <span>11:00 AM – 12:00 PM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLunchSlot(12)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all ${
                        lunchSlot === 12
                          ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-400/40'
                          : 'border-hairline bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>🍱</span>
                      <span>12:00 PM – 1:00 PM</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isUpdating} size="md">
                  {isUpdating ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </div>

          {/* ROLE-SPECIFIC WORKSPACE OVERVIEW */}
          {role === 'leader' && (
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2">
                  <RadioIcon className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-navy">Team Leader Projects &amp; Teams</h3>
                </div>
                <Badge tone="blue">Lead Workspace</Badge>
              </div>

              {/* STATS TILES */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-hairline bg-slate-50 p-3.5">
                  <p className="text-xs font-bold text-gray-500">Assigned Projects</p>
                  <p className="mt-1 text-base font-extrabold text-purple-700">
                    {displayProjects.length} {displayProjects.length === 1 ? 'Project' : 'Projects'}
                  </p>
                </div>
                <div className="rounded-xl border border-hairline bg-slate-50 p-3.5">
                  <p className="text-xs font-bold text-gray-500">Assigned Teams</p>
                  <p className="mt-1 text-base font-extrabold text-navy truncate">
                    {teams.length || (user?.teamName ? 1 : 0)} {teams.length === 1 ? 'Team' : 'Teams'}
                  </p>
                </div>
                <div className="rounded-xl border border-hairline bg-slate-50 p-3.5">
                  <p className="text-xs font-bold text-gray-500">Supervised Developers</p>
                  <p className="mt-1 text-base font-extrabold text-brand">
                    {supervisedDevCount} Devs
                  </p>
                </div>
              </div>

              {/* ASSIGNED PROJECTS LIST */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <FolderIcon className="h-3.5 w-3.5 text-purple-600" /> Managed Project List
                </h4>

                {displayProjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-gray-400">
                    No projects assigned yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-hairline overflow-hidden bg-slate-50/50">
                    {displayProjects.map((p: any) => {
                      const linkedTeam = teams.find((t: any) => t.project?._id === p.id || t.project === p.id || t.name === p.teamName) || (teams.length === 1 ? teams[0] : null);
                      const membersCount = linkedTeam?.members?.length || 0;

                      return (
                        <div key={p.id || p.name} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition-colors">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-navy truncate">{p.name}</p>
                              <Badge tone={p.status === 'completed' ? 'green' : 'purple'}>
                                {p.status === 'completed' ? 'Delivered' : 'Active'}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              {linkedTeam?.name && (
                                <span className="flex items-center gap-1">
                                  <UsersIcon className="h-3.5 w-3.5 text-gray-400" /> Team: <span className="font-semibold text-slate-700">{linkedTeam.name}</span>
                                </span>
                              )}
                              {membersCount > 0 && (
                                <span>• {membersCount} Developers</span>
                              )}
                              {p.targetDate && (
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3.5 w-3.5 text-gray-400" /> Target: {p.targetDate}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {typeof p.progress === 'number' && (
                              <div className="w-28 text-right">
                                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                  <span className="text-gray-400">Progress</span>
                                  <span className="text-navy">{p.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-brand"
                                    style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CAPABILITIES CALLOUT */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-950">
                  <SparklesIcon className="h-4 w-4 text-brand" /> Team Leader Capabilities
                </p>
                <p className="text-blue-800 leading-relaxed">
                  As a Team Leader, you monitor hourly check-ins on the <strong>Live Dashboard</strong>, inspect unsubmitted attendance and pending works on the <strong>Team Calendar</strong>, review code proofs in <strong>Log Approvals</strong>, and assign targeted feedback tasks.
                </p>
              </div>
            </div>
          )}

          {role === 'manager' && (
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-navy">Project Manager Projects &amp; Teams</h3>
                </div>
                <Badge tone="purple">Manager Workspace</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-hairline bg-slate-50 p-3.5">
                  <p className="text-xs font-bold text-gray-500">Managed Projects</p>
                  <p className="mt-1 text-base font-extrabold text-purple-700">
                    {displayProjects.length} {displayProjects.length === 1 ? 'Project' : 'Projects'}
                  </p>
                </div>
                <div className="rounded-xl border border-hairline bg-slate-50 p-3.5">
                  <p className="text-xs font-bold text-gray-500">Total Teams</p>
                  <p className="mt-1 text-base font-extrabold text-navy">
                    {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
                  </p>
                </div>
                <div className="rounded-xl border border-hairline bg-slate-50 p-3.5">
                  <p className="text-xs font-bold text-gray-500">Active Developers</p>
                  <p className="mt-1 text-base font-extrabold text-brand">
                    {directory.filter((u: any) => u.role === 'developer').length || supervisedDevCount} Devs
                  </p>
                </div>
              </div>

              {/* MANAGED PROJECTS LIST */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <FolderIcon className="h-3.5 w-3.5 text-purple-600" /> Managed Project Portfolio
                </h4>

                {displayProjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-gray-400">
                    No projects created yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-hairline overflow-hidden bg-slate-50/50">
                    {displayProjects.map((p: any) => {
                      const linkedTeam = teams.find((t: any) => t.project?._id === p.id || t.project === p.id || t.name === p.teamName) || null;
                      const membersCount = linkedTeam?.members?.length || 0;

                      return (
                        <div key={p.id || p.name} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition-colors">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-navy truncate">{p.name}</p>
                              <Badge tone={p.status === 'completed' ? 'green' : p.status === 'hold' ? 'yellow' : 'purple'}>
                                {p.status === 'completed' ? 'Delivered' : p.status === 'hold' ? 'On Hold' : 'Active'}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              {linkedTeam?.name && (
                                <span className="flex items-center gap-1">
                                  <UsersIcon className="h-3.5 w-3.5 text-gray-400" /> Team: <span className="font-semibold text-slate-700">{linkedTeam.name}</span>
                                </span>
                              )}
                              {linkedTeam?.leader?.name && (
                                <span>• TL: <span className="font-semibold text-slate-700">{linkedTeam.leader.name}</span></span>
                              )}
                              {membersCount > 0 && (
                                <span>• {membersCount} Devs</span>
                              )}
                              {p.targetDate && (
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3.5 w-3.5 text-gray-400" /> Target: {p.targetDate}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {typeof p.progress === 'number' && (
                              <div className="w-28 text-right">
                                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                  <span className="text-gray-400">Progress</span>
                                  <span className="text-navy">{p.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-purple-600"
                                    style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 text-xs text-purple-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-purple-950">
                  <LayersIcon className="h-4 w-4 text-purple-600" /> Project Manager Capabilities
                </p>
                <p className="text-purple-800 leading-relaxed">
                  As a Project Manager, you create projects and track module delivery in <strong>My Projects</strong>, assign team leaders and developers in <strong>Manage Teams</strong>, inspect high-level milestones in <strong>Project Overview</strong>, and triage system alerts.
                </p>
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2">
                  <ActivityIcon className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-bold text-navy">Administrator Responsibilities</h3>
                </div>
                <Badge tone="red">System Owner</Badge>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-xs text-rose-900 space-y-1">
                <p className="font-bold text-rose-950">Full Platform Access</p>
                <p className="text-rose-800 leading-relaxed">
                  As an Administrator, you manage accounts in <strong>User Management</strong>, inspect company-wide productivity metrics in <strong>Employee Performance</strong>, and configure work policies in <strong>Settings</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}