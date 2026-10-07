import React, { useState } from 'react';
import {
  XIcon,
  PlusCircleIcon,
  UserCheckIcon,
  CheckIcon,
  CalendarIcon,
  FlagIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../api/client';

interface DeveloperOption {
  id: string;
  name: string;
  team: string;
  project: string;
}

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDeveloperId?: string;
  assignerRole?: 'TL' | 'PM';
  assignerName?: string;
  developers?: DeveloperOption[];
  onTaskAssigned?: (taskData: any) => void;
}

export function AssignTaskModal({
  isOpen,
  onClose,
  defaultDeveloperId,
  assignerRole: _assignerRole = 'TL',
  assignerName = 'Team Lead',
  developers = [],
  onTaskAssigned
}: AssignTaskModalProps) {
  const [developerId, setDeveloperId] = useState(defaultDeveloperId || developers[0]?.id || '');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium'>('high');
  const getInitialDueDateTime = () => {
    const d = new Date();
    d.setHours(17, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T17:00`;
  };

  const [dueDateVal, setDueDateVal] = useState(getInitialDueDateTime());
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const formatDueDateTime = (datetimeStr: string): string => {
    if (!datetimeStr) return 'Today 5:00 PM';
    try {
      const d = new Date(datetimeStr);
      if (isNaN(d.getTime())) return datetimeStr;
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      if (isToday) return `Today ${timeStr}`;
      if (isTomorrow) return `Tomorrow ${timeStr}`;
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
    } catch {
      return datetimeStr;
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setDeveloperId(defaultDeveloperId || developers[0]?.id || '');
      setDueDateVal(getInitialDueDateTime());
      setSuccessMessage('');
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultDeveloperId, developers.length]);

  if (!isOpen) return null;

  const selectedDev = developers.find((d) => d.id === developerId) || developers[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !developerId) return;
    setBusy(true);
    setError('');
    const formattedDueDate = formatDueDateTime(dueDateVal);
    try {
      const res = await api<{ task: any }>('/api/tasks', {
        method: 'POST',
        body: { assigneeId: developerId, title: title.trim(), note: note.trim(), priority, dueDate: formattedDueDate }
      });
      onTaskAssigned?.(res.task);
      setSuccessMessage(`Task successfully assigned to ${selectedDev?.name}!`);
      setTimeout(() => {
        setSuccessMessage('');
        setTitle('');
        setNote('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <PlusCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy">Assign Task to Developer</h2>
              <p className="text-xs text-gray-500">
                Assigned by: <span className="font-semibold text-navy">{assignerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy"
            aria-label="Close modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="my-8 flex flex-col items-center justify-center space-y-2 text-center animate-in zoom-in-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-navy">{successMessage}</p>
            <p className="text-xs text-gray-500">
              The task now appears on {selectedDev?.name}'s pending dashboard instantly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                <UserCheckIcon className="h-3.5 w-3.5 text-brand" />
                Select Developer <span className="text-red-500">*</span>
              </label>
              <select
                value={developerId}
                onChange={(e) => setDeveloperId(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-canvas px-3.5 py-2.5 text-sm font-semibold text-navy focus:border-brand focus:bg-white focus:outline-none"
              >
                {developers.length === 0 && <option value="">Loading developers…</option>}
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} ({dev.team || dev.project})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement OTP verification for user registration"
                className="w-full rounded-xl border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  <FlagIcon className="h-3.5 w-3.5 text-amber-600" />
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full rounded-xl border border-hairline bg-canvas px-3.5 py-2.5 text-sm font-semibold text-navy focus:border-brand focus:bg-white focus:outline-none"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                  Due Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dueDateVal}
                  onChange={(e) => setDueDateVal(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-canvas px-3.5 py-2 text-xs font-semibold text-navy focus:border-brand focus:bg-white focus:outline-none cursor-pointer"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setHours(17, 0, 0, 0);
                      const pad = (n: number) => String(n).padStart(2, '0');
                      setDueDateVal(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T17:00`);
                    }}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Today 5 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(17, 0, 0, 0);
                      const pad = (n: number) => String(n).padStart(2, '0');
                      setDueDateVal(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T17:00`);
                    }}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Tomorrow 5 PM
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                Instructions / Note for Developer
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Specific instructions, endpoints, or requirements for this assigned task..."
                className="w-full rounded-xl border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

            {error && <p className="text-xs font-semibold text-danger">{error}</p>}

            <div className="flex items-center justify-end gap-3 border-t border-hairline pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} icon={<CheckIcon className="h-4 w-4" />}>
                {busy ? 'Assigning…' : 'Assign Task Now'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

