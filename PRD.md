# Product Requirements Document (PRD) — AI‑Tailored Newsletter App

## Overview
- Goal: A Next.js 16 (App Router) app that generates and sends AI‑tailored newsletters. Users subscribe ($5/month) to access a guided, delightful prompt‑to‑newsletter experience. Emails are premium‑quality in both content and design.
- Stack: Next.js 16 (App Router, RSC), Tailwind v4, shadcn/ui, Vercel AI SDK 5 + Gateway, Vercel hosting, Clerk (auth), Stripe (billing), Supabase (DB/storage), Resend (email), React Email templates, Windsurf (IDE).
- Guiding principles: Max performance, low cost, secure by default, elegant UX, minimal cognitive load.

## Personas & Core Use Cases
- Solo creator/consultant: Needs niche newsletters that build authority with minimal effort.
- Marketer/SMB owner: Wants recurring, on‑brand updates for audience engagement.
- Enthusiast/researcher: Curates specialized topics with specific tone, sources, and constraints.

Core use cases:
- Subscribe, create profile, set topics/tone/preferences, pick cadence (1/2/4 per month), generate preview, review/edit, schedule, receive and share email. Manage billing and cancellation. View history and performance.

## Features (MVP prioritized)
MVP
- Authentication & Paywall
  - Clerk auth (email/social), session gating, middleware to restrict app routes to paid users.
  - Stripe subscription ($5/month), checkout, billing portal, webhooks to sync active/inactive status.
- Prompt Builder (AI‑assisted)
  - Conversational builder using Vercel AI Elements (chips, examples, inline tips).
  - Fields: themes/topics, target audience, tone/style presets, reading length, must‑include/exclude, CTA, visual vibe (for email design).
  - Real‑time AI preview and “prompt coaching” suggestions.
- Newsletter Generation
  - AI generation pipeline via Vercel AI SDK + Gateway with streaming.
  - Output format: structured JSON (sections, titles, summaries, links, highlights), plus rendered HTML.
  - Safe content filters, prompt length management, retry/fallback model strategy.
- Email Design & Sending
  - React Email + Tailwind for responsive, dark‑mode friendly, accessible templates.
  - Preheader, hero, section cards, pull‑quotes, callouts, dividers, footer with unsubscribe.
  - Resend integration for programmatic sends and event webhooks (delivered, bounced, opened if available).
- Scheduling & Delivery
  - User cadence: 1/month, 2/month, 4/month; user‑selected day/time and timezone.
  - Vercel Cron triggers an API route to enqueue and process due newsletters.
  - Persist generated issues for audit and re‑send; email test send to self.
- Dashboard
  - Overview: next send, cadence, recent issues, status.
  - Editor: light inline edits to AI‑generated content before sending.
  - History: list of issues with status and resend option.
- Settings
  - Profile, topics/tone defaults, cadence/timezone, sender name, reply‑to.
  - Billing link (Stripe portal), unsubscribe management page.
- Admin/Support (basic)
  - Toggle feature flags (via Supabase config).
  - View logs/status of generation jobs.

Post‑MVP/Nice to have
- Source ingestion: user RSS/URLs to summarize; “always include these feeds.”
- A/B subject line testing, open‑rate tracking.
- Multi‑language support.
- Brand kit: colors/logo; per‑user template variants.
- Team seats (additional subscribers).
- Content moderation/classifier for sensitive niches.

