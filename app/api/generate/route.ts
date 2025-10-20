import { auth } from '@clerk/nextjs/server'
import { streamText, toTextStreamResponse } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { openai } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'

const requestSchema = z.object({
  topics: z.array(z.string()).default([]),
  audience: z.string().optional(),
  tone: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  mustInclude: z.array(z.string()).default([]),
  avoid: z.array(z.string()).default([]),
  callToAction: z.string().optional(),
  vibe: z.string().optional(),
  extraContext: z.string().optional(),
})

function buildPrompt(payload: z.infer<typeof requestSchema>) {
  const lines = [
    'You are an expert newsletter editor writing on behalf of a subscription business.',
    'Return a strict JSON object with fields: subject, preheader, intro, outro, sections[], palette, cta.',
    'Each section needs title, summary, highlights (array of bullet strings), linkSuggestions (array of URLs), optional pullQuote.',
    'If you are unsure of a link, omit it instead of hallucinating.',
    'Tone should match the requested tone and vibe. Provide actionable insights.',
    `Desired reading length: ${payload.length}.`,
  ]

  if (payload.topics.length) {
    lines.push(`Focus topics: ${payload.topics.join(', ')}.`)
  }
  if (payload.audience) {
    lines.push(`Target audience: ${payload.audience}.`)
  }
  if (payload.tone) {
    lines.push(`Preferred tone: ${payload.tone}.`)
  }
  if (payload.mustInclude.length) {
    lines.push(`Must include: ${payload.mustInclude.join('; ')}.`)
  }
  if (payload.avoid.length) {
    lines.push(`Avoid: ${payload.avoid.join('; ')}.`)
  }
  if (payload.callToAction) {
    lines.push(`Call to action: ${payload.callToAction}.`)
  }
  if (payload.vibe) {
    lines.push(`Visual vibe: ${payload.vibe}.`)
  }
  if (payload.extraContext) {
    lines.push(`Additional guidance: ${payload.extraContext}.`)
  }

  return lines.join('\n')
}

export async function POST(request: Request) {
  const { userId, sessionId } = auth()

  if (!userId || !sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = supabaseAdmin()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (!profile || profile.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
  }

  const json = await request.json().catch(() => null)
  if (!json) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parseResult = requestSchema.safeParse(json)
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 })
  }

  const prompt = buildPrompt(parseResult.data)

  const stream = await streamText({
    model: openai('gpt-4.1-mini'),
    temperature: 0.7,
    maxTokens: 1024,
    system: prompt,
    messages: [
      {
        role: 'user',
        content: 'Generate the newsletter JSON. Respond with JSON only, no prose.',
      },
    ],
  })

  return toTextStreamResponse(stream)
}
