import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const sig = headers().get('stripe-signature')!
  const body = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supa = supabaseAdmin()

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as any
      const clerk_user_id = s.metadata?.clerk_user_id
      const stripe_customer_id = s.customer?.toString()
      if (clerk_user_id) {
        await supa.from('profiles').upsert(
          {
            clerk_user_id,
            email: s.customer_details?.email ?? null,
            stripe_customer_id,
            subscription_status: 'active',
          },
          { onConflict: 'clerk_user_id' },
        )
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any
      await supa
        .from('profiles')
        .update({ subscription_status: sub.status === 'active' ? 'active' : sub.status })
        .eq('stripe_customer_id', sub.customer?.toString())
      break
    }
  }

  return NextResponse.json({ received: true })
}
