import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

import { supabaseAdmin } from '@/lib/supabase'

export type ProfileRecord = {
  id: string
  clerk_user_id: string
  email: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  current_period_end: string | null
  created_at: string | null
  updated_at: string | null
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  return userId
}

export async function requireProfile() {
  const userId = await requireAuth()
  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, clerk_user_id, email, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, created_at, updated_at'
    )
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load profile', error)
    throw new Error('Unable to load profile')
  }

  if (!data) {
    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress ?? null

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({
        clerk_user_id: userId,
        email,
        subscription_status: 'canceled',
      })
      .select(
        'id, clerk_user_id, email, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, created_at, updated_at'
      )
      .maybeSingle()

    if (insertError) {
      console.error('Failed to create profile', insertError)
      throw new Error('Unable to initialize profile')
    }

    return inserted as ProfileRecord
  }

  return data as ProfileRecord
}

export async function requireActiveSubscription() {
  const profile = await requireProfile()

  if (profile.subscription_status !== 'active') {
    redirect('/pricing?reason=upgrade')
  }

  return profile
}
