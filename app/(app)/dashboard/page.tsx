import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

import { requireProfile } from '@/lib/auth'
import { getNextScheduledIssue, getPreferences, getRecentIssues } from '@/lib/data'

import { FirstIssueButton } from './first-issue-button'
import { UpgradeCallout } from './upgrade-cta'

function formatRelative(dateString: string | null | undefined) {
  if (!dateString) return 'Not scheduled'
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch {
    return 'Not scheduled'
  }
}

function formatPrecise(dateString: string | null | undefined) {
  if (!dateString) return 'Not scheduled'
  try {
    return format(parseISO(dateString), 'EEEE, MMM d @ h:mm a')
  } catch {
    return 'Not scheduled'
  }
}

export default async function DashboardPage() {
  const profile = await requireProfile()
  const user = await currentUser()

  const hasActiveSubscription = profile.subscription_status === 'active'

  const [preferences, nextIssue, recentIssues] = await Promise.all([
    getPreferences(profile.id),
    getNextScheduledIssue(profile.id),
    getRecentIssues(profile.id, 6),
  ])

  const cadencePerMonth = preferences?.cadence ?? 1

  return (
    <div className="flex flex-col gap-8 text-slate-200">
      {!hasActiveSubscription && <UpgradeCallout />}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Next delivery</p>
          <h2 className="mt-2 text-lg font-semibold text-white">{formatRelative(nextIssue?.scheduled_at ?? null)}</h2>
          <p className="mt-1 text-sm text-slate-400">{formatPrecise(nextIssue?.scheduled_at ?? null)}</p>
          <Link
            href={hasActiveSubscription ? '/settings' : '/billing'}
            className="mt-3 inline-flex text-xs font-semibold text-emerald-300 hover:text-emerald-200"
          >
            {hasActiveSubscription ? 'Manage schedule ->' : 'Upgrade to schedule ->'}
          </Link>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cadence</p>
          <h2 className="mt-2 text-lg font-semibold text-white">{cadencePerMonth}x / month</h2>
          <p className="mt-1 text-sm text-slate-400">
            Tone:{' '}
            <span className="capitalize">
              {preferences?.tone === 'custom' ? preferences?.tone_custom ?? 'Custom' : preferences?.tone ?? 'Professional'}
            </span>
          </p>
          <Link
            href={hasActiveSubscription ? '/settings' : '/billing'}
            className="mt-3 inline-flex text-xs font-semibold text-blue-300 hover:text-blue-200"
          >
            {hasActiveSubscription ? 'Update preferences ->' : 'Unlock preferences ->'}
          </Link>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Account</p>
          <h2 className="mt-2 text-lg font-semibold text-white">{user?.fullName ?? 'Subscriber'}</h2>
          <p className="mt-1 text-sm text-slate-400">{profile.email ?? user?.primaryEmailAddress?.emailAddress ?? ''}</p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              hasActiveSubscription ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
            }`}
          >
            {hasActiveSubscription ? 'Active subscription' : 'Upgrade required'}
          </span>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Upcoming issue</h3>
            <p className="text-sm text-slate-400">
              {hasActiveSubscription
                ? 'Generated content is ready for review before each send.'
                : 'Upgrade to automatically generate and schedule your next issue.'}
            </p>
          </div>
          {hasActiveSubscription ? (
            nextIssue ? (
              <Link
                href={`/editor/${nextIssue.id}`}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
              >
                Review draft
              </Link>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <FirstIssueButton size="small" />
                <Link
                  href="/settings"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
                >
                  Configure schedule
                </Link>
              </div>
            )
          ) : (
            <UpgradeCallout minimal />
          )}
        </div>
        {hasActiveSubscription && nextIssue ? (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Subject</p>
            <h4 className="mt-1 text-lg font-semibold text-white">{nextIssue.subject ?? 'Awaiting generation'}</h4>
            <p className="mt-2 text-sm text-slate-400">{nextIssue.preheader ?? 'Preview will appear once generated.'}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="rounded-full bg-slate-800 px-3 py-1 uppercase tracking-wide">
                Status: {nextIssue.status}
              </span>
              {nextIssue.generated_at && (
                <span className="rounded-full bg-slate-800 px-3 py-1 uppercase tracking-wide text-slate-300">
                  Generated {formatRelative(nextIssue.generated_at)}
                </span>
              )}
            </div>
          </div>
        ) : hasActiveSubscription ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
            <p>No upcoming issues yet. Schedule your cadence in settings to generate the first draft automatically.</p>
            <FirstIssueButton className="mt-4" variant="outline" />
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
            Unlock AI drafting and automated scheduling by starting your subscription.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Recent activity</h3>
            <p className="text-sm text-slate-400">
              {hasActiveSubscription
                ? 'Track generated issues and delivery progress.'
                : 'Subscribe to start generating issues and see them appear here.'}
            </p>
          </div>
          {hasActiveSubscription ? (
            <Link
              href="/dashboard?view=issues"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              View all issues
            </Link>
          ) : (
            <UpgradeCallout minimal />
          )}
        </div>
        {hasActiveSubscription ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {recentIssues.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
                <p>No issues generated yet. Your first newsletter will appear here after scheduling a cadence or sending a manual test.</p>
                <FirstIssueButton className="mt-4" variant="outline" />
              </div>
            )}
            {recentIssues.map((issue) => (
              <article key={issue.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="uppercase tracking-wide">Status: {issue.status}</span>
                  <span>
                    {issue.created_at ? formatDistanceToNow(parseISO(issue.created_at), { addSuffix: true }) : ''}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white">{issue.subject ?? 'Untitled issue'}</h4>
                <p className="text-sm text-slate-400">{issue.preheader ?? 'Preheader will appear when generated.'}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Scheduled:{' '}
                    {issue.scheduled_at ? format(parseISO(issue.scheduled_at), 'MMM d, yyyy @ h:mm a') : 'Awaiting scheduling'}
                  </span>
                  <Link href={`/editor/${issue.id}`} className="font-semibold text-blue-300 hover:text-blue-200">
                    Open
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
            Once subscribed, your generated newsletters and delivery history will show up here.
          </div>
        )}
      </section>
    </div>
  )
}
