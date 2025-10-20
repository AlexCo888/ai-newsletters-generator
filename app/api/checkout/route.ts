import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

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
    const supabase = supabaseAdmin()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, subscription_status')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch profile', error)
      return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 500 })
    }

    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress ?? profile?.email ?? undefined

    let customerId = profile?.stripe_customer_id ?? undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          clerk_user_id: userId,
        },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .upsert(
          {
            clerk_user_id: userId,
            email: email ?? null,
            stripe_customer_id: customerId,
            subscription_status: profile?.subscription_status ?? 'inactive',
          },
          { onConflict: 'clerk_user_id' }
        )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      metadata: {
        clerk_user_id: userId,
      },
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Unable to create Stripe checkout session.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error', error)
    return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 500 })
  }
}
