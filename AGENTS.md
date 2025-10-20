# AGENTS — Codegen Guidance & Constraints (Updated)

## Mission
Generate all files listed in IMPLEMENTATION.md §5 exactly. Do not scaffold unused files.

## Order of operations
1) Create env examples and install dependencies.
2) Add PostCSS + `globals.css` for Tailwind v4.
3) Create `middleware.ts`, `app/layout.tsx`.
4) Add libraries: `lib/ai.ts`, `lib/stripe.ts`, `lib/supabase.ts`, `lib/email.ts`.
5) Create API routes: `/api/generate`, `/api/checkout`, `/api/webhooks/stripe`, `/api/cron/deliveries`.
6) Add email template in `/emails`.
7) Add `vercel.json` (crons).
8) (Optional later) Marketing pages & dashboard shells.

## Guardrails & style
- **Auth:** Use Clerk `auth()`/`currentUser()` in server code for paywall; middleware alone is **not sufficient**.
- **Stripe webhooks:** Node runtime; verify signature with **raw** body via `await req.text()`.
- **AI streaming:** Use AI SDK v5 `streamText` + `toTextStreamResponse()`.
- **Gateway:** Use `https://ai-gateway.vercel.sh/v1` with `AI_GATEWAY_API_KEY`.
- **Tailwind v4:** `@import "tailwindcss";` and `@tailwindcss/postcss` plugin; no legacy `tailwind.config.js` needed for basic setup.
- **Resend:** Respect default ~2 req/s; consider batching in cron.
- **Supabase:** Enable RLS; service role key is server‑only.

## Acceptance checks (must pass)
- `npm run dev` starts; Tailwind classes apply.
- `/api/generate` returns a streaming response; `/api/checkout` opens Stripe session.
- Posting Stripe test events updates `profiles.subscription_status`.
- Cron endpoint returns `{ ok: true }` and processes due records.

## Notes on runtimes
- Default Node runtime is fine everywhere; keep **webhooks** on Node. Edge may be used for pure compute later.
