'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const preferencesSchema = z.object({
  cadence: z.enum(['1', '2', '4']).transform((value) => parseInt(value, 10) as 1 | 2 | 4),
  send_day: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return null
      const parsed = parseInt(value, 10)
      return Number.isFinite(parsed) ? parsed : null
    }),
  send_time: z
    .string()
    .optional()
    .transform((value) => (value ? value : null)),
  timezone: z
    .string()
    .optional()
    .transform((value) => (value ? value : null)),
  topics: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [])),
  tone: z.string().min(1),
  tone_custom: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : null)),
  length: z.enum(['short', 'medium', 'long']),
  must_include: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [])),
  avoid: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [])),
  cta: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : null)),
  sender_name: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : null)),
  reply_to: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : null)),
})

export async function savePreferences(formData: FormData) {
  const parsed = preferencesSchema.safeParse({
    cadence: formData.get('cadence'),
    send_day: formData.get('send_day'),
    send_time: formData.get('send_time'),
    timezone: formData.get('timezone'),
    topics: formData.get('topics'),
    tone: formData.get('tone'),
    tone_custom: formData.get('tone_custom'),
    length: formData.get('length'),
    must_include: formData.get('must_include'),
    avoid: formData.get('avoid'),
    cta: formData.get('cta'),
    sender_name: formData.get('sender_name'),
    reply_to: formData.get('reply_to'),
  })

  if (!parsed.success) {
    console.error('Preferences validation failed', parsed.error)
    return { ok: false, error: 'Validation failed' }
  }

  const profile = await requireProfile()
  const supabase = supabaseAdmin()

  const payload = {
    user_id: profile.clerk_user_id,
    cadence: parsed.data.cadence,
    send_day: parsed.data.send_day,
    send_time: parsed.data.send_time,
    timezone: parsed.data.timezone,
    topics: parsed.data.topics,
    tone: parsed.data.tone,
    tone_custom: parsed.data.tone === 'custom' ? parsed.data.tone_custom : null,
    length: parsed.data.length,
    must_include: parsed.data.must_include,
    avoid: parsed.data.avoid,
    cta: parsed.data.cta,
    sender_name: parsed.data.sender_name,
    reply_to: parsed.data.reply_to,
  }

  const { error } = await supabase.from('preferences').upsert(payload, { onConflict: 'user_id' })

  if (error) {
    console.error('Failed to save preferences', error)
    return { ok: false, error: 'Unable to save preferences' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')

  return { ok: true }
}

