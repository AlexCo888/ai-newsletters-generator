import { NextResponse } from 'next/server'

import { sendNewsletterEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const signature = request.headers.get('x-cron-signature')
  if (!signature || signature !== process.env.CRON_SIGNATURE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = supabaseAdmin()
  const { data: dueIssues, error } = await supabase
    .from('issues')
    .select('id, user_id, subject, preheader, content_json, status, scheduled_at')
    .lte('scheduled_at', new Date().toISOString())
    .eq('status', 'scheduled')
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!dueIssues?.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let processed = 0
  const failures: { id: string; reason: string }[] = []

  for (const issue of dueIssues) {
    const { error: updateError } = await supabase
      .from('issues')
      .update({ status: 'processing' })
      .eq('id', issue.id)
      .eq('status', 'scheduled')

    if (updateError) {
      failures.push({ id: issue.id, reason: updateError.message })
      continue
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, sender_name, reply_to')
      .eq('clerk_user_id', issue.user_id)
      .maybeSingle()

    if (profileError || !profile?.email) {
      await supabase
        .from('issues')
        .update({ status: 'failed' })
        .eq('id', issue.id)

      failures.push({ id: issue.id, reason: profileError?.message ?? 'Missing recipient email' })
      continue
    }

    const content = (issue.content_json as any) ?? {}

    try {
      await sendNewsletterEmail(profile.email, {
        title: issue.subject ?? content.subject ?? 'Your AI Newsletter',
        preheader: issue.preheader ?? content.preheader,
        intro: content.intro,
        sections: content.sections,
        outro: content.outro,
        cta: content.cta,
        palette: content.palette,
        unsubscribeUrl: content.unsubscribeUrl,
        senderName: profile.sender_name ?? 'AI Newsletters',
        supportEmail: profile.reply_to ?? undefined,
      })

      await supabase
        .from('issues')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', issue.id)

      processed += 1
    } catch (sendError) {
      await supabase
        .from('issues')
        .update({ status: 'failed' })
        .eq('id', issue.id)

      const message = sendError instanceof Error ? sendError.message : 'Failed to send email'
      failures.push({ id: issue.id, reason: message })
    }
  }

  return NextResponse.json({ ok: true, processed, failed: failures })
}
