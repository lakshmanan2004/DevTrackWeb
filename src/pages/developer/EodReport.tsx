import React, { useMemo, useState } from 'react';
import { AlarmClockIcon, CheckCircle2Icon, StarIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Banner } from '../../components/ui/Banner';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useEod } from '../../hooks/useLive';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ratingLabels = ['Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];
const MIN_WORDS = 50;

export function EodReport() {
  const { user } = useAuth();
  const { data, refetch } = useEod();
  const [summary, setSummary] = useState('');
  const [carry, setCarry] = useState('');
  const [blockers, setBlockers] = useState('');
  const [rating, setRating] = useState(4);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const alreadySubmitted = !!data?.today;
  const todayStats = data?.todayStats;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const EOD_OPEN_MINUTES = 15 * 60 + 45; // 3:45 PM
  const isAfter345 = currentMinutes >= EOD_OPEN_MINUTES;

  const wordCount = useMemo(() => summary.trim().split(/\s+/).filter(Boolean).length, [summary]);
  const wordsOk = wordCount >= MIN_WORDS;

  const dateLabel = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

  const submit = async () => {
    if (!isAfter345) {
      setError('EOD submission is only allowed after 3:45 PM. You can prepare your draft now.');
      return;
    }
    if (!wordsOk) {
      setError(`Day summary must be at least ${MIN_WORDS} words (currently ${wordCount}).`);
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api('/api/eod', {
        method: 'POST',
        body: { summary, carryForward: carry, blockers, rating }
      });
      setMessage('EOD report submitted successfully — your team leader can see it now.');
      refetch();
    } catch (err: any) {
      setError(err.message || 'Failed to submit EOD report');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="End of Day Report" subtitle={`${dateLabel} · ${user?.teamName || ''} · ${user?.projectName || ''}`} />

      <div className="flex-1 space-y-6 p-6">
        <Banner
          tone={alreadySubmitted ? 'green' : isAfter345 ? 'blue' : 'yellow'}
          icon={<AlarmClockIcon className="h-4 w-4" />}
          title={
            alreadySubmitted
              ? 'EOD submitted for today ✓'
              : isAfter345
              ? 'EOD Submission Window Open (Submit before 6:00 PM)'
              : 'EOD opens at 3:45 PM'
          }
        >
          {alreadySubmitted
            ? `Submitted at ${data.today.time}`
            : isAfter345
            ? 'Wrap up the day with a summary of your work.'
            : 'You can prepare your draft summary below. The submit button will activate once the window opens at 3:45 PM.'}
        </Banner>

        <section className="glass-card rounded-3xl border border-white/80 p-6 shadow-glass">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-black text-navy tracking-tight">Today&apos;s logged work</h2>
            <p className="text-xs text-slate-500 font-medium">
              {todayStats
                ? `${todayStats.logs} logs · ${todayStats.done} done · ${todayStats.progress} in progress · ${todayStats.blocked} blocked · ${todayStats.commits} commits`
                : 'loading…'}
            </p>
          </div>
          <div className="mt-3.5">
            <ProgressBar
              value={todayStats && todayStats.logs > 0
                ? Math.min(100, Math.round((todayStats.logs / 6) * 100))
                : 0}
              tone="green"
              height="md"
              label="Day coverage"
            />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <form
            className="glass-card space-y-5 rounded-3xl border border-white/80 p-6 sm:p-7 shadow-glass"
            onSubmit={(e) => {
              e.preventDefault();
              if (!alreadySubmitted) submit();
            }}
          >
            <div>
              <label htmlFor="eod-summary" className="mb-1.5 block text-xs font-bold text-navy">
                Day Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                id="eod-summary"
                rows={5}
                value={alreadySubmitted ? data.today.summary : summary}
                onChange={(event) => setSummary(event.target.value)}
                disabled={alreadySubmitted}
                placeholder="Describe everything you accomplished today (min 50 words)…"
                className="glass-input w-full p-3.5 text-xs leading-relaxed text-navy font-medium placeholder:text-slate-400 disabled:opacity-60"
              />

              <p
                className={`mt-1.5 text-xs font-bold ${
                  (alreadySubmitted ? data.today.summary : summary).trim().split(/\s+/).filter(Boolean).length >= MIN_WORDS
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {(alreadySubmitted ? data.today.summary : summary).trim().split(/\s+/).filter(Boolean).length} / min {MIN_WORDS} words
              </p>
            </div>

            <div>
              <label htmlFor="eod-carry" className="mb-1.5 block text-xs font-bold text-navy">
                Carrying Forward to Tomorrow
              </label>
              <textarea
                id="eod-carry"
                rows={3}
                value={alreadySubmitted ? data.today.carryForward : carry}
                onChange={(event) => setCarry(event.target.value)}
                disabled={alreadySubmitted}
                className="glass-input w-full p-3.5 text-xs leading-relaxed text-navy font-medium placeholder:text-slate-400 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="eod-blockers" className="mb-1.5 block text-xs font-bold text-navy">
                Blockers or Support Needed
              </label>
              <textarea
                id="eod-blockers"
                rows={3}
                value={alreadySubmitted ? data.today.blockers : blockers}
                onChange={(event) => setBlockers(event.target.value)}
                disabled={alreadySubmitted}
                className="glass-input w-full p-3.5 text-xs leading-relaxed text-navy font-medium placeholder:text-slate-400 disabled:opacity-60 border-orange-300"
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-xs font-bold text-navy">How was your day?</legend>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    disabled={alreadySubmitted}
                    aria-label={ratingLabels[value - 1]}
                    aria-pressed={rating === value}
                    className="rounded-xl p-1.5 transition-all hover:bg-white/60 disabled:opacity-60 cursor-pointer"
                  >
                    <StarIcon
                      className={`h-6 w-6 ${
                        value <= (alreadySubmitted ? data.today.rating : rating)
                          ? 'fill-amber-500 text-amber-500 drop-shadow-xs'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-navy">
                  {ratingLabels[(alreadySubmitted ? data.today.rating : rating) - 1]}
                </span>
              </div>
            </fieldset>

            {error && (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-600">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {message}
              </p>
            )}

            {!alreadySubmitted && (
              <Button
                size="lg"
                fullWidth
                icon={<CheckCircle2Icon className="h-4 w-4" />}
                disabled={busy || !wordsOk || !isAfter345}
              >
                {busy
                  ? 'Submitting…'
                  : !isAfter345
                  ? 'EOD Opens at 3:45 PM'
                  : `Submit EOD Report for ${dateLabel}`}
              </Button>
            )}
          </form>

          <section className="glass-card h-fit overflow-hidden rounded-3xl border border-white/80 p-0 shadow-glass">
            <h2 className="border-b border-slate-200/60 px-6 py-4 text-xs font-black uppercase tracking-wider text-navy">
              Past Reports
            </h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th scope="col" className="px-6 py-3 font-bold">Date</th>
                  <th scope="col" className="px-3 py-3 font-bold">Rating</th>
                  <th scope="col" className="px-6 py-3 text-right font-bold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {(data?.past || []).map((report: any) => (
                  <tr key={report.id} className="transition-colors hover:bg-white/40">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-navy">{report.dateLabel}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500 font-normal">{report.summary}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-xs font-bold text-amber-600">
                      {report.rating}/5
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right text-xs text-slate-400 font-medium">
                      {report.time}
                    </td>
                  </tr>
                ))}
                {data && data.past.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-xs text-slate-400 font-medium">
                      No past reports yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </>);
}
