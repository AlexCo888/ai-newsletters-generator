import { auth, currentUser } from '@clerk/nextjs/server'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { openai } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'

const requestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  topics: z.array(z.string().min(1)).min(1).max(6),
  audience: z.string().min(1).max(200),
  tone: z.string().min(1).max(50),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  mustInclude: z.array(z.string()).max(10).optional(),
  avoid: z.array(z.string()).max(10).optional(),
  callToAction: z.string().max(240).optional(),
  sources: z.array(z.string().url()).max(10).optional(),
  palette: z.object({ primary: z.string().optional(), accent: z.string().optional() }).optional(),
})

const SYSTEM_PROMPT = `You are Aurora, an award-winning newsletter editor. Compose polished newsletter issues.
Return ONLY valid JSON with the schema:
{
  "title": string,
  "preheader": string,
  "intro": string,
  "sections": [
    {
      "title": string,
      "summary": string,
      "pullQuote"?: string,
      "linkSuggestions"?: string[]
    }
  ],
  "outro": string,
  "cta": {
    "headline": string,
    "buttonLabel": string,
    "buttonUrl": string | null
  }
}
- Create 3-5 sections depending on requested length.
- Summaries must be factual and concise.
- Only include links provided by the user; if none, omit linkSuggestions.
- If unsure about a fact, acknowledge uncertainty.
- Tone must match the requested tone.
- Ensure JSON is minified without trailing text.`

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const input = parsed.data

  const supabase = supabaseAdmin()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('Failed to load profile', profileError)
    return NextResponse.json({ error: 'Failed to verify subscription.' }, { status: 500 })
  }

  if (!profile || profile.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Subscription required.' }, { status: 402 })
  }

  const user = await currentUser()
  const userName = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Subscriber'

  const topicsList = input.topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')
  const mustInclude = input.mustInclude?.length ? `Must include: ${input.mustInclude.join('; ')}` : ''
  const avoid = input.avoid?.length ? `Avoid: ${input.avoid.join('; ')}` : ''
  const palette = input.palette
    ? `Brand palette -> Primary: ${input.palette.primary ?? 'default'}, Accent: ${input.palette.accent ?? 'default'}`
    : 'Use a clean, modern palette that matches the tone.'
  const sources = input.sources?.length ? `Approved sources:\n${input.sources.join('\n')}` : 'No external sources supplied.'

  const prompt = `Create a newsletter issue for ${userName} with title "${input.title}".
Audience: ${input.audience}
Tone: ${input.tone}
Preferred length: ${input.length}
Topics:\n${topicsList}
${mustInclude}
${avoid}
Call to action: ${input.callToAction ?? 'Use a friendly invitation to learn more.'}
${palette}
${sources}`

  try {
    const result = await streamText({
      model: openai('gpt-4.1-mini'),
      system: SYSTEM_PROMPT,
      input: prompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
      responseFormat: {
        type: 'json',
      },
    })

    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('AI generation failed', error)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
