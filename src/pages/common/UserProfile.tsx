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
  UtensilsIcon,
  PaletteIcon,
  ImageIcon,
  Volume2Icon,
  PlayIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useProjects, useTeams, useLive } from '../../hooks/useLive';
import { api } from '../../api/client';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { NotificationSoundModal } from '../../components/ui/NotificationSoundModal';
import {
  getSavedNotificationSound,
  NOTIFICATION_SOUNDS,
  playMelodiousSound
} from '../../utils/audioAlerts';

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
  const { openWallpaperModal } = useTheme();
  const role = user?.role || 'leader';

  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [selectedSoundId, setSelectedSoundId] = useState(getSavedNotificationSound());

  const currentSoundMeta =
    NOTIFICATION_SOUNDS.find((s) => s.id === selectedSoundId) || NOTIFICATION_SOUNDS[0];

  const { data: projData } = useProjects('mine');
  const { data: teamData } = useTeams();
  const { data: dir } = useLive<{ users: any[] }>('/api/directory', [], 0);

  const projects = Array.isArray(projData?.projects) ? projData.projects : Array.isArray(projData) ? (projData as any[]) : [];
  const teams = Array.isArray(teamData?.teams) ? teamData.teams : Array.isArray(teamData) ? (teamData as any[]) : [];
  const directory = Array.isArray(dir?.users) ? dir.users : Array.isArray(dir) ? (dir as any[]) : [];

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
  const supervisedDevCount = Array.isArray(teams) && teams.length > 0
    ? teams.reduce((acc: number, t: any) => {
        return acc + (t && Array.isArray(t.members) ? t.members.length : 0);
      }, 0) || (teams.length * 3)
    : (user?.role === 'leader' ? 5 : 0);

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

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setGithub(user.github || '');
      if (typeof user.lunchSlot === 'number') {
        setLunchSlot(user.lunchSlot);
      }
    }
  }, [user]);

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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading user profile…</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle={`Account details, security settings, and workspace preferences for ${roleLabels[role] || 'User'}`}
        actions={
          <button
            type="button"
            onClick={openWallpaperModal}
            className="btn-glass-primary px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <PaletteIcon className="h-4 w-4" />
            <span>Theme</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <div className="grid gap-6 xl:grid-cols-12 items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: USER OVERVIEW CARD & SECURITY (5 COLUMNS)                    */}
          {/* ========================================================================= */}
          <div className="xl:col-span-5 space-y-6">
            {/* USER IDENTITY CARD */}
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="inline-block rounded-full ring-4 ring-white/30 dark:ring-white/10 shadow-lg">
                  <Avatar initials={user?.initials || '··'} size="lg" tone={roleTones[role]} />
                </div>
                <h2 className="mt-3.5 text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>

                {/* ROLE BADGE & THEME BUTTON */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Badge tone={roleTones[role]}>{roleLabels[role]}</Badge>
                  <button
                    type="button"
                    onClick={openWallpaperModal}
                    className="glass-surface inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-blue-500 dark:text-blue-400 hover:bg-white/10 transition-all cursor-pointer shadow-xs"
                  >
                    <PaletteIcon className="h-3.5 w-3.5" />
                    <span>Theme</span>
                  </button>
                </div>

                {/* METADATA LIST */}
                <div className="mt-6 border-t border-white/20 dark:border-white/10 pt-4 text-left space-y-2.5 text-xs">
                  {/* Email Address */}
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-white/10 dark:border-white/5">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                      <MailIcon className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>Email Address</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate text-right pl-2 max-w-[210px]" title={user?.email}>
                      {user?.email}
                    </span>
                  </div>

                  {/* Role Permissions */}
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-white/10 dark:border-white/5">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                      <ShieldCheckIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Role Permissions</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">
                      {roleLabels[role] || role.toUpperCase()}
                    </span>
                  </div>

                  {/* Assigned Projects count for Leader & Manager */}
                  {(role === 'leader' || role === 'manager') && (
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/10 dark:border-white/5">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                        <FolderIcon className="h-4 w-4 text-purple-500 shrink-0" />
                        <span>Assigned Projects</span>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-right pl-2">
                        {displayProjects.length} {displayProjects.length === 1 ? 'Project' : 'Projects'}
                      </span>
                    </div>
                  )}

                  {role === 'developer' && (
                    <>
                      {user?.teamName && (
                        <div className="flex items-center justify-between gap-4 py-2 border-b border-white/10 dark:border-white/5">
                          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                            <UsersIcon className="h-4 w-4 text-purple-500 shrink-0" />
                            <span>Assigned Team</span>
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white text-right pl-2">{user.teamName}</span>
                        </div>
                      )}

                      {user?.projectName && (
                        <div className="flex items-center justify-between gap-4 py-2 border-b border-white/10 dark:border-white/5">
                          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                            <FolderIcon className="h-4 w-4 text-blue-500 shrink-0" />
                            <span>Active Project</span>
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white text-right pl-2">{user.projectName}</span>
                        </div>
                      )}

                      {/* Lunch Break for Developer */}
                      <div className="flex items-center justify-between gap-4 py-2 border-b border-white/10 dark:border-white/5">
                        <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                          <UtensilsIcon className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>Lunch Break</span>
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white text-right pl-2">
                          {(user?.lunchSlot || lunchSlot) === 11 ? '11:00 AM – 12:00 PM' : '12:00 PM – 1:00 PM'}
                        </span>
                      </div>
                    </>
                  )}

                  {/* GitHub Profile */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                      <GithubIcon className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>GitHub Profile</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white text-right pl-2">
                      {user?.github ? (
                        <a
                          href={`https://github.com/${user.github}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 dark:text-blue-400 hover:underline font-bold"
                        >
                          @{user.github}
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-normal">Not linked</span>
                      )}
                    </span>
                  </div>

                  {/* Wallpaper Theme Selector */}
                  <div className="flex items-center justify-between gap-4 py-2 border-t border-white/10 dark:border-white/5">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                      <ImageIcon className="h-4 w-4 text-purple-500 shrink-0" />
                      <span>Wallpaper Theme</span>
                    </span>
                    <button
                      type="button"
                      onClick={openWallpaperModal}
                      className="glass-surface inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-500 dark:text-blue-400 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <PaletteIcon className="h-3.5 w-3.5" />
                      <span>Choose Theme</span>
                    </button>
                  </div>

                  {/* Interface Mode */}
                  <div className="flex items-center justify-between gap-4 py-2 border-t border-white/10 dark:border-white/5">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                      <SparklesIcon className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Appearance Mode</span>
                    </span>
                    <ThemeToggle variant="pill" />
                  </div>

                  {/* Notification Alert Sound */}
                  <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-t border-white/10 dark:border-white/5">
                    <div>
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                        <Volume2Icon className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span>Notification Alert Sound</span>
                      </span>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 pl-6">
                        Active: <span className="font-semibold text-slate-900 dark:text-white">{currentSoundMeta.previewEmoji} {currentSoundMeta.name}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playMelodiousSound(selectedSoundId)}
                        className="glass-surface inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                        title="Preview sound"
                      >
                        <PlayIcon className="h-3 w-3 fill-current text-amber-500" />
                        <span>Play</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSoundModalOpen(true)}
                        className="glass-surface inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Volume2Icon className="h-3.5 w-3.5" />
                        <span>Choose Sound</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <NotificationSoundModal
              open={isSoundModalOpen}
              onClose={() => setIsSoundModalOpen(false)}
              onSoundChanged={(id) => setSelectedSoundId(id)}
            />

            {/* PASSWORD & SECURITY CARD */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <LockIcon className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Password &amp; Security</h3>
                </div>
                <Button
                  size="sm"
                  variant={showPasswordForm ? 'outline' : 'secondary'}
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="rounded-xl"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Button>
              </div>

              {showPasswordForm ? (
                <form onSubmit={changePassword} className="mt-4 space-y-3.5">
                  {passwordMessage && (
                    <div
                      className={`rounded-xl p-3 text-xs font-semibold backdrop-blur-md ${
                        passwordMessage.error
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                      }`}
                    >
                      {passwordMessage.text}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password..."
                      className="glass-input w-full rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters..."
                      className="glass-input w-full rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password..."
                      className="glass-input w-full rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button type="submit" className="btn-glass-primary w-full py-2 text-xs font-bold rounded-xl shadow-lg">
                      Update Password
                    </button>
                  </div>
                </form>
              ) : (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Profile Information</h3>
                </div>
                {saved && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full animate-in fade-in">
                    <CheckIcon className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>

              <form onSubmit={saveProfile} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Display Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">GitHub Username</label>
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="e.g. johndoe"
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-80"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Email address is managed by the administrator.
                  </p>
                </div>

                {role === 'developer' && (
                  <div className="pt-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lunch Break Time Slot</label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      Choose your daily lunch break hour. Check-ins and submission alerts are paused during this hour.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => setLunchSlot(11)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                          lunchSlot === 11
                            ? 'border-amber-500/50 bg-amber-500/20 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/40 shadow-sm backdrop-blur-md'
                            : 'glass-surface text-slate-600 dark:text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span>🍱</span>
                        <span>11:00 AM – 12:00 PM</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLunchSlot(12)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                          lunchSlot === 12
                            ? 'border-amber-500/50 bg-amber-500/20 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/40 shadow-sm backdrop-blur-md'
                            : 'glass-surface text-slate-600 dark:text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span>🍱</span>
                        <span>12:00 PM – 1:00 PM</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={isUpdating} className="btn-glass-primary px-5 py-2 text-xs font-bold rounded-xl shadow-lg">
                    {isUpdating ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* ROLE-SPECIFIC WORKSPACE OVERVIEW */}
            {role === 'leader' && (
              <div className="glass-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <RadioIcon className="h-4 w-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Team Leader Projects &amp; Teams</h3>
                  </div>
                  <Badge tone="blue">Lead Workspace</Badge>
                </div>

                {/* STATS TILES */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass-surface rounded-xl p-3.5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Assigned Projects</p>
                    <p className="mt-1 text-base font-extrabold text-purple-600 dark:text-purple-400">
                      {displayProjects.length} {displayProjects.length === 1 ? 'Project' : 'Projects'}
                    </p>
                  </div>
                  <div className="glass-surface rounded-xl p-3.5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Assigned Teams</p>
                    <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {teams.length || (user?.teamName ? 1 : 0)} {teams.length === 1 ? 'Team' : 'Teams'}
                    </p>
                  </div>
                  <div className="glass-surface rounded-xl p-3.5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Supervised Developers</p>
                    <p className="mt-1 text-base font-extrabold text-blue-500 dark:text-blue-400">
                      {supervisedDevCount} Devs
                    </p>
                  </div>
                </div>

                {/* CAPABILITIES CALLOUT */}
                <div className="rounded-2xl border border-blue-300/80 dark:border-blue-500/40 bg-blue-50/60 dark:bg-[#121d33]/90 p-4 text-xs text-blue-950 dark:text-blue-100 space-y-1 shadow-xs ring-1 ring-blue-500/15">
                  <p className="font-black flex items-center gap-1.5 text-blue-950 dark:text-white">
                    <SparklesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Team Leader Capabilities
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    As a Team Leader, you monitor hourly check-ins on the <strong className="text-slate-900 dark:text-white">Live Dashboard</strong>, inspect unsubmitted attendance and pending works on the <strong className="text-slate-900 dark:text-white">Team Calendar</strong>, review code proofs in <strong className="text-slate-900 dark:text-white">Log Approvals</strong>, and assign targeted feedback tasks.
                  </p>
                </div>
              </div>
            )}

            {role === 'manager' && (
              <div className="glass-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="h-4 w-4 text-purple-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Manager Projects &amp; Teams</h3>
                  </div>
                  <Badge tone="purple">Manager Workspace</Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="glass-surface rounded-xl p-3.5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Managed Projects</p>
                    <p className="mt-1 text-base font-extrabold text-purple-600 dark:text-purple-400">
                      {displayProjects.length} {displayProjects.length === 1 ? 'Project' : 'Projects'}
                    </p>
                  </div>
                  <div className="glass-surface rounded-xl p-3.5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Teams</p>
                    <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                      {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
                    </p>
                  </div>
                  <div className="glass-surface rounded-xl p-3.5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Developers</p>
                    <p className="mt-1 text-base font-extrabold text-blue-500 dark:text-blue-400">
                      {directory.filter((u: any) => u.role === 'developer').length || supervisedDevCount} Devs
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-300/80 dark:border-purple-500/40 bg-purple-50/60 dark:bg-[#221533]/90 p-4 text-xs text-purple-950 dark:text-purple-100 space-y-1 shadow-xs ring-1 ring-purple-500/15">
                  <p className="font-black flex items-center gap-1.5 text-purple-950 dark:text-white">
                    <LayersIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Project Manager Capabilities
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    As a Project Manager, you create projects and track module delivery in <strong className="text-slate-900 dark:text-white">My Projects</strong>, assign team leaders and developers in <strong className="text-slate-900 dark:text-white">Manage Teams</strong>, inspect high-level milestones in <strong className="text-slate-900 dark:text-white">Project Overview</strong>, and triage system alerts.
                  </p>
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="glass-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ActivityIcon className="h-4 w-4 text-rose-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Administrator Responsibilities</h3>
                  </div>
                  <Badge tone="red">System Owner</Badge>
                </div>

                <div className="rounded-2xl border border-rose-300/80 dark:border-rose-500/40 bg-rose-50/60 dark:bg-[#2c131a]/90 p-4 text-xs text-rose-950 dark:text-rose-100 space-y-1 shadow-xs ring-1 ring-rose-500/15">
                  <p className="font-black text-rose-950 dark:text-white">Full Platform Access</p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    As an Administrator, you manage accounts in <strong className="text-slate-900 dark:text-white">User Management</strong>, inspect company-wide productivity metrics in <strong className="text-slate-900 dark:text-white">Employee Performance</strong>, and configure work policies in <strong className="text-slate-900 dark:text-white">Settings</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}