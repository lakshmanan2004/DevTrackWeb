import React, { useState } from 'react';
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { FilterPills } from '../../components/ui/FilterPills';
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


      <div className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true" />
            <span className="sr-only">Search users</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email..."
              className="h-9 w-72 rounded-lg border border-hairline bg-white pl-9 pr-3 text-sm text-navy placeholder:text-gray-400" />
          </label>
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-navy">{roleCount('developer')} Developers</span> ·{' '}
            {roleCount('leader')} Team Leaders · {roleCount('manager')} Project Managers ·{' '}
            {roleCount('admin')} Admin · {managedUsers.filter((u: any) => !u.active).length} Inactive
          </p>
        </div>

        <FilterPills
          ariaLabel="Filter users"
          value={filter}
          onChange={setFilter}
          options={[
          { id: 'all', label: 'All', count: managedUsers.length },
          { id: 'developer', label: 'Developer', count: roleCount('developer') },
          { id: 'leader', label: 'Team Leader', count: roleCount('leader') },
          { id: 'manager', label: 'Project Manager', count: roleCount('manager') },
          { id: 'active', label: 'Active', count: managedUsers.filter((u: any) => u.active).length },
          { id: 'inactive', label: 'Inactive', count: managedUsers.filter((u: any) => !u.active).length }]
          } />


        <section className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-canvas text-xs uppercase tracking-wide text-gray-500">
                <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                <th scope="col" className="px-3 py-3 font-semibold">Email</th>
                <th scope="col" className="px-3 py-3 font-semibold">Role</th>
                <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                <th scope="col" className="px-3 py-3 font-semibold">Joined</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((user: any) =>
              <tr key={user.id} className={user.active ? '' : 'bg-gray-50'}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar
                      initials={user.initials}
                      size="sm"
                      tone={user.active ? avatarTone[user.role as Role] : 'grey'} />
                      <span className="font-semibold text-navy">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-gray-600">{user.email}</td>
                  <td className="px-3 py-3.5">
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user, e.target.value as Role)}
                      className="rounded-md border border-hairline bg-white px-2 py-1 text-xs font-semibold text-navy"
                    >
                      {Object.keys(roleLabels).map((r) => (
                        <option key={r} value={r}>{roleLabels[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    user.active ? 'text-green-600' : 'text-gray-500'}`
                    }>
                      <span
                      className={`h-2 w-2 rounded-full ${user.active ? 'bg-ok' : 'bg-offline'}`}
                      aria-hidden="true" />
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-gray-500">{user.joined}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex gap-2">
                      {user.active ?
                    <>
                          <Button size="sm" variant="danger" onClick={() => toggleActive(user)}>
                            Deactivate
                          </Button>
                        </> :

                    <>
                          <Button size="sm" variant="success" onClick={() => toggleActive(user)}>
                            Activate
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => deleteUser(user)}>
                            Delete
                          </Button>
                        </>
                    }
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {modalOpen &&
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h2 id="add-user-title" className="text-base font-bold text-navy">
                Add New User
              </h2>
              <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close add user dialog"
              className="rounded-md p-1.5 text-gray-400 transition-colors duration-150 ease-out hover:bg-gray-100 hover:text-gray-600">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <form className="space-y-4 px-5 py-5" autoComplete="off" onSubmit={(e) => { e.preventDefault(); createUser(); }}>
              <div>
                <label htmlFor="au-name" className="mb-1.5 block text-sm font-medium text-navy">
                  Full Name
                </label>
                <input
                id="au-name"
                name="new_full_name"
                autoComplete="off"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Meena R"
                className="h-10 w-full rounded-lg border border-hairline px-3 text-sm text-navy placeholder:text-gray-400" />
              </div>
              <div>
                <label htmlFor="au-email" className="mb-1.5 block text-sm font-medium text-navy">
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
                className="h-10 w-full rounded-lg border border-hairline px-3 text-sm text-navy placeholder:text-gray-400" />
              </div>
              <div>
                <label htmlFor="au-pass" className="mb-1.5 block text-sm font-medium text-navy">
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
                className="h-10 w-full rounded-lg border border-hairline px-3 text-sm text-navy placeholder:text-gray-400" />
              </div>
              <div>
                <label htmlFor="au-role" className="mb-1.5 block text-sm font-medium text-navy">
                  Role
                </label>
                <select
                id="au-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                className="h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-navy">
                  <option value="developer">Developer</option>
                  <option value="leader">Team Leader</option>
                  <option value="manager">Project Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-xs font-semibold text-danger">{error}</p>}
              <Button type="submit" fullWidth size="lg" disabled={busy || !newName || !newEmail}>
                {busy ? 'Creating…' : 'Create Account'}
              </Button>
            </form>
          </div>
        </div>
      }
    </>);

}
