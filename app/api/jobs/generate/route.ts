import { generateText } from 'ai'
import { NextResponse } from 'next/server'

import { openaiModel } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'
import { newsletterContentSchema, renderNewsletterHtml, sanitizeNewsletterPayload } from '@/lib/newsletter'

export const runtime = 'edge'

const SYSTEM_PROMPT = `You are Aurora, an award-winning newsletter editor.
Generate newsletter JSON with:
{
  "title": string,
  "preheader": string,
  "intro": string,
  "sections": [{ "title": string, "summary": string, "pullQuote"?: string, "linkSuggestions"?: string[] }],
  "outro": string,
  "cta": { "headline": string, "buttonLabel": string, "buttonUrl": string | null }
}
- Keep language factual and aligned with the requested tone.
- Only include provided sources in linkSuggestions.
- Ensure JSON is valid and minified.`

type JobRow = {
  id: string
  issue_id: string
  status: string
  attempts: number
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
      .eq('type', 'generate')
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch requested job', error)
      return NextResponse.json({ error: 'Unable to fetch job' }, { status: 500 })
    }

    job = data as JobRow | null
  } else {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, issue_id, status, attempts')
      .eq('type', 'generate')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch queued job', error)
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
    console.error('Failed to mark job processing', markProcessingError)
    return NextResponse.json({ error: 'Unable to mark job processing' }, { status: 500 })
  }

  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .select('id, user_id, subject, preheader, status, scheduled_at, content_json')
    .eq('id', job.issue_id)
    .maybeSingle()

  if (issueError || !issue) {
    console.error('Failed to load issue for job', issueError)
    await supabase
      .from('jobs')
      .update({ status: 'failed', error: 'Issue not found', updated_at: new Date().toISOString() })
      .eq('id', job.id)
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  }

  const { data: preferences, error: preferencesError } = await supabase
    .from('preferences')
    .select('topics, tone, length, must_include, avoid, cta, sender_name')
    .eq('user_id', issue.user_id)
    .maybeSingle()

  if (preferencesError) {
    console.error('Failed to load preferences', preferencesError)
  }

  const topics = Array.isArray(preferences?.topics) ? preferences?.topics : []
  const mustInclude = Array.isArray(preferences?.must_include) ? preferences?.must_include : []
  const avoid = Array.isArray(preferences?.avoid) ? preferences?.avoid : []

  const promptSections = [
    issue.subject ? `Existing subject: ${issue.subject}` : '',
    issue.preheader ? `Existing preheader: ${issue.preheader}` : '',
    topics.length ? `Topics:\n${topics.map((topic: string, index: number) => `${index + 1}. ${topic}`).join('\n')}` : '',
    mustInclude.length ? `Must include: ${mustInclude.join('; ')}` : '',
    avoid.length ? `Avoid: ${avoid.join('; ')}` : '',
    preferences?.cta ? `Preferred CTA: ${preferences.cta}` : '',
    preferences?.sender_name ? `Sender name: ${preferences.sender_name}` : '',
    `Tone: ${preferences?.tone ?? 'professional'}`,
    `Length: ${preferences?.length ?? 'medium'}`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const result = await generateText({
      model: openaiModel('gpt-4.1-mini'),
      system: SYSTEM_PROMPT,
      prompt: promptSections,
      temperature: 0.7,
      maxTokens: 2000,
    })

    const parsed = sanitizeNewsletterPayload(JSON.parse(result.text))
    const validation = newsletterContentSchema.safeParse(parsed)

    if (!validation.success) {
      console.error('Generated content failed validation', validation.error)
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          error: 'Validation failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }

    const html = renderNewsletterHtml(validation.data)

    const { error: updateIssueError } = await supabase
      .from('issues')
      .update({
        subject: validation.data.title,
        preheader: validation.data.preheader,
        content_json: validation.data,
        content_html: html,
        generated_at: new Date().toISOString(),
        status: 'generated',
        model_used: 'gpt-4.1-mini',
      })
      .eq('id', issue.id)

    if (updateIssueError) {
      console.error('Failed to update issue with generated content', updateIssueError)
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          error: 'Update failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    await supabase
      .from('jobs')
      .update({
        status: 'succeeded',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return NextResponse.json({ ok: true, processed: 1, issueId: issue.id })
  } catch (error) {
    console.error('Generation job failed', error)
    await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
