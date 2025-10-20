import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import type { ProfileRecord } from '@/lib/auth'

export async function fetchOrCreateProfile(clerkUserId: string, email?: string | null) {
  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, clerk_user_id, email, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, created_at, updated_at'
    )
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch profile for billing', error)
    throw new Error('Unable to load profile')
  }

  if (data) {
    if (!data.email && email) {
      await supabase
        .from('profiles')
        .update({ email })
        .eq('id', data.id)
    }

    return data as ProfileRecord
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      clerk_user_id: clerkUserId,
      email: email ?? null,
      subscription_status: 'canceled',
    })
    .select(
      'id, clerk_user_id, email, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, created_at, updated_at'
    )
    .maybeSingle()

  if (insertError) {
    console.error('Failed to create profile for billing', insertError)
    throw new Error('Unable to initialize profile')
  }

  return inserted as ProfileRecord
}

export async function ensureStripeCustomer(profile: ProfileRecord, email?: string | null) {
  if (profile.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  const customer = await stripe.customers.create({
    email: email ?? profile.email ?? undefined,
    metadata: {
      clerk_user_id: profile.clerk_user_id,
    },
  })

  const supabase = supabaseAdmin()

  await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customer.id,
      email: email ?? profile.email ?? null,
    })
    .eq('id', profile.id)

  return customer.id
}

export async function createCheckoutSessionForProfile(profile: ProfileRecord, priceId: string, successUrl: string, cancelUrl: string) {
  const customerId = await ensureStripeCustomer(profile)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    metadata: {
      clerk_user_id: profile.clerk_user_id,
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session
}
