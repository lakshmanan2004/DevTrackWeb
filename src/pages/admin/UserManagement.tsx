import React, { useState } from 'react';
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react';
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

  const visible = managedUsers.
  filter((user: any) => {
    if (filter === 'all') return true;
    if (filter === 'active') return user.active;
    if (filter === 'inactive') return !user.active;
    return user.role === filter;
  }).
  filter(
    (user: any) =>
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.email.toLowerCase().includes(query.toLowerCase())
  );

  const roleCount = (role: string) => managedUsers.filter((u: any) => u.role === role).length;

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
      refetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (user: any) => {
    await api(`/api/users/${user.id}`, { method: 'PATCH', body: { active: !user.active } });
    refetch();
  };

  const changeRole = async (user: any, role: Role) => {
    await api(`/api/users/${user.id}`, { method: 'PATCH', body: { role } });
    refetch();
  };

  const deleteUser = async (user: any) => {
    await api(`/api/users/${user.id}`, { method: 'DELETE' });
    refetch();
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
            <span className="font-bold text-navy">{roleCount('developer')} Developers</span> ·{' '}
            <span className="font-bold text-navy">{roleCount('leader')} Leads</span> ·{' '}
            <span className="font-bold text-navy">{roleCount('manager')} Managers</span> ·{' '}
            <span className="font-bold text-navy">{roleCount('admin')} Admins</span> ·{' '}
            <span className="text-amber-600 font-bold">{managedUsers.filter((u: any) => !u.active).length} Inactive</span>
          </p>
        </div>

        <FilterPills
          ariaLabel="Filter users"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All Users', count: managedUsers.length },
            { id: 'developer', label: 'Developer', count: roleCount('developer') },
            { id: 'leader', label: 'Team Leader', count: roleCount('leader') },
            { id: 'manager', label: 'Project Manager', count: roleCount('manager') },
            { id: 'active', label: 'Active', count: managedUsers.filter((u: any) => u.active).length },
            { id: 'inactive', label: 'Inactive', count: managedUsers.filter((u: any) => !u.active).length }
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
                  <tr key={user.id} className={`transition-colors hover:bg-white/40 ${user.active ? '' : 'bg-slate-50/30 opacity-75'}`}>
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
                      <div className="w-40">
                        <Select
                          size="sm"
                          fullWidth
                          value={user.role}
                          onChange={(val) => changeRole(user, val as Role)}
                          options={Object.keys(roleLabels).map((r) => ({
                            value: r,
                            label: roleLabels[r]
                          }))}
                        />
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
                      <div className="inline-flex gap-2">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md"
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
    </>);

}
