import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { fetchOrCreateProfile, createCheckoutSessionForProfile } from '@/lib/billing'

export const runtime = 'nodejs'

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!process.env.STRIPE_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe price is not configured.' }, { status: 500 })
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json({ error: 'App URL is not configured.' }, { status: 500 })
  }

  try {
    const user = await currentUser()
    const profile = await fetchOrCreateProfile(userId, user?.primaryEmailAddress?.emailAddress)

    const session = await createCheckoutSessionForProfile(
      profile,
      process.env.STRIPE_PRICE_ID,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`
    )

    if (!session.url) {
      return NextResponse.json({ error: 'Unable to create Stripe checkout session.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error', error)
    return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 500 })
  }
}
