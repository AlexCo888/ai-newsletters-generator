'use server'

import { revalidatePath } from 'next/cache'
import { requireActiveSubscription } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { newsletterContentSchema, type NewsletterContent, renderNewsletterHtml } from '@/lib/newsletter'

export type IssueContent = NewsletterContent

export async function saveIssue(issueId: string, payload: IssueContent) {
  const profile = await requireActiveSubscription()
  const supabase = supabaseAdmin()

  const validation = newsletterContentSchema.safeParse(payload)
  if (!validation.success) {
    console.error('Issue validation failed', validation.error)
    return { ok: false, error: 'Validation failed' }
  }

  const { data: issue, error: fetchError } = await supabase
    .from('issues')
    .select('id')
    .eq('id', issueId)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (fetchError) {
    console.error('Failed to fetch issue', fetchError)
    return { ok: false, error: 'Issue not found' }
  }

  if (!issue) {
    return { ok: false, error: 'Issue not found' }
  }

  const html = renderNewsletterHtml(validation.data)

  const { error: updateError } = await supabase
    .from('issues')
    .update({
      subject: validation.data.title,
      preheader: validation.data.preheader,
      content_json: validation.data,
      content_html: html,
      updated_at: new Date().toISOString(),
      status: 'generated',
    })
    .eq('id', issueId)

  if (updateError) {
    console.error('Failed to update issue', updateError)
    return { ok: false, error: 'Unable to save issue' }
  }

  revalidatePath(`/editor/${issueId}`)
  revalidatePath('/dashboard')

  return { ok: true }
}
