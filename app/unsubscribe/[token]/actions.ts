'use server'

import { supabaseAdmin } from '@/lib/supabase'

export async function unsubscribeByToken(token: string, formData: FormData) {
  void formData
  if (!token) {
    return { ok: false, error: 'Invalid token' }
  }

  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from('recipients')
    .select('id, email, status')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  if (error) {
    console.error('Failed to lookup unsubscribe token', error)
    return { ok: false, error: 'Unable to process request' }
  }

  if (!data) {
    return { ok: false, error: 'Subscriber not found' }
  }

  if (data.status === 'unsubscribed') {
    return { ok: true, alreadyUnsubscribed: true }
  }

  const { error: updateError } = await supabase
    .from('recipients')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', data.id)

  if (updateError) {
    console.error('Failed to unsubscribe recipient', updateError)
    return { ok: false, error: 'Unable to update subscription' }
  }

  return { ok: true, email: data.email ?? undefined }
}
