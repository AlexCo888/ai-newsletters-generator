import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type DeliveryRecord = {
  id: string
  issue_id: string
  send_at: string
}

export async function GET(request: Request) {
  const signature = request.headers.get('x-cron-signature')
  if (!signature || signature !== process.env.CRON_SIGNATURE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = supabaseAdmin()

  const { data: dueDeliveries, error } = await supabase
    .from('deliveries')
    .select('id, issue_id, send_at')
    .lte('send_at', new Date().toISOString())
    .eq('status', 'scheduled')
    .limit(20)

  if (error) {
    console.error('Failed to load due deliveries', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const deliveries = (dueDeliveries as DeliveryRecord[] | null) ?? []

  if (!deliveries.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const queuedIssues = new Set<string>()
  let queuedJobs = 0

  for (const delivery of deliveries) {
    if (queuedIssues.has(delivery.issue_id)) {
      continue
    }

    const { data: existingJob, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('issue_id', delivery.issue_id)
      .eq('type', 'send')
      .not('status', 'in', '("failed","succeeded")')
      .maybeSingle()

    if (jobError) {
      console.error('Failed to check send job for issue', delivery.issue_id, jobError)
      continue
    }

    if (existingJob) {
      queuedIssues.add(delivery.issue_id)
      continue
    }

    const { error: insertError } = await supabase.from('jobs').insert({
      issue_id: delivery.issue_id,
      type: 'send',
      status: 'queued',
      attempts: 0,
    })

    if (insertError) {
      console.error('Failed to queue send job', insertError)
      continue
    }

    queuedIssues.add(delivery.issue_id)
    queuedJobs++
  }

  return NextResponse.json({ ok: true, queued: queuedJobs })
}
