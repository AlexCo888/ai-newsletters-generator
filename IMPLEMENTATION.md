# IMPLEMENTATION — One‑Shot Codegen Plan (CONSIDER WE ARE USING PNPM IN OUR PROJECT IF NEEDED)

## 0) Prereqs
- Node 20+, Vercel account (project + Cron + AI Gateway), Stripe, Clerk, Supabase, Resend (verified domain).

## 1) Bootstrap
```bash
npx create-next-app@latest ai-newsletters-generator --ts --eslint --app --no-src-dir --use-npm
cd ai-newsletters-generator
```

## 2) Install deps
```bash
npm i ai @ai-sdk/openai @clerk/nextjs stripe @supabase/supabase-js resend @react-email/components sonner zod lucide-react tailwind-merge clsx date-fns
npm i -D tailwindcss @tailwindcss/postcss postcss
```

## 3) Tailwind v4 setup
Create **postcss.config.mjs**:
```js
export default { plugins: { "@tailwindcss/postcss": {} } }
```
Create **app/globals.css**:
```css
@import "tailwindcss";
@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter;
  --color-brand-500: oklch(0.68 0.15 262);
}
html, body { font-family: var(--font-sans); }
```

## 4) Environment variables
Create **.env.local** (and **.env.local.example**):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=Newsletters <news@yourdomain.com>
AI_GATEWAY_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SIGNATURE_SECRET=
```

## 5) Files to create (exact paths + contents)

### 5.1 `vercel.json` — Cron
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/cron/deliveries", "schedule": "*/5 * * * *" }]
}
```

### 5.2 `middleware.ts` — Clerk middleware (public routes only)
```ts
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware({
  publicRoutes: [
    '/',
    '/pricing',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/stripe',
    '/api/webhooks/resend',
  ],
})

export const config = {
  matcher: ['/((?!_next|.*\..*).*)'],
}
```

### 5.3 `app/layout.tsx`
```tsx
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Newsletters',
  description: 'AI‑tailored newsletters',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          {children}
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### 5.4 `lib/ai.ts` — AI SDK v5 via AI Gateway
```ts
import { createOpenAI } from '@ai-sdk/openai'

export const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
})
```

### 5.5 `app/api/generate/route.ts` — streaming text
```ts
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
```

### 5.6 `lib/stripe.ts`
```ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})
```

### 5.7 `app/api/checkout/route.ts`
```ts
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    customer_email: email,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    metadata: { clerk_user_id: userId },
  })

  return NextResponse.json({ url: session.url })
}
```

### 5.8 `lib/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = () =>
  createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
```

### 5.9 `app/api/webhooks/stripe/route.ts` — Node runtime + raw body verify
```ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const sig = headers().get('stripe-signature')!
  const body = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supa = supabaseAdmin()

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as any
      const clerk_user_id = s.metadata?.clerk_user_id
      const stripe_customer_id = s.customer?.toString()
      if (clerk_user_id) {
        await supa.from('profiles').upsert(
          {
            clerk_user_id,
            email: s.customer_details?.email ?? null,
            stripe_customer_id,
            subscription_status: 'active',
          },
          { onConflict: 'clerk_user_id' },
        )
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any
      await supa
        .from('profiles')
        .update({ subscription_status: sub.status === 'active' ? 'active' : sub.status })
        .eq('stripe_customer_id', sub.customer?.toString())
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

### 5.10 `lib/email.ts` + `emails/Newsletter.tsx`
```ts
// lib/email.ts
import { Resend } from 'resend'
import Newsletter from '@/emails/Newsletter'
const resend = new Resend(process.env.RESEND_API_KEY!)
export async function sendNewsletterEmail(to: string, data: Parameters<typeof Newsletter>[0]) {
  return await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: data.title || 'Your AI Newsletter',
    react: Newsletter(data) as any,
  })
}
```
```tsx
// emails/Newsletter.tsx
import { Html, Body, Container, Heading, Text, Hr, Link, Section } from '@react-email/components'

type SectionT = { title: string; summary: string; linkSuggestions?: string[] }
export default function Newsletter({ title = 'Your AI Newsletter', intro, sections = [], outro, palette }: {
  title?: string; intro?: string; sections?: SectionT[]; outro?: string; palette?: { primary?: string; accent?: string }
}) {
  const primary = palette?.primary ?? '#0f172a'
  const accent = palette?.accent ?? '#2563eb'
  return (
    <Html>
      <Body style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
        <Container style={{ backgroundColor: 'white', margin: '24px auto', padding: 24, borderRadius: 8, width: 640 }}>
          <Heading style={{ margin: '0 0 8px', color: primary }}>{title}</Heading>
          {intro && <Text style={{ color: '#475569', fontSize: 16 }}>{intro}</Text>}
          <Hr />
          {sections.map((s, i) => (
            <Section key={i} style={{ marginBottom: 16 }}>
              <Heading as="h3" style={{ margin: 0, color: primary }}>{s.title}</Heading>
              <Text style={{ color: '#334155' }}>{s.summary}</Text>
              {!!s.linkSuggestions?.length && (
                <ul>
                  {s.linkSuggestions.map((l, j) => (
                    <li key={j}><Link href={l} style={{ color: accent }}>{l}</Link></li>
                  ))}
                </ul>
              )}
            </Section>
          ))}
          {outro && (<><Hr /><Text style={{ color: '#475569' }}>{outro}</Text></>)}
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            You are receiving this newsletter from AI Newsletters.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### 5.11 `app/api/cron/deliveries/route.ts`
```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const sig = request.headers.get('x-cron-signature')
  if (!sig || sig !== process.env.CRON_SIGNATURE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supa = supabaseAdmin()
  const { data: due, error } = await supa
    .from('deliveries')
    .select('id, send_at')
    .lte('send_at', new Date().toISOString())
    .eq('status', 'scheduled')
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // TODO: generate content (if not generated) and send via Resend

  return NextResponse.json({ ok: true, processed: due?.length ?? 0 })
}
```

## 6) Database (Supabase)
- Create tables and enable RLS; writes via server role only. (See PRD Data Model.)

## 7) Deployment
- Set all env vars in Vercel.  
- Add `vercel.json` `crons`. Cron jobs run on production deployment.
- Configure Stripe webhook → `/api/webhooks/stripe` (Node runtime; raw body).
- AI Gateway: point provider baseURL to `https://ai-gateway.vercel.sh/v1` with `AI_GATEWAY_API_KEY`.

## 8) Quick verification checklist
- Sign in with Clerk; unpaid users redirect to /pricing (server check).
- Stripe checkout works; webhook flips subscription status.
- `/api/generate` streams text.
- Cron hits `/api/cron/deliveries` and processes due sends.
