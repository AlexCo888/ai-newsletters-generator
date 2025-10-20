# CODEGEN_TASKS — Exact Files & Content the Agent Must Create

> This “manifest” lets a codegen agent produce the app in one pass.

## Files to create or replace

1. **postcss.config.mjs** — Tailwind v4 PostCSS plugin  
   (see IMPLEMENTATION.md §3)

2. **app/globals.css** — Tailwind v4 CSS import + basic theme  
   (see IMPLEMENTATION.md §3)

3. **middleware.ts** — Clerk middleware with `publicRoutes`  
   (see IMPLEMENTATION.md §5.2)

4. **app/layout.tsx** — `ClerkProvider` + `Toaster`  
   (see IMPLEMENTATION.md §5.3)

5. **lib/ai.ts** — AI Gateway OpenAI provider for AI SDK v5  
   (see IMPLEMENTATION.md §5.4)

6. **app/api/generate/route.ts** — AI streaming with `toTextStreamResponse()`  
   (see IMPLEMENTATION.md §5.5)

7. **lib/stripe.ts** — Stripe SDK with pinned API version  
   (see IMPLEMENTATION.md §5.6)

8. **app/api/checkout/route.ts** — Checkout session  
   (see IMPLEMENTATION.md §5.7)

9. **app/api/webhooks/stripe/route.ts** — Node runtime + raw body verify  
   (see IMPLEMENTATION.md §5.9)

10. **lib/supabase.ts** — server admin client (service role)  
    (see IMPLEMENTATION.md §5.8)

11. **lib/email.ts** and **emails/Newsletter.tsx** — React Email + Resend  
    (see IMPLEMENTATION.md §5.10)

12. **app/api/cron/deliveries/route.ts** — secure cron handler  
    (see IMPLEMENTATION.md §5.11)

13. **vercel.json** — cron schedule  
    (see IMPLEMENTATION.md §5.1)

14. **.env.local.example** — environment keys  
    (see IMPLEMENTATION.md §4)

## After generation
- `npm run dev`
- Connect Stripe CLI for local webhook testing; verify signature checks with raw body.
- Verify Tailwind v4 builds with PostCSS plugin.

## Doc freshness
This plan reflects 2025‑10 vendor guidance and integrates Tailwind v4, AI SDK v5 helpers, AI Gateway base URL, Clerk server‑side checks, Stripe raw‑body Node webhook, Supabase RLS, Resend, and Vercel Cron.
