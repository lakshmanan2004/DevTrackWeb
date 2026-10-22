import React, { useState } from 'react';
import {
  PlusIcon,
  SearchIcon,
  XIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  KeyIcon,
  RefreshCwIcon,
  CopyIcon,
  CheckIcon
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { FilterPills } from '../../components/ui/FilterPills';
import { Select } from '../../components/ui/Select';
import { useUsers } from '../../hooks/useLive';
import { api } from '../../api/client';
import { Role } from '../../types';

const avatarTone: Record<Role, 'blue' | 'purple' | 'red'> = {
  developer: 'blue',
  leader: 'blue',
  manager: 'purple',
  admin: 'red'
};

const roleLabels: Record<string, string> = {
  developer: 'Developer',
  leader: 'Team Leader',
  manager: 'Project Manager',
  admin: 'Admin'
};

export function UserManagement() {
  const { data, refetch } = useUsers();
  const managedUsers = data?.users || [];
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('developer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('devtrack@2026');
  const [resetBusy, setResetBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let res = 'DevTrack#';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPasswordVal(res);
  };

  const copyPassword = () => {
    navigator.clipboard?.writeText(resetPasswordVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetPassword = async () => {
    if (!resetModalUser) return;
    if (resetPasswordVal.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    const targetId = resetModalUser.id || resetModalUser._id;
    setResetBusy(true);
    try {
      await api(`/api/users/${targetId}/reset-password`, {
        method: 'POST',
        body: { newPassword: resetPasswordVal }
      });
      showToast(`Password successfully reset for ${resetModalUser.name} to: ${resetPasswordVal}`, 'success');
      setResetModalUser(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setResetBusy(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const roleCounts = React.useMemo(() => {
    let dev = 0, lead = 0, mgr = 0, adm = 0, inact = 0, act = 0;
    for (const u of managedUsers) {
      if (u.role === 'developer') dev++;
      else if (u.role === 'leader') lead++;
      else if (u.role === 'manager') mgr++;
      else if (u.role === 'admin') adm++;
      if (u.active) act++; else inact++;
    }
    return { dev, lead, mgr, adm, inact, act, all: managedUsers.length };
  }, [managedUsers]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return managedUsers.filter((user: any) => {
      if (filter === 'active' && !user.active) return false;
      if (filter === 'inactive' && user.active) return false;
      if (filter !== 'all' && filter !== 'active' && filter !== 'inactive' && user.role !== filter) return false;
      if (q) {
        const nameMatch = user.name?.toLowerCase().includes(q);
        const emailMatch = user.email?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [managedUsers, filter, query]);

  const createUser = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/api/users', {
        method: 'POST',
        body: { name: newName, email: newEmail, password: newPassword, role: newRole }
      });
      setModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewRole('developer');
      showToast('User created successfully!', 'success');
      refetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (user: any) => {
    const targetId = user.id || user._id;
    try {
      await api(`/api/users/${targetId}`, { method: 'PATCH', body: { active: !user.active } });
      showToast(`${user.name} has been ${!user.active ? 'activated' : 'deactivated'}.`, 'success');
      refetch();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status.', 'error');
    }
  };

  const changeRole = async (user: any, role: Role) => {
    if (user.role === role) return;
    const targetId = user.id || user._id;
    setUpdatingId(targetId);
    try {
      await api(`/api/users/${targetId}`, { method: 'PATCH', body: { role } });
      showToast(`Role updated for ${user.name} to ${roleLabels[role] || role}.`, 'success');
      refetch();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteUser = async (user: any) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This cannot be undone.`)) return;
    const targetId = user.id || user._id;
    try {
      await api(`/api/users/${targetId}`, { method: 'DELETE' });
      showToast(`${user.name} deleted successfully.`, 'success');
      refetch();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user.', 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Add or remove users and assign roles"
        actions={
        <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            Add User
          </Button>
        } />


      <div className="flex-1 space-y-6 p-6">
        {toast && (
          <div
            className={`flex items-center justify-between gap-3 rounded-2xl p-4 text-xs font-bold shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900/40'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'error' ? (
                <AlertCircleIcon className="h-4 w-4 text-rose-500 shrink-0" />
              ) : (
                <CheckCircle2Icon className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true" />
            <span className="sr-only">Search users</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email..."
              className="glass-input h-10 w-80 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400" />
          </label>
          <p className="text-xs text-slate-500 font-medium">
            <span className="font-bold text-navy">{roleCounts.dev} Developers</span> ·{' '}
            <span className="font-bold text-navy">{roleCounts.lead} Leads</span> ·{' '}
            <span className="font-bold text-navy">{roleCounts.mgr} Managers</span> ·{' '}
            <span className="font-bold text-navy">{roleCounts.adm} Admins</span> ·{' '}
            <span className="text-amber-600 font-bold">{roleCounts.inact} Inactive</span>
          </p>
        </div>

        <FilterPills
          ariaLabel="Filter users"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All Users', count: roleCounts.all },
            { id: 'developer', label: 'Developer', count: roleCounts.dev },
            { id: 'leader', label: 'Team Leader', count: roleCounts.lead },
            { id: 'manager', label: 'Project Manager', count: roleCounts.mgr },
            { id: 'active', label: 'Active', count: roleCounts.act },
            { id: 'inactive', label: 'Inactive', count: roleCounts.inact }
          ]}
        />

        <section className="glass-card overflow-hidden rounded-3xl border border-white/80 p-0 shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th scope="col" className="px-6 py-4 font-bold">User</th>
                  <th scope="col" className="px-4 py-4 font-bold">Email</th>
                  <th scope="col" className="px-4 py-4 font-bold">Role</th>
                  <th scope="col" className="px-4 py-4 font-bold">Status</th>
                  <th scope="col" className="px-4 py-4 font-bold">Joined</th>
                  <th scope="col" className="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {visible.map((user: any) => (
                  <tr key={user.id || user._id} className={`transition-colors hover:bg-white/40 ${user.active ? '' : 'bg-slate-50/30 opacity-75'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={user.initials}
                          size="sm"
                          tone={user.active ? avatarTone[user.role as Role] : 'grey'}
                        />
                        <span className="font-bold text-navy">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-medium">{user.email}</td>
                    <td className="px-4 py-4">
                      <div className="w-40 relative">
                        <Select
                          size="sm"
                          fullWidth
                          disabled={updatingId === (user.id || user._id)}
                          value={user.role}
                          onChange={(val) => changeRole(user, val as Role)}
                          options={Object.keys(roleLabels).map((r) => ({
                            value: r,
                            label: roleLabels[r]
                          }))}
                        />
                        {updatingId === (user.id || user._id) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 rounded-xl backdrop-blur-2xs">
                            <Loader2Icon className="h-4 w-4 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                          user.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${user.active ? 'bg-emerald-500 ring-2 ring-emerald-400/30' : 'bg-slate-400'}`}
                          aria-hidden="true"
                        />
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500 font-medium">{user.joined}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setResetModalUser(user);
                            setResetPasswordVal('devtrack@2026');
                            setCopied(false);
                          }}
                          icon={<KeyIcon className="h-3.5 w-3.5 text-amber-500" />}
                          title="Reset User Password"
                          className="hover:bg-amber-500/10 text-slate-600 dark:text-slate-300"
                        >
                          Reset Pass
                        </Button>
                        {user.active ? (
                          <Button size="sm" variant="danger" onClick={() => toggleActive(user)}>
                            Deactivate
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="success" onClick={() => toggleActive(user)}>
                              Activate
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => deleteUser(user)}>
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm font-medium text-slate-400">
                      No users match the search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modalOpen && (
        <div
          className="glass-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-user-title"
        >
          <div className="glass-modal w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <h2 id="add-user-title" className="text-base font-black text-navy">
                Add New User
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close add user dialog"
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <form className="space-y-4 pt-4" autoComplete="off" onSubmit={(e) => { e.preventDefault(); createUser(); }}>
              <div>
                <label htmlFor="au-name" className="mb-1.5 block text-xs font-bold text-navy">
                  Full Name
                </label>
                <input
                  id="au-name"
                  name="new_full_name"
                  autoComplete="off"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Meena R"
                  className="glass-input h-10 w-full px-3.5 text-xs font-medium text-navy placeholder:text-slate-400"
                />
              </div>
              <div>
                <label htmlFor="au-email" className="mb-1.5 block text-xs font-bold text-navy">
                  Email
                </label>
                <input
                  id="au-email"
                  type="email"
                  name="new_user_email"
                  autoComplete="off"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="meena@college.edu"
                  className="glass-input h-10 w-full px-3.5 text-xs font-medium text-navy placeholder:text-slate-400"
                />
              </div>
              <div>
                <label htmlFor="au-pass" className="mb-1.5 block text-xs font-bold text-navy">
                  Temporary Password (Default: welcome)
                </label>
                <input
                  id="au-pass"
                  type="password"
                  name="new_user_password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Defaults to welcome"
                  className="glass-input h-10 w-full px-3.5 text-xs font-medium text-navy placeholder:text-slate-400"
                />
              </div>
              <div>
                <Select
                  label="Role"
                  size="lg"
                  fullWidth
                  value={newRole}
                  onChange={(val) => setNewRole(val as Role)}
                  options={[
                    { value: 'developer', label: 'Developer', tone: 'blue' },
                    { value: 'leader', label: 'Team Leader', tone: 'purple' },
                    { value: 'manager', label: 'Project Manager', tone: 'purple' },
                    { value: 'admin', label: 'Admin', tone: 'red' }
                  ]}
                />
              </div>
              {error && <p className="text-xs font-bold text-red-500">{error}</p>}
              <Button type="submit" fullWidth size="lg" disabled={busy || !newName || !newEmail}>
                {busy ? 'Creating…' : 'Create Account'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {resetModalUser && (
        <div
          className="glass-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-pass-title"
        >
          <div className="glass-modal w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <KeyIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="reset-pass-title" className="text-base font-black text-navy dark:text-white">
                    Reset User Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set a temporary password for {resetModalUser.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                  <span>User:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{resetModalUser.name}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                  <span>Email:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{resetModalUser.email}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                  <span>Role:</span>
                  <span className="font-bold text-blue-600 dark:text-sky-400 uppercase tracking-wider text-[10px]">
                    {resetModalUser.role}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="temp-pass-input" className="text-xs font-bold text-navy dark:text-white">
                    New Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    <RefreshCwIcon className="h-3 w-3" /> Generate Random
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="temp-pass-input"
                    type="text"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="glass-input h-10 w-full pl-3 pr-20 text-xs font-mono font-bold text-navy dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="absolute right-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <CheckIcon className="h-3 w-3 text-emerald-500" /> : <CopyIcon className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Provide this password to the user. They can change it in their Profile once signed in.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setResetModalUser(null)}
                  disabled={resetBusy}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleResetPassword}
                  disabled={resetBusy || resetPasswordVal.length < 6}
                >
                  {resetBusy ? 'Saving…' : 'Save & Reset Password'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>);

}
