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

      <div className="flex-1 space-y-5 p-6">
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

        <section className="rounded-card border border-hairline bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-navy">Today&apos;s logged work</h2>
            <p className="text-xs text-gray-500">
              {todayStats
                ? `${todayStats.logs} logs · ${todayStats.done} done · ${todayStats.progress} in progress · ${todayStats.blocked} blocked · ${todayStats.commits} commits`
                : 'loading…'}
            </p>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={todayStats && todayStats.logs > 0
                ? Math.min(100, Math.round((todayStats.logs / 6) * 100))
                : 0}
              tone="green"
              height="md"
              label="Day coverage" />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form
            className="space-y-5 rounded-card border border-hairline bg-white p-5 shadow-card"
            onSubmit={(e) => {
              e.preventDefault();
              if (!alreadySubmitted) submit();
            }}>

            <div>
              <label htmlFor="eod-summary" className="mb-1.5 block text-sm font-semibold text-navy">
                Day Summary <span className="text-danger">*</span>
              </label>
              <textarea
                id="eod-summary"
                rows={5}
                value={alreadySubmitted ? data.today.summary : summary}
                onChange={(event) => setSummary(event.target.value)}
                disabled={alreadySubmitted}
                placeholder="Describe everything you accomplished today (min 50 words)…"
                className="w-full rounded-lg border border-hairline px-3 py-2.5 text-sm leading-relaxed text-navy disabled:bg-gray-50" />

              <p
                className={`mt-1.5 text-xs font-semibold ${
                (alreadySubmitted ? data.today.summary : summary).trim().split(/\s+/).filter(Boolean).length >= MIN_WORDS ? 'text-green-600' : 'text-danger'}`
                }>
                {(alreadySubmitted ? data.today.summary : summary).trim().split(/\s+/).filter(Boolean).length} / min {MIN_WORDS} words
              </p>
            </div>

            <div>
              <label htmlFor="eod-carry" className="mb-1.5 block text-sm font-semibold text-navy">
                Carrying Forward to Tomorrow
              </label>
              <textarea
                id="eod-carry"
                rows={3}
                value={alreadySubmitted ? data.today.carryForward : carry}
                onChange={(event) => setCarry(event.target.value)}
                disabled={alreadySubmitted}
                className="w-full rounded-lg border border-hairline px-3 py-2.5 text-sm leading-relaxed text-navy disabled:bg-gray-50" />
            </div>

            <div>
              <label htmlFor="eod-blockers" className="mb-1.5 block text-sm font-semibold text-navy">
                Blockers or Support Needed
              </label>
              <textarea
                id="eod-blockers"
                rows={3}
                value={alreadySubmitted ? data.today.blockers : blockers}
                onChange={(event) => setBlockers(event.target.value)}
                disabled={alreadySubmitted}
                className="w-full rounded-lg border-2 border-orange-200 px-3 py-2.5 text-sm leading-relaxed text-navy disabled:bg-gray-50" />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-navy">How was your day?</legend>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) =>
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  disabled={alreadySubmitted}
                  aria-label={ratingLabels[value - 1]}
                  aria-pressed={rating === value}
                  className="rounded-md p-1 transition-colors duration-150 ease-out hover:bg-gray-100 disabled:opacity-60">
                    <StarIcon
                    className={`h-6 w-6 ${
                    value <= (alreadySubmitted ? data.today.rating : rating) ? 'fill-warn text-warn' : 'text-gray-300'}`
                    } />
                  </button>
                )}
                <span className="ml-2 text-sm font-semibold text-navy">
                  {ratingLabels[(alreadySubmitted ? data.today.rating : rating) - 1]}
                </span>
              </div>
            </fieldset>

            {error && (
              <p className="rounded-lg border border-red-200 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>
            )}
            {message && (
              <p className="rounded-lg border border-green-200 bg-ok-soft px-3 py-2 text-sm font-semibold text-green-700">{message}</p>
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

          <section className="h-fit rounded-card border border-hairline bg-white shadow-card">
            <h2 className="border-b border-hairline px-5 py-4 text-sm font-bold text-navy">
              Past Reports
            </h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-5 py-2.5 font-semibold">Date</th>
                  <th scope="col" className="px-2 py-2.5 font-semibold">Rating</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.past || []).map((report: any) =>
                <tr key={report.id}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-navy">{report.dateLabel}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-500">{report.summary}</p>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-xs font-semibold text-amber-600">
                      {report.rating}/5
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-xs text-gray-500">
                      {report.time}
                    </td>
                  </tr>
                )}
                {data && data.past.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-xs text-gray-500">
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
