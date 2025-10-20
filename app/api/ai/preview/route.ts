import { auth } from '@clerk/nextjs/server'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { openaiModel } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'

const previewSchema = z.object({
  prompt: z.string().min(10, 'Prompt is too short').max(1600),
  tone: z.string().min(1).max(50).optional(),
  audience: z.string().min(1).max(200).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
})

const PREVIEW_SYSTEM_PROMPT = `You are Aurora, an expert newsletter strategist.
Given a prompt, outline a preview of the upcoming newsletter.
Return JSON with keys:
{
  "subject": string,
  "preheader": string,
  "sections": [
    { "title": string, "summary": string }
  ],
  "cta": string
}
- Keep total response under 180 words.
- Sections should be concise bullet-friendly summaries.
- CTA should be a single sentence recommendation.`

export const runtime = 'edge'

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = previewSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = supabaseAdmin()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load profile for preview', error)
    return NextResponse.json({ error: 'Unable to verify subscription' }, { status: 500 })
  }

  if (!profile || profile.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Active subscription required' }, { status: 402 })
  }

  const { prompt, tone, audience, length } = parsed.data

  const composedPrompt = [
    `Prompt: ${prompt}`,
    tone ? `Tone: ${tone}` : '',
    audience ? `Audience: ${audience}` : '',
    length ? `Preferred length: ${length}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const result = await streamText({
      model: openaiModel('gpt-4.1-mini'),
      system: PREVIEW_SYSTEM_PROMPT,
      prompt: composedPrompt,
      temperature: 0.7,
      maxTokens: 600,
    })

    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Preview generation failed', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
