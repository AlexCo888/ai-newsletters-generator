import { auth } from '@clerk/nextjs/server'
import { streamText } from 'ai'
import { openai } from '@/lib/ai'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { prompt, style, topics, avoid, numItems = 5 } = await req.json()

  const system = `You are an award-winning newsletter editor and designer.
Write irresistible, skimmable newsletters with smart sectioning, catchy headings,
 tastefully used emoji, subtle humor, and clear calls-to-action.`

  const user = `
Create a newsletter with:
- Core brief: ${prompt}
- Style prefs: ${JSON.stringify(style)}
- Topics: ${Array.isArray(topics) ? topics.join(', ') : ''}
- Avoid: ${Array.isArray(avoid) ? avoid.join(', ') : ''}
- Items: ${numItems}
Format as JSON with keys: title, intro, sections[{title, summary, linkSuggestions[]}], outro, palette{primary,accent}, emojis.
`.trim()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system,
    prompt: user,
  })
  return result.toTextStreamResponse()
}
