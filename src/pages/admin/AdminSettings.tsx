import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon, CalendarIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { useLive } from '../../hooks/useLive';
import { api } from '../../api/client';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function AdminSettings() {
  const { data, refetch } = useLive<{ settings: any }>('/api/settings', ['setting:update'], 0);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(16);
  const [interval, setIntervalState] = useState(60);
  const [minWords, setMinWords] = useState(30);
  const [grace, setGrace] = useState(10);
  const [idle, setIdle] = useState(10);
  const [batch, setBatch] = useState(3);
  const [toggles, setToggles] = useState({
    push: true,
    sound: true,
    email: true,
    autoReject: false
  });
  const [saved, setSaved] = useState(false);

  // Holidays state
  const [holidays, setHolidays] = useState<{ date: string; name: string; type: string; isWorkingOverride?: boolean }[]>([]);
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolName, setNewHolName] = useState('');
  const [newHolType, setNewHolType] = useState('org');
  const [isOverride, setIsOverride] = useState(false);

  // Admin password safety states
  const [currentPassword, setCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passBusy, setPassBusy] = useState(false);

  useEffect(() => {
    const s = data?.settings;
    if (s) {
      setWorkingDays(s.workDays || [1, 2, 3, 4, 5]);
      setStartHour(s.workStartHour || 8);
      setEndHour(s.workEndHour || 16);
      setIntervalState(s.intervalMinutes || 60);
      setMinWords(s.minWords || 30);
      setGrace(s.graceMinutes || 10);
      setIdle(s.idleMinutes || 10);
      setBatch(s.batchThreshold || 3);
      if (s.notifications) setToggles(s.notifications);
      if (Array.isArray(s.holidays)) setHolidays(s.holidays);
    }
  }, [data]);

  const toggleDay = (day: string) => {
    const idx = dayIndex[day];
    setWorkingDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
    );
  };

  const save = async () => {
    await api('/api/settings', {
      method: 'PUT',
      body: {
        workStartHour: startHour,
        workEndHour: endHour,
        workDays: workingDays,
        intervalMinutes: interval,
        minWords,
        graceMinutes: grace,
        idleMinutes: idle,
        batchThreshold: batch,
        notifications: toggles,
        holidays
      }
    });
    setSaved(true);
    refetch();
    setTimeout(() => setSaved(false), 2500);
  };

  const saveHolidays = async (nextHolidays: { date: string; name: string; type: string; isWorkingOverride?: boolean }[]) => {
    setHolidays(nextHolidays);
    try {
      const res = await api<{ settings: any }>('/api/settings', {
        method: 'PUT',
        body: { holidays: nextHolidays }
      });
      if (res?.settings?.holidays) {
        setHolidays(res.settings.holidays);
      }
      refetch();
    } catch (err: any) {
      console.error('Failed to save holidays:', err);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolDate) return;
    const newEntry = {
      date: newHolDate,
      name: newHolName || (isOverride ? 'Working Override' : 'Organization Holiday'),
      type: newHolType,
      isWorkingOverride: isOverride
    };
    const next = [...holidays.filter((h) => h.date !== newHolDate), newEntry];
    setNewHolDate('');
    setNewHolName('');
    setIsOverride(false);
    try {
      await api('/api/settings/holidays', {
        method: 'POST',
        body: newEntry
      });
      setHolidays(next);
      refetch();
    } catch {
      await saveHolidays(next);
    }
  };

  const handleRemoveHoliday = async (dateStr: string) => {
    const next = holidays.filter((h) => h.date !== dateStr);
    try {
      await api(`/api/settings/holidays/${dateStr}`, {
        method: 'DELETE'
      });
      setHolidays(next);
      refetch();
    } catch {
      await saveHolidays(next);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (adminNewPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }
    if (adminNewPassword.length < 6) {
      setPassError('New password must be at least 6 characters long');
      return;
    }
    setPassBusy(true);
    try {
      await api('/api/users/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword: adminNewPassword }
      });
      setPassSuccess('Admin password updated successfully ✓');
      setCurrentPassword('');
      setAdminNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(''), 3000);
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password');
    } finally {
      setPassBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="System Settings" subtitle="Applies to every team and project in DevTrack — saved to the server" />

      <div className="flex-1 p-6">
        <div className="max-w-5xl space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
              <h2 className="text-sm font-bold text-navy">Working Hours</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-start" className="mb-1.5 block text-sm font-medium text-navy">
                    Start hour
                  </label>
                  <select
                    id="s-start"
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-navy">
                    {[6, 7, 8, 9, 10].map((h) => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="s-end" className="mb-1.5 block text-sm font-medium text-navy">
                    End hour
                  </label>
                  <select
                    id="s-end"
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-navy">
                    {[14, 15, 16, 17, 18].map((h) => <option key={h} value={h}>{h}:30</option>)}
                  </select>
                </div>
              </div>
              <fieldset className="mt-4">
                <legend className="mb-2 text-sm font-medium text-navy">Working days</legend>
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => {
                    const on = workingDays.includes(dayIndex[day]);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDay(day)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors duration-150 ease-out ${
                        on ?
                        'border-brand bg-brand-soft text-brand' :
                        'border-hairline bg-white text-gray-500 hover:bg-gray-50'}`
                        }>
                        {day}
                      </button>);
                  })}
                </div>
              </fieldset>
            </section>

            <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
              <h2 className="text-sm font-bold text-navy">Check-in Rules</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="s-interval" className="font-medium text-navy">
                      Check-in interval
                    </label>
                    <span className="font-bold tabular-nums text-navy">{interval} min</span>
                  </div>
                  <input
                    id="s-interval"
                    type="range"
                    min={30}
                    max={120}
                    step={15}
                    value={interval}
                    onChange={(event) => setIntervalState(Number(event.target.value))}
                    className="mt-2 w-full accent-blue-600" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                  { id: 's-words', label: 'Min description words', value: minWords, set: setMinWords },
                  { id: 's-grace', label: 'Grace period (min)', value: grace, set: setGrace },
                  { id: 's-idle', label: 'Idle timeout (min)', value: idle, set: setIdle },
                  { id: 's-batch', label: 'Batch threshold (logs/10 min)', value: batch, set: setBatch }].
                  map((field) =>
                  <div key={field.id}>
                      <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-navy">
                        {field.label}
                      </label>
                      <input
                      id={field.id}
                      type="number"
                      value={field.value}
                      onChange={(event) => field.set(Number(event.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline px-3 text-sm tabular-nums text-navy" />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
              <h2 className="text-sm font-bold text-navy">Notifications</h2>
              <div className="mt-2 divide-y divide-gray-100">
                <Toggle
                  label="Push notifications"
                  description="Browser reminders before each check-in"
                  checked={toggles.push}
                  onChange={(next) => setToggles((prev) => ({ ...prev, push: next }))} />
                <Toggle
                  label="Sound alerts"
                  checked={toggles.sound}
                  onChange={(next) => setToggles((prev) => ({ ...prev, sound: next }))} />
                <Toggle
                  label="Email alerts"
                  description="Daily digest to Team Leaders"
                  checked={toggles.email}
                  onChange={(next) => setToggles((prev) => ({ ...prev, email: next }))} />
                <Toggle
                  label="Auto-reject batch submissions"
                  description="Reject without leader review"
                  checked={toggles.autoReject}
                  onChange={(next) => setToggles((prev) => ({ ...prev, autoReject: next }))} />
              </div>
            </section>

            {/* ADMIN ACCOUNT SAFETY & SECURITY */}
            <section className="rounded-card border border-hairline bg-white p-5 shadow-card space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-brand" />
                <h2 className="text-sm font-bold text-navy">Admin Account Security</h2>
              </div>
              <p className="text-xs text-gray-500">
                Change your Admin password for safety. Note: Newly created accounts default to password <strong className="text-navy">welcome</strong>.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-3 pt-1" autoComplete="off">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-navy">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-9 w-full rounded-lg border border-hairline px-3 text-xs text-navy"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-navy">New Password</label>
                    <input
                      type="password"
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="h-9 w-full rounded-lg border border-hairline px-3 text-xs text-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-navy">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="h-9 w-full rounded-lg border border-hairline px-3 text-xs text-navy"
                    />
                  </div>
                </div>
                {passError && <p className="text-xs font-semibold text-danger">{passError}</p>}
                {passSuccess && <p className="text-xs font-semibold text-emerald-600">{passSuccess}</p>}
                <Button size="sm" type="submit" disabled={passBusy || !currentPassword || !adminNewPassword}>
                  {passBusy ? 'Updating Password…' : 'Update Admin Password'}
                </Button>
              </form>
            </section>

            {/* HOLIDAYS & 3RD SATURDAY MANAGEMENT */}
            <section className="col-span-full rounded-card border border-hairline bg-white p-5 shadow-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-amber-600" />
                  <div>
                    <h2 className="text-sm font-bold text-navy">Holidays & 3rd Saturday Management</h2>
                    <p className="text-xs text-gray-500">
                      Configure custom government/organization holidays or override a 3rd Saturday to be a working day when needed.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                  🗓️ Auto 3rd Saturday OFF Active
                </span>
              </div>

              {/* Upcoming 3rd Saturdays Interactive Management */}
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                    📅 3rd Saturday Schedule (Next 6 Months)
                  </h3>
                  <span className="text-[11px] text-amber-800 italic">
                    By default, 3rd Saturdays are holidays. Toggle any month to a Working Day when needed.
                  </span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {(() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const pad = (n: number) => String(n).padStart(2, '0');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const cards = [];

                    for (let i = 0; i < 6; i++) {
                      const targetDate = new Date(year, month + i, 1);
                      const targetYear = targetDate.getFullYear();
                      const targetMonth = targetDate.getMonth();

                      for (let d = 15; d <= 21; d++) {
                        const temp = new Date(targetYear, targetMonth, d);
                        if (temp.getDay() === 6) {
                          const dateStr = `${targetYear}-${pad(targetMonth + 1)}-${pad(d)}`;
                          const entry = holidays.find((h) => h.date === dateStr);
                          const isWorking = entry ? !!entry.isWorkingOverride : false;
                          const monthLabel = `${monthNames[targetMonth]} ${targetYear}`;

                          cards.push(
                            <div
                              key={dateStr}
                              className={`flex flex-col justify-between rounded-lg border p-3 shadow-xs transition-all ${
                                isWorking
                                  ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950'
                                  : 'border-amber-200 bg-white text-navy'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-500">{monthLabel}</span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                      isWorking ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900'
                                    }`}
                                  >
                                    {isWorking ? '💼 Working Day' : '🎉 Holiday'}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm font-black text-navy">{dateStr}</div>
                              </div>

                              <div className="mt-3">
                                {!isWorking ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const newEntry = {
                                        date: dateStr,
                                        name: `3rd Sat Working Day (${monthNames[targetMonth]})`,
                                        type: 'org',
                                        isWorkingOverride: true
                                      };
                                      const next = [...holidays.filter((h) => h.date !== dateStr), newEntry];
                                      await saveHolidays(next);
                                    }}
                                    className="w-full rounded-md border border-emerald-400 bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                                  >
                                    💼 Switch to Working Day
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveHoliday(dateStr)}
                                    className="w-full rounded-md border border-amber-300 bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-200 transition-colors"
                                  >
                                    Restore to Holiday
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                          break;
                        }
                      }
                    }
                    return cards;
                  })()}
                </div>
              </div>

              <form onSubmit={handleAddHoliday} className="grid gap-3 rounded-xl bg-slate-50/70 p-4 border border-hairline sm:grid-cols-4 items-end">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-navy">Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={newHolDate}
                    onChange={(e) => setNewHolDate(e.target.value)}
                    className="h-9 w-full rounded-lg border border-hairline bg-white px-3 text-xs text-navy"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-navy">Holiday Name / Note</label>
                  <input
                    type="text"
                    value={newHolName}
                    onChange={(e) => setNewHolName(e.target.value)}
                    placeholder="e.g. Gandhi Jayanti, Diwali"
                    className="h-9 w-full rounded-lg border border-hairline bg-white px-3 text-xs text-navy"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-navy">Type / Action</label>
                  <select
                    value={isOverride ? 'override' : newHolType}
                    onChange={(e) => {
                      if (e.target.value === 'override') {
                        setIsOverride(true);
                      } else {
                        setIsOverride(false);
                        setNewHolType(e.target.value);
                      }
                    }}
                    className="h-9 w-full rounded-lg border border-hairline bg-white px-3 text-xs text-navy font-semibold cursor-pointer"
                  >
                    <option value="org">Organization Holiday</option>
                    <option value="govt">Government Holiday</option>
                    <option value="override">Working Override (Force Working Day)</option>
                  </select>
                </div>
                <Button size="sm" type="submit" icon={<PlusIcon className="h-4 w-4" />}>
                  Add Holiday Entry
                </Button>
              </form>

              <div className="space-y-2 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Configured Custom Holiday & Override List</h3>
                {holidays.length === 0 ? (
                  <p className="text-xs text-gray-400 italic bg-canvas p-3 rounded-lg border border-hairline">
                    No custom holiday dates added yet. Automatic 3rd Saturday holidays are active system-wide.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {holidays.map((h) => (
                      <span
                        key={h.date}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xs ${
                          h.isWorkingOverride
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            : h.type === 'govt'
                            ? 'border-purple-300 bg-purple-50 text-purple-900'
                            : 'border-amber-300 bg-amber-50 text-amber-900'
                        }`}
                      >
                        <span>
                          {h.date} — {h.name} {h.isWorkingOverride ? '(Working Override 💼)' : `(${h.type === 'govt' ? 'Govt' : 'Org'} Holiday 🎉)`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHoliday(h.date)}
                          className="rounded p-0.5 hover:bg-black/10 transition-colors"
                          title="Remove"
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex items-center gap-3">
            <Button size="lg" onClick={save}>
              Save All Settings
            </Button>
            {saved && <span className="text-xs font-semibold text-green-600">Saved — rules apply immediately ✓</span>}
          </div>
        </div>
      </div>
    </>
  );
}
