'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { openPortal, startCheckout } from './actions'

type BillingActionsProps = {
  hasActiveSubscription: boolean
}

export function BillingActions({ hasActiveSubscription }: BillingActionsProps) {
  const [isPortalPending, startPortalTransition] = useTransition()
  const [isCheckoutPending, startCheckoutTransition] = useTransition()

  const handlePortal = () => {
    startPortalTransition(async () => {
      try {
        const result = await openPortal()
        if (result.url) {
          window.location.href = result.url
          return
        }
        toast.error('Unable to open billing portal')
      } catch (error) {
        console.error(error)
        toast.error('Unable to open billing portal')
      }
    })
  }

  const handleCheckout = () => {
    startCheckoutTransition(async () => {
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

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <p className="text-sm text-slate-300">
        {hasActiveSubscription
          ? 'Access invoices, update card details, or cancel directly in the Stripe portal.'
          : 'Start your subscription to unlock AI-powered newsletter generation and automation.'}
      </p>
      {hasActiveSubscription ? (
        <button
          onClick={handlePortal}
          disabled={isPortalPending}
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPortalPending ? 'Opening portal…' : 'Open billing portal'}
        </button>
      ) : (
        <button
          onClick={handleCheckout}
          disabled={isCheckoutPending}
          className="inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCheckoutPending ? 'Starting checkout…' : 'Start subscription'}
        </button>
      )}
    </div>
  )
}

