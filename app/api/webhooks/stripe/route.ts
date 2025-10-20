import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { getStripeClient } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const signature = headers().get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const body = await req.text()
  const stripe = getStripeClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabase = supabaseAdmin()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const clerkUserId = session.metadata?.clerk_user_id
      const stripeCustomerId = session.customer?.toString() ?? undefined
      const email = session.customer_details?.email ?? session.customer_email ?? null

      if (clerkUserId && stripeCustomerId) {
        await supabase
          .from('profiles')
          .upsert(
            {
              clerk_user_id: clerkUserId,
              email,
              stripe_customer_id: stripeCustomerId,
              subscription_status: 'active',
            },
            { onConflict: 'clerk_user_id' },
          )
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const status = subscription.status
      const stripeCustomerId = subscription.customer?.toString()

      if (stripeCustomerId) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: status === 'active' ? 'active' : status,
          })
          .eq('stripe_customer_id', stripeCustomerId)
      }
      break
    }
    default: {
      break
    }
  }

  return NextResponse.json({ received: true })
}
