import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

type IssueRow = {
  id: string
  user_id: string
  status: string
  scheduled_at: string | null
}

export async function GET(request: Request) {
  const signature = request.headers.get('x-cron-signature')

  if (!signature || signature !== process.env.CRON_SIGNATURE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = supabaseAdmin()
  const now = new Date().toISOString()

  const { data: dueIssues, error } = await supabase
    .from('issues')
    .select('id, user_id, status, scheduled_at')
    .lte('scheduled_at', now)
    .in('status', ['pending', 'scheduled'])
    .limit(25)

  if (error) {
    console.error('Failed to fetch due issues', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const issues = (dueIssues ?? []) as IssueRow[]
  if (!issues.length) {
    return NextResponse.json({ ok: true, queued: 0 })
  }

  let queued = 0

  for (const issue of issues) {
    const { data: existingJob, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('issue_id', issue.id)
      .eq('type', 'generate')
      .not('status', 'in', '("failed","succeeded")')
      .maybeSingle()

    if (jobError) {
      console.error('Failed to check existing job', jobError)
      continue
    }

    if (existingJob) {
      continue
    }

    const { error: insertError } = await supabase.from('jobs').insert({
      issue_id: issue.id,
      type: 'generate',
      status: 'queued',
      attempts: 0,
    })

    if (insertError) {
      console.error('Failed to queue job', insertError)
      continue
    }

    queued++
  }

  return NextResponse.json({ ok: true, queued })
}

