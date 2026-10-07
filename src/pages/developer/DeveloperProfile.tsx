import React, { useState } from 'react';
import {
  CheckCircle2Icon,
  FolderIcon,
  GithubIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
  UsersIcon,
  XCircleIcon } from
'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Banner } from '../../components/ui/Banner';
import { TaskStatusBadge } from '../../components/ui/TaskStatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useLive } from '../../hooks/useLive';
import { api } from '../../api/client';
import { UtensilsIcon } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export function DeveloperProfile() {
  const { user, refresh } = useAuth();
  const { data: logData } = useLive<any>('/api/logs', ['log:new'], 30000);
  const [name, setName] = useState(user?.name || '');
  const [github, setGithub] = useState(user?.github || '');
  const [lunchSlot, setLunchSlot] = useState<number>(user?.lunchSlot || 12);
  const [saved, setSaved] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const logs = logData?.logs || [];
  const stats = logData?.stats;
  const recentActivity = logs.slice(-5).reverse().map((log: any) => ({
    date: log.submittedAtISO ? new Date(log.submittedAtISO).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '',
    task: log.task,
    status: log.status,
    onTime: log.review === 'approved'
  }));

  const weekStats = [
    { label: 'Active', value: stats ? `${Math.floor(stats.activeMinutes / 60)}h ${String(stats.activeMinutes % 60).padStart(2, '0')}m` : '—' },
    { label: 'Logs', value: String(logs.length) },
    { label: 'Missed', value: String(stats?.missed ?? 0) },
    { label: 'Slots covered', value: stats ? `${stats.hoursCovered}/${stats.slotsSoFar}` : '—' }
  ];

  const saveProfile = async () => {
    await api('/api/users/profile', { method: 'PATCH', body: { name, github, lunchSlot } }).catch(() => null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  };

  const changePassword = async () => {
    setPasswordMessage('');
    try {
      await api('/api/users/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword }
      });
      setPasswordMessage('Password updated ✓');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        setPasswordMessage('');
        setShowPasswordForm(false);
      }, 2000);
    } catch (err: any) {
      setPasswordMessage(err.message || 'Failed to change password');
    }
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Visible to you and your Team Leader only" />

      <div className="flex-1 p-6">
        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="glass-card rounded-3xl p-5 text-center shadow-glass">
              <Avatar initials={user?.initials || '··'} size="lg" className="mx-auto" />
              <h2 className="mt-3 text-xl font-bold text-navy dark:text-white">{user?.name}</h2>
              <div className="mt-2 flex justify-center gap-2">
                <Badge tone="blue">Developer</Badge>
                <Badge tone="grey">{user?.teamName}</Badge>
              </div>

              <dl className="mt-5 space-y-2.5 text-left text-sm">
                {[
                { icon: <MailIcon className="h-4 w-4" />, label: 'Email', value: user?.email || '' },
                { icon: <UsersIcon className="h-4 w-4" />, label: 'Team', value: user?.teamName || '' },
                { icon: <GithubIcon className="h-4 w-4" />, label: 'GitHub', value: user?.github || 'not linked' },
                { icon: <FolderIcon className="h-4 w-4" />, label: 'Project', value: user?.projectName || '' },
                { icon: <ShieldCheckIcon className="h-4 w-4" />, label: 'Team Leader', value: user?.leaderName || '' },
                { icon: <UtensilsIcon className="h-4 w-4" />, label: 'Lunch Break', value: (user?.lunchSlot || lunchSlot) === 11 ? '11:00 AM – 12:00 PM' : '12:00 PM – 1:00 PM' }].
                map((row) =>
                <div key={row.label} className="flex items-center gap-2.5">
                    <span className="text-gray-400 dark:text-slate-500" aria-hidden="true">
                      {row.icon}
                    </span>
                    <dt className="sr-only">{row.label}</dt>
                    <dd className="truncate text-gray-600 dark:text-slate-300 font-medium">{row.value}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="glass-card rounded-3xl p-5 shadow-glass">
              <h3 className="text-sm font-bold text-navy dark:text-white">Today</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                {weekStats.map((stat) =>
                <div key={stat.label} className="rounded-2xl border border-hairline bg-canvas p-3">
                    <dt className="text-xs text-gray-500 dark:text-slate-400">{stat.label}</dt>
                    <dd className="mt-0.5 text-base font-bold tabular-nums text-navy dark:text-white">{stat.value}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4">
                {!showPasswordForm ? (
                  <Button variant="secondary" fullWidth icon={<LockIcon className="h-4 w-4" />} onClick={() => setShowPasswordForm(true)}>
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-2.5">
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="glass-input h-10 w-full px-3 text-sm text-navy dark:text-white" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      className="glass-input h-10 w-full px-3 text-sm text-navy dark:text-white" />
                    {passwordMessage && (
                      <p className={`text-xs font-semibold ${passwordMessage.includes('✓') ? 'text-green-600 dark:text-emerald-400' : 'text-danger dark:text-rose-400'}`}>
                        {passwordMessage}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button fullWidth onClick={changePassword} disabled={!currentPassword || newPassword.length < 6}>
                        Save Password
                      </Button>
                      <Button variant="secondary" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </aside>

          <div className="space-y-5">
            <section className="glass-card rounded-3xl p-6 shadow-glass">
              <h2 className="text-sm font-bold text-navy dark:text-white">Account Settings</h2>
              <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
                <div>
                  <label htmlFor="p-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <input
                    id="p-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input h-10 w-full px-3 text-sm text-navy dark:text-white font-semibold" />
                </div>
                <div>
                  <label htmlFor="p-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    id="p-email"
                    disabled
                    value={user?.email || ''}
                    className="h-10 w-full rounded-xl border border-hairline bg-slate-100/60 dark:bg-slate-900/40 px-3 text-sm text-gray-500 dark:text-slate-400" />
                </div>
                <div>
                  <label htmlFor="p-team" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Team
                  </label>
                  <input
                    id="p-team"
                    disabled
                    value={user?.teamName || ''}
                    className="h-10 w-full rounded-xl border border-hairline bg-slate-100/60 dark:bg-slate-900/40 px-3 text-sm text-gray-500 dark:text-slate-400" />
                </div>
                <div>
                  <label htmlFor="p-github" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    GitHub Username
                  </label>
                  <input
                    id="p-github"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="glass-input h-10 w-full px-3 text-sm text-navy dark:text-white font-semibold" />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Lunch Break Time Slot
                  </label>
                  <p className="mb-2 text-xs text-gray-500 dark:text-slate-400">
                    Select your preferred lunch break hour. Check-ins and submission reminders will not be requested during this slot.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setLunchSlot(11)}
                      className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        lunchSlot === 11
                          ? 'border-amber-400 bg-amber-500/20 text-amber-950 dark:text-amber-200 ring-2 ring-amber-400/40 shadow-sm'
                          : 'border-hairline bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>🍱</span>
                      <span>11:00 AM – 12:00 PM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLunchSlot(12)}
                      className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        lunchSlot === 12
                          ? 'border-amber-400 bg-amber-500/20 text-amber-950 dark:text-amber-200 ring-2 ring-amber-400/40 shadow-sm'
                          : 'border-hairline bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>🍱</span>
                      <span>12:00 PM – 1:00 PM</span>
                    </button>
                  </div>
                </div>

                {/* Interface Theme Preference */}
                <div className="sm:col-span-2 pt-2 border-t border-hairline">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Interface Theme
                  </label>
                  <div className="flex items-center justify-between rounded-2xl border border-hairline bg-slate-50/50 dark:bg-slate-800/40 p-3.5">
                    <div>
                      <p className="text-xs font-bold text-navy dark:text-white">Appearance Mode</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">Choose between Liquid Glass Light and Midnight Dark modes</p>
                    </div>
                    <ThemeToggle variant="pill" />
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center gap-3">
                  <Button type="submit">Save Changes</Button>
                  {saved && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Saved ✓</span>}
                </div>
              </form>
            </section>

            <section className="glass-card rounded-3xl p-6 shadow-glass">
              <h2 className="border-b border-hairline pb-3 text-sm font-bold text-navy dark:text-white">
                Recent Activity
              </h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline text-xs uppercase tracking-wide text-gray-500">
                    <th scope="col" className="px-5 py-2.5 font-semibold">Time</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Task</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-semibold">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentActivity.map((row: any, index: number) =>
                  <tr key={`${row.task}-${index}`}>
                      <td className="whitespace-nowrap px-5 py-3 text-gray-500">{row.date}</td>
                      <td className="px-3 py-3 font-medium text-navy">{row.task}</td>
                      <td className="px-3 py-3">
                        <TaskStatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-semibold ${row.onTime ? 'text-green-600' : 'text-amber-600'}`}>
                          {row.onTime ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  )}
                  {recentActivity.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-xs text-gray-500">
                        No activity yet today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="glass-card rounded-3xl p-6 shadow-glass">
              <h2 className="text-sm font-bold text-navy dark:text-white">GitHub Integration</h2>

              <div className="mt-3 flex gap-2.5 rounded-2xl border border-emerald-300/80 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 px-4 py-3 shadow-glass">
                <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-emerald-950 dark:text-emerald-200 font-medium">
                  Save your GitHub username to attach commit links to your work logs
                </p>
              </div>

              {user?.github ?
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-hairline bg-canvas p-4">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-glass">
                    <GithubIcon className="h-4 w-4 text-navy dark:text-white" aria-hidden="true" />
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <p className="inline-flex items-center gap-1.5 text-sm font-bold text-navy dark:text-white">
                      <CheckCircle2Icon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                      Connected as https://github.com/{user.github}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Change it any time from Account Settings above.</p>
                  </div>
                  <button
                  type="button"
                  onClick={async () => {
                    await api('/api/users/profile', { method: 'PATCH', body: { github: '' } });
                    setGithub('');
                    refresh();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer">
                    <XCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    Disconnect
                  </button>
                </div> :

              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-hairline bg-canvas p-4">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-glass">
                    <GithubIcon className="h-4 w-4 text-gray-400 dark:text-slate-500" aria-hidden="true" />
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <p className="text-sm font-bold text-gray-500 dark:text-slate-400">Not connected</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                      Enter your GitHub username in Account Settings and hit Save Changes.
                    </p>
                  </div>
                </div>
              }
            </section>

            <Banner tone="blue" icon={<ShieldCheckIcon className="h-4 w-4" />}>
              Your data is visible only to you and your Team Leader. Other developers cannot see your
              data under any circumstances.
            </Banner>
          </div>
        </div>
      </div>
    </>);
}
