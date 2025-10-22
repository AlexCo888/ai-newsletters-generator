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

    // Use upsert to handle race conditions gracefully
    // If profile already exists, it will be returned; otherwise it will be created
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .upsert(
        {
          clerk_user_id: userId,
          email,
          subscription_status: 'canceled',
        },
        {
          onConflict: 'clerk_user_id',
          ignoreDuplicates: false, // Return the existing row if conflict
        }
      )
      .select(
        'id, clerk_user_id, email, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, created_at, updated_at'
      )
      .maybeSingle()

    if (insertError) {
      if (insertError.code === '23505') {
        // Duplicate key error - another request created the profile
        // Retry with exponential backoff to handle race condition
        console.log(`Duplicate key detected for user ${userId}, retrying fetch...`)
        
        let existing = null
        let attempts = 0
        const maxAttempts = 5
        const baseDelay = 150 // ms

        while (!existing && attempts < maxAttempts) {
          attempts++
          
          // Wait before retrying (exponential backoff)
          const delay = baseDelay * Math.pow(2, attempts - 1)
          console.log(`Retry attempt ${attempts}/${maxAttempts} after ${delay}ms delay`)
          await new Promise(resolve => setTimeout(resolve, delay))

          const { data: existingData, error: existingError } = await supabase
            .from('profiles')
            .select(
              'id, clerk_user_id, email, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, created_at, updated_at'
            )
            .eq('clerk_user_id', userId)
            .maybeSingle()

          if (existingError) {
            console.error(`Failed to load existing profile after duplicate constraint (attempt ${attempts}/${maxAttempts})`, {
              error: existingError,
              userId,
              code: existingError.code,
              message: existingError.message
            })
            if (attempts === maxAttempts) {
              throw new Error('Unable to initialize profile after retries')
            }
            continue
          }

          if (existingData) {
            console.log(`Profile found for user ${userId} on attempt ${attempts}`)
            existing = existingData
          } else {
            console.warn(`Profile still not found for user ${userId} on attempt ${attempts}`)
          }
        }

        if (!existing) {
          console.error('Duplicate profile constraint hit but no existing record found for user after retries', {
            userId,
            attempts,
            insertError: insertError.message
          })
          throw new Error('Unable to initialize profile - race condition detected')
        }

        return existing as ProfileRecord
      }

      console.error('Failed to create profile', { error: insertError, userId })
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
