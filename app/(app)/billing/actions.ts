'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { requireProfile } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { createCheckoutSessionForProfile } from '@/lib/billing'

export async function openPortal() {
  try {
    const profile = await requireProfile()

    if (!profile.stripe_customer_id) {
      return { url: null, error: 'No Stripe customer found. Please subscribe first.' }
    }

    // Construct the return URL - users will be redirected here after managing their billing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const returnUrl = `${baseUrl}/billing`

    // Create a billing portal session using the official Stripe API
    // This allows customers to manage subscriptions, update payment methods, and view invoices
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    })

    // Revalidate the billing page cache to show updated information when they return
    revalidatePath('/billing')

    return { url: session.url, error: null }
  } catch (error) {
    console.error('Failed to create billing portal session:', error)
    return { url: null, error: 'Unable to open billing portal. Please try again.' }
  }
}

export async function startCheckout() {
  if (!process.env.STRIPE_PRICE_ID) {
    throw new Error('STRIPE_PRICE_ID is not configured')
  }

  const profile = await requireProfile()
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard?checkout=success`
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/pricing?checkout=cancelled`

  const session = await createCheckoutSessionForProfile(profile, process.env.STRIPE_PRICE_ID, successUrl, cancelUrl)

  return { url: session.url }
}