## Data Model & Integrations
Supabase (Postgres)
- users (id PK, clerk_user_id unique, email, created_at)
- subscriptions (id PK, user_id FK, stripe_customer_id, stripe_subscription_id, status enum[active,canceled,past_due], current_period_end, created_at, updated_at)
- preferences (id PK, user_id FK unique, cadence enum[1,2,4], send_day int, send_time time, timezone text, topics text[], tone enum[professional,friendly,playful,analytical,editorial,custom], tone_custom text, length enum[short,medium,long], must_include text[], avoid text[], cta text, sender_name text, reply_to text, created_at, updated_at)
- newsletter_templates (id PK, user_id FK, name, template_version, theme jsonb, is_active boolean, created_at)
- issues (id PK, user_id FK, scheduled_at timestamptz, generated_at timestamptz, status enum[pending,generated,scheduled,sent,failed,canceled], subject text, preheader text, content_json jsonb, content_html text, model_used text, tokens_input int, tokens_output int, cost_estimate_cents int, created_at, updated_at)
- jobs (id PK, issue_id FK, type enum[generate,send], status enum[queued,processing,succeeded,failed,retry], attempts int, error text, created_at, updated_at)
- email_events (id PK, issue_id FK, resend_message_id text, event_type text, meta jsonb, created_at)
- audit_logs (id PK, user_id FK, action text, meta jsonb, created_at)

Indexes: clerk_user_id unique, by user_id on main tables, status+scheduled_at on issues, jobs by status.

Integrations
- Clerk: auth, user management, server‑side verification in Server Actions and route handlers.
- Stripe: Checkout (subscription), customer portal, webhooks (subscription created/updated/canceled) to update subscriptions table and Clerk public metadata.
- Resend: sending, sender domain setup, webhooks for events to email_events.
- Vercel AI SDK + Gateway: model routing, streaming, timeouts, retries, caching.
- Vercel Cron: schedule API route every 5 minutes to dispatch due issues.
- React Email: templates with Tailwind; ensure email‑safe CSS.

## App Router Considerations (Next.js 16)
Route structure
- /(marketing)/page: Landing (static, ISR). CTA to sign up.
- /(marketing)/pricing: Static pricing/details.
- /signin, /signup: Clerk components.
- /(app)/dashboard/page: RSC, dynamic; fetch preferences, next send, recent issues.
- /(app)/editor/[issueId]: RSC + client editor for small edits; Server Actions to save/publish.
- /(app)/settings/page: RSC; update preferences via Server Actions.
- /(app)/billing/page: RSC; link to Stripe portal.
- /unsubscribe/[token]: Public API + page to manage opt‑out for recipients.
- /api/ai/preview: POST; generate preview (edge runtime).
- /api/cron/dispatch: Vercel Cron hits; finds due issues, enqueues jobs (node runtime).
- /api/jobs/generate: Processes generate jobs (edge if possible).
- /api/jobs/send: Sends via Resend (node runtime).
- /api/webhooks/stripe, /api/webhooks/resend: Node runtime; verify signatures.
- middleware.ts: Clerk auth; gate /(app) to active subscribers; allow marketing routes/unsubscribe.

RSC and cache
- Marketing pages: static with ISR (revalidate 1 day). Use Route Handlers with cache: 'force-cache'.
- Authed app pages: dynamic = 'force-dynamic' or revalidate: 0; data per user.
- AI preview: streaming responses; use AI SDK’s experimental_stream for immediate UX.
- Server Actions for DB writes; validate Clerk session server‑side.

## Non-functional Requirements
Performance and cost
- TTFB: <200ms on static marketing; <300ms on dashboard initial paint with streaming.
- Use RSC to reduce JS; defer client components where necessary.
- AI costs: cap tokens, ensure JSON‑only mode, generation caching (store content_json/html), dedupe repeated prompts, compress inputs, leverage Gateway timeouts/retries/fallbacks.
- Batch cron processing with concurrency limits to avoid cold‑start storms; exponential backoff on failures.
- Email rendering optimized: inline CSS safe for email; minified HTML.

Security
- Clerk session verification in Server Actions and API handlers; role checks.
- Stripe and Resend webhooks: signature verification, idempotency keys.
- Supabase RLS: per‑row policies on user_id; service role only in server code.
- Secrets via Vercel env vars; no secrets in client.
- Output sanitization of AI HTML; allowlist tags/styles; escape user input.
- Unsubscribe link mandatory; CAN‑SPAM compliant footer.
- Domain auth (SPF/DKIM) for Resend.

