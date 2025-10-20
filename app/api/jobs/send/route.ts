import { NextResponse } from 'next/server'

import { sendNewsletterEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'
import { newsletterContentSchema, type NewsletterContent } from '@/lib/newsletter'

export const runtime = 'nodejs'

type JobRow = {
  id: string
  issue_id: string
  status: string
  attempts: number
}

type DeliveryRow = {
  id: string
  to_email: string
  payload: Record<string, unknown> | null
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SIGNATURE_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const requestedJobId = body?.jobId ? String(body.jobId) : null

  const supabase = supabaseAdmin()

  let job: JobRow | null = null

  if (requestedJobId) {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, issue_id, status, attempts')
      .eq('id', requestedJobId)
      .eq('type', 'send')
      .maybeSingle()

    if (error) {
      console.error('Failed to load requested send job', error)
      return NextResponse.json({ error: 'Unable to fetch job' }, { status: 500 })
    }

    job = data as JobRow | null
  } else {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, issue_id, status, attempts')
      .eq('type', 'send')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch queued send job', error)
      return NextResponse.json({ error: 'Unable to fetch job' }, { status: 500 })
    }

    job = data as JobRow | null
  }

  if (!job) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  if (job.status !== 'queued') {
    return NextResponse.json({ ok: true, processed: 0, message: 'Job already processed' })
  }

  const { error: markProcessingError } = await supabase
    .from('jobs')
    .update({ status: 'processing', attempts: job.attempts + 1, updated_at: new Date().toISOString() })
    .eq('id', job.id)

  if (markProcessingError) {
    console.error('Failed to mark send job processing', markProcessingError)
    return NextResponse.json({ error: 'Unable to mark job processing' }, { status: 500 })
  }

  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .select('id, content_json')
    .eq('id', job.issue_id)
    .maybeSingle()

  if (issueError || !issue) {
    console.error('Failed to load issue for send job', issueError)
    await supabase
      .from('jobs')
      .update({ status: 'failed', error: 'Issue not found', updated_at: new Date().toISOString() })
      .eq('id', job.id)
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  }

  const { data: deliveries, error: deliveriesError } = await supabase
    .from('deliveries')
    .select('id, to_email, payload')
    .eq('issue_id', job.issue_id)
    .eq('status', 'scheduled')
    .limit(20)

  if (deliveriesError) {
    console.error('Failed to load deliveries for send job', deliveriesError)
    await supabase
      .from('jobs')
      .update({ status: 'failed', error: 'Unable to load deliveries', updated_at: new Date().toISOString() })
      .eq('id', job.id)
    return NextResponse.json({ error: 'Unable to load deliveries' }, { status: 500 })
  }

  const pendingDeliveries = (deliveries ?? []) as DeliveryRow[]

  if (pendingDeliveries.length === 0) {
    await supabase
      .from('jobs')
      .update({
        status: 'succeeded',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let sent = 0

  for (const delivery of pendingDeliveries) {
    try {
      const source = delivery.payload ?? issue.content_json ?? null
      const parsed = newsletterContentSchema.safeParse(source)

      if (!parsed.success) {
        console.error('Invalid newsletter payload for delivery', delivery.id, parsed.error)
        await supabase
          .from('deliveries')
          .update({ status: 'failed', error: 'Invalid newsletter payload' })
          .eq('id', delivery.id)
        continue
      }

      const payload: NewsletterContent = parsed.data

      await sendNewsletterEmail(delivery.to_email, payload)

      await supabase
        .from('deliveries')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', delivery.id)

      sent++

      // basic pacing to respect Resend limits (~2 req/s)
      await new Promise((resolve) => setTimeout(resolve, 600))
    } catch (error) {
      console.error('Failed to send delivery', delivery.id, error)
      await supabase
        .from('deliveries')
        .update({ status: 'failed', error: error instanceof Error ? error.message : 'Failed to send' })
        .eq('id', delivery.id)
    }
  }

  await supabase
    .from('jobs')
    .update({
      status: 'succeeded',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id)

  return NextResponse.json({ ok: true, processed: sent })
}
