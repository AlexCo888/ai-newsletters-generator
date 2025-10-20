import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const signature = headers().get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('Missing Stripe signature', { status: 400 })
  }

  const payload = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('Stripe webhook signature verification failed', error)
    return new NextResponse('Invalid signature', { status: 400 })
  }

  const supabase = supabaseAdmin()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkUserId = session.metadata?.clerk_user_id
        if (!clerkUserId) break

        await supabase
          .from('profiles')
          .upsert(
            {
              clerk_user_id: clerkUserId,
              email: session.customer_details?.email ?? null,
              stripe_customer_id: session.customer?.toString() ?? null,
              subscription_status: 'active',
              stripe_subscription_id: session.subscription?.toString() ?? null,
            },
            { onConflict: 'clerk_user_id' }
          )
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const stripeCustomerId = subscription.customer?.toString()

        if (!stripeCustomerId) break

        await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status === 'active' ? 'active' : subscription.status ?? 'canceled',
            stripe_subscription_id: subscription.id,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_customer_id', stripeCustomerId)
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const stripeCustomerId = invoice.customer?.toString()
        if (!stripeCustomerId) break

        await supabase
          .from('profiles')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', stripeCustomerId)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const stripeCustomerId = invoice.customer?.toString()
        if (!stripeCustomerId) break

        await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', stripeCustomerId)
        break
      }
      default: {
        console.log(`Unhandled Stripe event type ${event.type}`)
      }
    }
  } catch (error) {
    console.error('Failed to process Stripe webhook', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