Accessibility & UX
- WCAG AA for app and emails; semantic headings, alt text, contrast.
- Keyboard navigable prompt builder; focus states in shadcn.
- Email dark mode support and fallbacks for Outlook.

Observability
- Vercel Analytics + Speed Insights for web.
- AI Gateway logs for latency/cost tracking per model.
- Structured app logs; correlation IDs per job/issue.
- Error tracking (Sentry or Vercel logs) for API, jobs, webhooks.
- Metrics: gen success rate, send success rate, open/bounce if available, latency per step.

Reliability
- Job queue via DB table (jobs) with status/attempts; idempotent processors.
- At‑least‑once cron with safe deduping (issue status gate).
- Circuit breakers when AI/Gateway unavailable; skip and retry later.

## AI Prompting & Generation (MVP)
- System prompt: role as expert newsletter editor. Ask for JSON schema output with fields: subject, preheader, sections[{title, summary, bullets, links[], pull_quote}], cta.
- User prompt builder: tone presets (professional, editorial, witty), “what to avoid,” key sources or themes, length.
- Guardrails: disallow unsafe content; avoid hallucinated links (require source fields or omit); instruct to mark unknown as “no link”.
- Post‑processing: validate JSON schema; regenerate selectively if invalid; sanitize HTML; apply template.

## Email Template (MVP)
- Components: header with logo/sender, hero/title, section cards with imagery placeholders or emoji badges, pull‑quote component, CTA block, footer with unsubscribe and address.
- Preheader text, VML fallbacks for buttons, tested widths, table‑based layout for compatibility.
- Dark mode: color tokens for backgrounds/text/icons; prefers‑color‑scheme meta.

## Scheduling Flow
1) User sets cadence/day/time/timezone.
2) Cron calls /api/cron/dispatch; finds users with due issues; creates issues and jobs.
3) Generate job hits AI; stores content_json/html; updates issue status.
4) Optional user edit window; if not edited by cutoff, proceed.
5) Send job uses Resend; record message ID; listen to webhooks to update status and email_events.

## Open Questions & Assumptions
- Stripe
  - Plan/price IDs and trial policy?
  - Tax settings and invoices locale?
- Email
  - Sender domain and from/reply‑to defaults? Address for CAN‑SPAM footer?
  - Open/click tracking requirements and legal stance?
- AI
  - Default model(s) via Gateway, fallbacks allowed, and max token budgets?
  - Should we enable retrieval from provided URLs/RSS in MVP?
- Legal/Compliance
  - Data retention policy for issues and email events?
  - DPA/Privacy policy texts and region restrictions?
- Branding
  - Name, logo, brand colors; email template assets.
- Rate limiting
  - Do we need an external rate‑limit service or implement DB‑based token bucket?
- Multilingual
  - Initial languages supported? Model choice per locale?

Assumptions
- Users consent to receive emails during signup; unsubscribe link is required and functional.
- MVP targets English content; later expand to other locales.
- Single subscription tier at $5/month; no proration complexities.

## Implementation Notes (quick start)
- Initialize Next.js 16 with App Router; Tailwind v4; shadcn/ui.
- Configure Clerk provider in root layout; middleware to protect /(app).
- Stripe Checkout and portal routes; status mirrored to Supabase subscriptions.
- Supabase schema migration with RLS; service client only in server.
- Vercel AI SDK stream in /api/ai/preview and generation jobs; use Gateway for retries/timeouts.
- React Email templates in /emails; Resend client in server; webhooks to /api/webhooks/resend.
- Vercel Cron schedule calling /api/cron/dispatch every 5 minutes.
- Server Actions for saving preferences, triggering manual preview/generate.
- Static marketing pages with ISR; dynamic app routes for authed content.