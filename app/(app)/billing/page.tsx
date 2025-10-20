import { requireProfile } from '@/lib/auth'

import { BillingActions } from './billing-actions'

function formatDate(timestamp: string | null) {
  if (!timestamp) return 'N/A'
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return 'N/A'
  }
}

export default async function BillingPage() {
  const profile = await requireProfile()

  return (
    <div className="flex flex-col gap-6 text-slate-200">
      <header>
        <h1 className="text-2xl font-semibold text-white">Billing</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage your subscription, update payment details, and access invoices through Stripe.
        </p>
      </header>
      <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
            <h2 className="mt-1 text-lg font-semibold text-white capitalize">
              {profile.subscription_status ?? 'inactive'}
            </h2>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Plan</p>
            <p className="mt-1 text-sm text-slate-300">Creator plan · $5/month</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Renewal</p>
            <p className="mt-1 text-sm text-slate-300">{formatDate(profile.current_period_end)}</p>
          </div>
        </div>
        <BillingActions hasActiveSubscription={profile.subscription_status === 'active'} />
      </section>
    </div>
  )
}

