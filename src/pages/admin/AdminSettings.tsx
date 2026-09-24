import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { useLive } from '../../hooks/useLive';
import { api } from '../../api/client';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function AdminSettings() {
  const { data } = useLive<{ settings: any }>('/api/settings', [], 0);
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

  useEffect(() => {
    const s = data?.settings;
    if (s) {
      setWorkingDays(s.workDays);
      setStartHour(s.workStartHour);
      setEndHour(s.workEndHour);
      setIntervalState(s.intervalMinutes);
      setMinWords(s.minWords);
      setGrace(s.graceMinutes);
      setIdle(s.idleMinutes);
      setBatch(s.batchThreshold);
      setToggles(s.notifications);
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
        notifications: toggles
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
          </div>

          <div className="flex items-center gap-3">
            <Button size="lg" onClick={save}>
              Save All Settings
            </Button>
            {saved && <span className="text-xs font-semibold text-green-600">Saved — rules apply immediately ✓</span>}
          </div>
        </div>
      </div>
    </>);
}
