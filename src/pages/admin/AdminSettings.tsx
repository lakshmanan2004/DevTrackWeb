import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon, CalendarIcon, PlusIcon, Trash2Icon, ListIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Select } from '../../components/ui/Select';
import { AdminHolidayCalendar } from '../../components/admin/AdminHolidayCalendar';
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
  const [holidayViewMode, setHolidayViewMode] = useState<'calendar' | 'list'>('calendar');
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
            <section className="glass-card rounded-3xl p-6 shadow-glass">
              <h2 className="text-sm font-bold text-navy dark:text-white">Working Hours</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Select
                    label="Start hour"
                    size="lg"
                    fullWidth
                    value={startHour}
                    onChange={(val) => setStartHour(Number(val))}
                    options={[6, 7, 8, 9, 10].map((h) => ({
                      value: h,
                      label: `${h}:00 AM`
                    }))}
                  />
                </div>
                <div>
                  <Select
                    label="End hour"
                    size="lg"
                    fullWidth
                    value={endHour}
                    onChange={(val) => setEndHour(Number(val))}
                    options={[14, 15, 16, 17, 18, 19, 20].map((h) => ({
                      value: h,
                      label: `${h > 12 ? h - 12 : h}:30 PM`
                    }))}
                  />
                </div>
              </div>
              <fieldset className="mt-4">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Working days</legend>
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => {
                    const on = workingDays.includes(dayIndex[day]);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDay(day)}
                        className={`rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                          on
                            ? 'btn-glass-primary !text-white border-transparent shadow-sm'
                            : 'glass-surface text-slate-600 dark:text-slate-400 hover:bg-slate-500/10'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            <section className="glass-card rounded-3xl p-6 shadow-glass">
              <h2 className="text-sm font-bold text-navy dark:text-white">Check-in Rules</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="s-interval" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Check-in interval
                    </label>
                    <span className="font-bold tabular-nums text-brand dark:text-indigo-400">{interval} min</span>
                  </div>
                  <input
                    id="s-interval"
                    type="range"
                    min={30}
                    max={120}
                    step={15}
                    value={interval}
                    onChange={(event) => setIntervalState(Number(event.target.value))}
                    className="mt-2 w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { id: 's-words', label: 'Min description words', value: minWords, set: setMinWords },
                    { id: 's-grace', label: 'Grace period (min)', value: grace, set: setGrace },
                    { id: 's-idle', label: 'Idle timeout (min)', value: idle, set: setIdle },
                    { id: 's-batch', label: 'Batch threshold (logs/10 min)', value: batch, set: setBatch }
                  ].map((field) => (
                    <div key={field.id}>
                      <label htmlFor={field.id} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        type="number"
                        value={field.value}
                        onChange={(event) => field.set(Number(event.target.value))}
                        className="glass-input h-10 w-full rounded-2xl px-3 text-xs tabular-nums font-semibold text-navy dark:text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="glass-card rounded-3xl p-6 shadow-glass">
              <h2 className="text-sm font-bold text-navy dark:text-white">Notifications</h2>
              <div className="mt-2 divide-y divide-hairline">
                <Toggle
                  label="Push notifications"
                  description="Browser reminders before each check-in"
                  checked={toggles.push}
                  onChange={(next) => setToggles((prev) => ({ ...prev, push: next }))}
                />
                <Toggle
                  label="Sound alerts"
                  checked={toggles.sound}
                  onChange={(next) => setToggles((prev) => ({ ...prev, sound: next }))}
                />
                <Toggle
                  label="Email alerts"
                  description="Daily digest to Team Leaders"
                  checked={toggles.email}
                  onChange={(next) => setToggles((prev) => ({ ...prev, email: next }))}
                />
                <Toggle
                  label="Auto-reject batch submissions"
                  description="Reject without leader review"
                  checked={toggles.autoReject}
                  onChange={(next) => setToggles((prev) => ({ ...prev, autoReject: next }))}
                />
              </div>
            </section>

            {/* ADMIN ACCOUNT SAFETY & SECURITY */}
            <section className="glass-card rounded-3xl p-6 shadow-glass space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-brand dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-navy dark:text-white">Admin Account Security</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Change your Admin password for safety. Note: Newly created accounts default to password <strong className="text-navy dark:text-white">welcome</strong>.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-3 pt-1" autoComplete="off">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="glass-input h-10 w-full rounded-2xl px-3 text-xs text-navy dark:text-white focus:outline-none"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">New Password</label>
                    <input
                      type="password"
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="glass-input h-10 w-full rounded-2xl px-3 text-xs text-navy dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="glass-input h-10 w-full rounded-2xl px-3 text-xs text-navy dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
                {passError && <p className="text-xs font-semibold text-rose-500 dark:text-rose-400">{passError}</p>}
                {passSuccess && <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">{passSuccess}</p>}
                <Button size="sm" type="submit" disabled={passBusy || !currentPassword || !adminNewPassword} className="btn-glass-primary !from-indigo-600 !to-violet-600 text-white font-bold border-none">
                  {passBusy ? 'Updating Password…' : 'Update Admin Password'}
                </Button>
              </form>
            </section>

            {/* HOLIDAYS & 3RD SATURDAY MANAGEMENT */}
            <section className="col-span-full glass-card rounded-3xl p-6 sm:p-7 shadow-glass space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-glass">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-navy dark:text-white">Holidays &amp; Working Calendar Management</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage organization holidays, government leaves, and working overrides on an interactive monthly calendar.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-200">
                    🗓️ Auto 3rd Sat OFF Active
                  </span>

                  {/* View Mode Switcher with Liquid Bubble */}
                  <SegmentedControl
                    size="sm"
                    options={[
                      { id: 'calendar', label: 'Calendar View', icon: <CalendarIcon className="h-3.5 w-3.5" /> },
                      { id: 'list', label: 'List View', icon: <ListIcon className="h-3.5 w-3.5" /> }
                    ]}
                    value={holidayViewMode}
                    onChange={(val) => setHolidayViewMode(val as 'calendar' | 'list')}
                  />
                </div>
              </div>

              {/* CALENDAR VIEW */}
              {holidayViewMode === 'calendar' ? (
                <AdminHolidayCalendar
                  holidays={holidays}
                  workDays={workingDays}
                  onSaveHolidays={saveHolidays}
                />
              ) : (
                /* LIST VIEW FALLBACK */
                <div className="space-y-4">
                  {/* Upcoming 3rd Saturdays Interactive Management */}
                  <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 dark:text-amber-200">
                        📅 3rd Saturday Schedule (Next 6 Months)
                      </h3>
                      <span className="text-[11px] text-amber-800 dark:text-amber-300 italic">
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
                                  className={`flex flex-col justify-between rounded-2xl border p-3.5 shadow-glass transition-all ${
                                    isWorking
                                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-950 dark:text-emerald-200'
                                      : 'glass-card'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{monthLabel}</span>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                          isWorking ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                        }`}
                                      >
                                        {isWorking ? '💼 Working Day' : '🎉 Holiday'}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm font-black text-navy dark:text-white">{dateStr}</div>
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
                                        className="w-full rounded-xl border border-emerald-500/30 bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                                      >
                                        💼 Switch to Working Day
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveHoliday(dateStr)}
                                        className="w-full rounded-xl border border-amber-500/30 bg-amber-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 shadow-xs hover:bg-amber-500/30 transition-colors cursor-pointer"
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

                  <form onSubmit={handleAddHoliday} className="glass-surface grid gap-3 rounded-2xl p-4 sm:grid-cols-4 items-end">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Date (YYYY-MM-DD)</label>
                      <input
                        type="date"
                        value={newHolDate}
                        onChange={(e) => setNewHolDate(e.target.value)}
                        className="glass-input h-10 w-full rounded-2xl px-3 text-xs font-semibold text-navy dark:text-white focus:outline-none cursor-pointer"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Holiday Name / Note</label>
                      <input
                        type="text"
                        value={newHolName}
                        onChange={(e) => setNewHolName(e.target.value)}
                        placeholder="e.g. Gandhi Jayanti, Diwali"
                        className="glass-input h-10 w-full rounded-2xl px-3 text-xs font-semibold text-navy dark:text-white focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <Select
                        label="Type / Action"
                        size="lg"
                        fullWidth
                        value={isOverride ? 'override' : newHolType}
                        onChange={(val) => {
                          if (val === 'override') {
                            setIsOverride(true);
                          } else {
                            setIsOverride(false);
                            setNewHolType(val);
                          }
                        }}
                        options={[
                          { value: 'org', label: 'Organization Holiday', tone: 'blue' },
                          { value: 'govt', label: 'Government Holiday', tone: 'purple' },
                          { value: 'override', label: 'Working Override (Force Working Day)', tone: 'green' }
                        ]}
                      />
                    </div>
                    <Button size="sm" type="submit" icon={<PlusIcon className="h-4 w-4" />} className="btn-glass-primary !from-indigo-600 !to-violet-600 text-white font-bold border-none h-10">
                      Add Holiday Entry
                    </Button>
                  </form>

                  <div className="space-y-2 pt-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Configured Custom Holiday &amp; Override List</h3>
                    {holidays.length === 0 ? (
                      <p className="glass-surface text-xs text-slate-400 italic p-3.5 rounded-2xl">
                        No custom holiday dates added yet. Automatic 3rd Saturday holidays are active system-wide.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {holidays.map((h) => (
                          <span
                            key={h.date}
                            className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-1.5 text-xs font-bold shadow-glass ${
                              h.isWorkingOverride
                                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
                                : h.type === 'govt'
                                ? 'border-purple-500/30 bg-purple-500/15 text-purple-900 dark:text-purple-200'
                                : 'border-amber-500/30 bg-amber-500/15 text-amber-900 dark:text-amber-200'
                            }`}
                          >
                            <span>
                              {h.date} — {h.name} {h.isWorkingOverride ? '(Working Override 💼)' : `(${h.type === 'govt' ? 'Govt' : 'Org'} Holiday 🎉)`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveHoliday(h.date)}
                              className="rounded-xl p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="flex items-center gap-3">
            <Button size="lg" onClick={save} className="btn-glass-primary !from-indigo-600 !to-violet-600 text-white font-bold border-none shadow-glass">
              Save All Settings
            </Button>
            {saved && <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">Saved — rules apply immediately ✓</span>}
          </div>
        </div>
      </div>
    </>
  );
}
