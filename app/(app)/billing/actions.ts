'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { requireProfile } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { createCheckoutSessionForProfile } from '@/lib/billing'

export async function openPortal() {
  const profile = await requireProfile()

  if (!profile.stripe_customer_id) {
    redirect('/pricing?reason=subscribe')
  }

  const returnUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000/dashboard'

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: returnUrl,
  })

  revalidatePath('/billing')

  return { url: session.url }
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

