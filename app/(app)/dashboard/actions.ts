'use server'

import { revalidatePath } from 'next/cache'
import { currentUser } from '@clerk/nextjs/server'
import { generateText } from 'ai'

import { openaiModel } from '@/lib/ai'
import { requireActiveSubscription } from '@/lib/auth'
import { sendNewsletterEmail } from '@/lib/email'
import { newsletterContentSchema, renderNewsletterHtml, sanitizeNewsletterPayload, type NewsletterContent } from '@/lib/newsletter'
import { supabaseAdmin } from '@/lib/supabase'

type TriggerFirstIssueResult =
  | { ok: true; issueId: string }
  | { ok: false; error: 'missing_preferences' | 'missing_topics' | 'profile_email_missing' | 'generation_failed' | 'validation_failed' | 'issue_creation_failed' | 'delivery_creation_failed' | 'send_failed' | 'unexpected'; message?: string }

export async function triggerFirstIssue(): Promise<TriggerFirstIssueResult> {
  const profile = await requireActiveSubscription()
  const supabase = supabaseAdmin()

  const { data: preferences, error: preferencesError } = await supabase
    .from('preferences')
    .select('topics, tone, tone_custom, length, must_include, avoid, cta, sender_name')
    .eq('user_id', profile.id)
    .maybeSingle()

  if (preferencesError) {
    console.error('Failed to load preferences for manual trigger', preferencesError)
    return { ok: false, error: 'missing_preferences', message: 'Unable to load your preferences. Please try again.' }
  }

  if (!preferences) {
    return { ok: false, error: 'missing_preferences', message: 'Set your newsletter preferences before generating the first issue.' }
  }

  const topics = Array.isArray(preferences.topics) ? (preferences.topics as string[]) : []
  if (!topics.length) {
    return { ok: false, error: 'missing_topics', message: 'Add at least one topic in preferences to personalize the newsletter.' }
  }

  const mustInclude = Array.isArray(preferences.must_include) ? (preferences.must_include as string[]) : []
  const avoid = Array.isArray(preferences.avoid) ? (preferences.avoid as string[]) : []

  const tone =
    preferences.tone === 'custom'
      ? preferences.tone_custom?.trim() || 'custom'
      : (preferences.tone as string | null) ?? 'professional'

  const user = await currentUser()
  const recipientEmail = profile.email ?? user?.primaryEmailAddress?.emailAddress ?? null

  if (!recipientEmail) {
    return { ok: false, error: 'profile_email_missing', message: 'We need a destination email before sending. Please add an email in settings.' }
  }

  const promptSections = [
    `Generate a premium newsletter for ${user?.fullName ?? 'our subscriber'}.`,
    `Tone: ${tone}`,
    `Preferred cadence length: ${preferences.length ?? 'medium'}`,
    `Topics:\n${topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}`,
    mustInclude.length ? `Must include: ${mustInclude.join('; ')}` : '',
    avoid.length ? `Avoid: ${avoid.join('; ')}` : '',
    preferences.cta ? `Call to action: ${preferences.cta}` : '',
    preferences.sender_name ? `Sender name: ${preferences.sender_name}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  let generated: NewsletterContent

  try {
    const result = await generateText({
      model: openaiModel('gpt-4.1-mini'),
      system:
        'You are Aurora, an award-winning newsletter editor. Return minified JSON matching the schema { "title": string, "preheader": string, "intro"?: string, "sections": [{ "title": string, "summary": string, "pullQuote"?: string, "linkSuggestions"?: string[] }], "outro"?: string, "cta"?: { "headline"?: string, "buttonLabel"?: string, "buttonUrl"?: string|null } }. Keep facts accurate, tone aligned, and never invent links.',
      prompt: promptSections,
      temperature: 0.7,
      maxTokens: 2000,
    })

    const parsedPayload = sanitizeNewsletterPayload(JSON.parse(result.text))
    const validation = newsletterContentSchema.safeParse(parsedPayload)

    if (!validation.success) {
      console.error('Manual generation validation failed', validation.error)
      return { ok: false, error: 'validation_failed', message: 'Generation returned unexpected format. Please try again.' }
    }

    generated = validation.data
  } catch (error) {
    console.error('Manual generation failed', error)
    return { ok: false, error: 'generation_failed', message: 'Generation failed. Please try again in a moment.' }
  }

  const now = new Date().toISOString()
  const html = renderNewsletterHtml(generated)

  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .insert({
      user_id: profile.id,
      scheduled_at: now,
      generated_at: now,
      status: 'generated',
      subject: generated.title,
      preheader: generated.preheader,
      content_json: generated,
      content_html: html,
      model_used: 'gpt-4.1-mini',
    })
    .select('id')
    .maybeSingle()

  if (issueError || !issue) {
    console.error('Failed to create issue for manual trigger', issueError)
    return { ok: false, error: 'issue_creation_failed', message: 'Could not store the generated issue.' }
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .insert({
      issue_id: issue.id,
      user_id: profile.id,
      to_email: recipientEmail,
      payload: generated,
      status: 'scheduled',
      send_at: now,
    })
    .select('id')
    .maybeSingle()

  if (deliveryError || !delivery) {
    console.error('Failed to create delivery for manual trigger', deliveryError)
    return { ok: false, error: 'delivery_creation_failed', message: 'Could not queue the email delivery.' }
  }

  try {
    await sendNewsletterEmail(recipientEmail, generated)

    await supabase
      .from('deliveries')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', delivery.id)

    await supabase
      .from('issues')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', issue.id)
  } catch (error) {
    console.error('Failed to send newsletter for manual trigger', error)

    await supabase
      .from('deliveries')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to send via Resend',
      })
      .eq('id', delivery.id)

    await supabase.from('issues').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', issue.id)

    return { ok: false, error: 'send_failed', message: 'Email send failed. Please check your email settings.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard?view=issues')

  return { ok: true, issueId: issue.id }
}
