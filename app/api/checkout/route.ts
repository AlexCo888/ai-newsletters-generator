import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { getStripeClient } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const stripe = getStripeClient()

  if (!process.env.STRIPE_PRICE_ID) {
    throw new Error('STRIPE_PRICE_ID is not set')
  }

  const supabase = supabaseAdmin()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, stripe_customer_id, subscription_status')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  let customerId = profile?.stripe_customer_id ?? undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.emailAddresses[0]?.emailAddress,
      metadata: {
        clerk_user_id: userId,
      },
    })
    customerId = customer.id

    await supabase.from('profiles').upsert(
      {
        clerk_user_id: userId,
        email: user.emailAddresses[0]?.emailAddress ?? null,
        stripe_customer_id: customerId,
        subscription_status: profile?.subscription_status ?? 'inactive',
      },
      { onConflict: 'clerk_user_id' },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    subscription_data: {
      metadata: {
        clerk_user_id: userId,
      },
    },
    metadata: {
      clerk_user_id: userId,
    },
  })

  return NextResponse.json({ url: session.url })
}
