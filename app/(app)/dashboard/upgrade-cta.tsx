'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { startCheckout } from '@/app/(app)/billing/actions'

type UpgradeCalloutProps = {
  minimal?: boolean
}

export function UpgradeCallout({ minimal = false }: UpgradeCalloutProps) {
  const [isPending, startTransition] = useTransition()

  const handleUpgrade = () => {
    startTransition(async () => {
      try {
        const result = await startCheckout()
        if (result.url) {
          window.location.href = result.url
          return
        }
        toast.error('Unable to start checkout')
      } catch (error) {
        console.error(error)
        toast.error('Unable to start checkout')
      }
    })
  }

  if (minimal) {
    return (
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Starting checkout...' : 'Upgrade now'}
      </button>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Start your subscription</h2>
      <p className="mt-2 text-sm text-slate-600">
        Unlock AI-generated newsletter drafts, automated scheduling, and delivery tracking by activating the Creator plan.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Starting checkout...' : 'Start subscription'}
        </button>
        <span className="text-xs text-slate-500">Only $5/month, cancel anytime.</span>
      </div>
    </div>
  )
}

