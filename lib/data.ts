import { supabaseAdmin } from '@/lib/supabase'

export type PreferenceRecord = {
  id: string
  user_id: string
  cadence: 1 | 2 | 4
  send_day: number | null
  send_time: string | null
  timezone: string | null
  topics: string[] | null
  tone: string | null
  tone_custom: string | null
  length: 'short' | 'medium' | 'long' | null
  must_include: string[] | null
  avoid: string[] | null
  cta: string | null
  sender_name: string | null
  reply_to: string | null
  created_at: string | null
  updated_at: string | null
}

export type IssueRecord = {
  id: string
  user_id: string
  scheduled_at: string | null
  generated_at: string | null
  status: 'pending' | 'generated' | 'scheduled' | 'sent' | 'failed' | 'canceled'
  subject: string | null
  preheader: string | null
  content_json: Record<string, unknown> | null
  content_html: string | null
  model_used: string | null
  created_at: string | null
  updated_at: string | null
}

export async function getPreferences(userId: string) {
  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from('preferences')
    .select(
      'id, user_id, cadence, send_day, send_time, timezone, topics, tone, tone_custom, length, must_include, avoid, cta, sender_name, reply_to, created_at, updated_at'
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load preferences', error)
    throw new Error('Unable to load preferences')
  }

  return data as PreferenceRecord | null
}

export async function getRecentIssues(userId: string, limit = 5) {
  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from('issues')
    .select(
      'id, user_id, scheduled_at, generated_at, status, subject, preheader, created_at, updated_at, content_json, content_html, model_used'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to load issues', error)
    throw new Error('Unable to load recent issues')
  }

  return (data ?? []) as IssueRecord[]
}

export async function getIssue(issueId: string, userId: string) {
  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from('issues')
    .select(
      'id, user_id, scheduled_at, generated_at, status, subject, preheader, created_at, updated_at, content_json, content_html, model_used'
    )
    .eq('id', issueId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load issue', error)
    throw new Error('Unable to load issue')
  }

  return data as IssueRecord | null
}

export async function getNextScheduledIssue(userId: string) {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('issues')
    .select(
      'id, user_id, scheduled_at, generated_at, status, subject, preheader, created_at, updated_at, content_json, content_html, model_used'
    )
    .eq('user_id', userId)
    .neq('status', 'sent')
    .neq('status', 'canceled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Failed to load next scheduled issue', error)
    throw new Error('Unable to load next issue')
  }

  return data as IssueRecord | null
}

