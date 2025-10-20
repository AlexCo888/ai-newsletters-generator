import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    customer_email: email,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    metadata: { clerk_user_id: userId },
  })

  return NextResponse.json({ url: session.url })
}
