# AI Newsletters Generator

AI-powered newsletter automation built with Next.js 16 App Router, Tailwind v4, Clerk, Supabase, Stripe, Resend, and the Vercel AI SDK. Authenticated subscribers can generate, schedule, and deliver personalized newsletters while billing, cron scheduling, and streaming AI responses run on the server. This was an experiment made with the help of my other app [App Documentation AI Builder](https://github.com/AlexCo888/app-documentation-ai-builder).

## Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd ai-newsletters-generator
pnpm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys

# 3. Start Supabase (optional for local development)
supabase start
supabase db reset --local

# 4. Run the development server
pnpm dev
```

Visit `http://localhost:3000` to see your app running!

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Supabase Schema](#supabase-schema)
- [Available Scripts](#available-scripts)
- [Key API Routes](#key-api-routes)
- [Billing and Subscriptions](#billing-and-subscriptions)
- [AI Generation and Emails](#ai-generation-and-emails)
- [Cron and Background Jobs](#cron-and-background-jobs)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Architecture Overview](#architecture-overview)
- [Contributing](#contributing)
- [License](#license)

## Features

### 🔐 Authentication & Authorization
- Clerk-powered authentication with middleware protection
- Server-side auth checks on protected routes
- Dedicated sign-in and sign-up flows
- User profile management

### 🤖 AI-Powered Newsletter Generation
- Real-time AI newsletter generation using Vercel AI SDK
- Streaming JSON responses for live preview
- OpenAI integration via Vercel AI Gateway
- Customizable newsletter templates

### 💳 Subscription Management
- Stripe Checkout integration
- Recurring subscription billing
- Subscription status tracking
- Dedicated billing management page
- Webhook-verified payment processing

### 📧 Email Delivery System
- Automated email delivery via Resend
- React Email templates for beautiful newsletters
- Built-in unsubscribe functionality
- Email event tracking via webhooks
- Rate limit handling

### ⏰ Automated Scheduling
- Dual cron job system for generation and delivery
- Queue-based job processing
- Duplicate job prevention
- Configurable delivery schedules

### 📊 Database & Storage
- Supabase Postgres with Row Level Security
- Tables for profiles, issues, deliveries, jobs, and preferences
- Automated migrations
- Audit logging

### 🎨 Modern UI/UX
- Tailwind CSS v4 for styling
- Responsive design
- Toast notifications with Sonner
- Lucide icons
- Dashboard for newsletter management
- Newsletter editor interface

## Tech Stack

### Core Framework
- **Next.js 16.0.0**: App Router with Node runtime API routes and Turbopack dev server
- **React 19.2.0**: Latest React with concurrent features
- **TypeScript 5.6**: Full type safety across the codebase

### Authentication & Payments
- **Clerk** (@clerk/nextjs ^6.33.7): Complete authentication system with middleware protection
- **Stripe** (^16.12.0): Subscription billing, checkout sessions, and webhook handling

### Database & Backend
- **Supabase** (@supabase/supabase-js ^2.48.0): Postgres with Row Level Security
- **Zod** (^3.23.8): Schema validation for API requests and responses

### AI & Email
- **Vercel AI SDK** (ai ^3.1.35): Streaming AI text generation
- **OpenAI SDK** (@ai-sdk/openai ^1.1.0): OpenAI model integration via Vercel AI Gateway
- **Resend** (^4.0.0): Transactional email delivery
- **React Email** (@react-email/components ^0.0.22): Type-safe email templates

### UI & Styling
- **Tailwind CSS v4** (@tailwindcss/postcss ^4.0.0): Modern utility-first CSS
- **Lucide React** (^0.474.0): Icon library
- **Sonner** (^1.7.1): Toast notifications
- **clsx** & **tailwind-merge**: Conditional styling utilities

### Utilities
- **date-fns** (^3.6.0): Date manipulation and formatting

## Prerequisites
- Node.js 20 or newer
- pnpm (preferred) or npm
- Supabase project with anon and service role keys
- Clerk application (publishable and secret keys)
- Stripe account with product, price, and webhook endpoint
- Resend account with a verified sending domain
- Vercel project for deployment, cron, and AI Gateway access

## Getting Started
1. **Install dependencies**
   ```bash
   pnpm install
   ```
   `npm install` also works if pnpm is unavailable.
2. **Configure environment variables**  
   Copy `.env.local.example` to `.env.local` and fill out the values listed below.
3. **Launch local Supabase (optional but recommended)**  
   ```bash
   supabase start
   supabase db reset --local  # applies migrations in supabase/migrations
   ```
4. **Run the development server**
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:3000`.

## Environment Variables
| Name | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key for the frontend. |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key used server-side. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key for client SDKs. |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key for billing. |
| `STRIPE_PRICE_ID` | Yes | Recurring price ID used when creating checkout sessions. |
| `STRIPE_WEBHOOK_SECRET` | Yes | Signing secret for `/api/webhooks/stripe`. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key for browser usage. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key for server-side operations (never expose to the client). |
| `RESEND_API_KEY` | Yes | Resend API key used for transactional emails. |
| `RESEND_WEBHOOK_SECRET` | Optional | Reserved for future Resend webhooks. |
| `EMAIL_FROM` | Yes | Default sender, for example `Newsletters <news@yourdomain.com>`. |
| `AI_GATEWAY_API_KEY` | Yes | Vercel AI Gateway API key used by `lib/ai.ts`. |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL (for example `http://localhost:3000`) used for Stripe redirect URLs. |
| `CRON_SIGNATURE_SECRET` | Yes | Shared secret required by `/api/cron/deliveries`. |

> Warning: Keep service role, Stripe, Resend, and AI keys server-only. Client bundles only reference `NEXT_PUBLIC_*` values.

## Supabase Schema
- Migration file: `supabase/migrations/0001_init.sql`.
- Row level security is enabled on all tables; the service role key is required for server writes.
- Tables capture profiles, user preferences, generated issues, delivery jobs, audit logs, and email events.
- Apply future changes via additional migrations to keep environments in sync.

## Available Scripts

```bash
# Development
pnpm dev          # Start Next.js dev server with Turbopack

# Production
pnpm build        # Build the application with Turbopack
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint on app, lib, and related code
```

### Development Notes
- Turbopack is enabled by default for faster builds and HMR
- Tailwind styles load automatically from `app/globals.css`
- No `tailwind.config.js` required for basic setup
- ESLint uses flat config format

## Key API Routes

| Route | Method | Runtime | Description |
| --- | --- | --- | --- |
| `/api/generate` | POST | Node | Streams AI-generated newsletter JSON. Requires an authenticated user with an active subscription. |
| `/api/ai/preview` | POST | Node | Generates a preview of newsletter content using AI. |
| `/api/checkout` | POST | Node | Creates a Stripe Checkout session and returns the redirect URL. |
| `/api/webhooks/stripe` | POST | Node | Verifies Stripe signatures with the raw body and syncs subscription state to Supabase. |
| `/api/webhooks/resend` | POST | Node | Handles Resend webhook events for email delivery tracking. |
| `/api/cron/dispatch` | GET | Node | Cron-invoked endpoint that dispatches queued newsletter generation jobs (runs every 5 minutes). |
| `/api/cron/deliveries` | GET | Node | Cron-invoked endpoint that queues delivery jobs after validating `x-cron-signature` (runs every 5 minutes). |
| `/api/jobs/generate` | POST | Node | Creates a newsletter generation job. |
| `/api/jobs/send` | POST | Node | Creates a newsletter send job. |

## Billing and Subscriptions

### Stripe Checkout Integration
- `app/api/checkout/route.ts` calls `lib/billing.ts` to create or reuse customers and generate subscription checkout sessions.
- The Stripe webhook handler updates `profiles.subscription_status`, `stripe_customer_id`, and billing metadata.
- Ensure your Stripe webhook endpoint is configured with the Node runtime and the signing secret matches `STRIPE_WEBHOOK_SECRET`.
- Success redirect: `${NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`  
  Cancel redirect: `${NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`

### Stripe Billing Portal
The app integrates the official Stripe Customer Portal, allowing users to:
- **Cancel subscriptions** - Users can cancel their subscription directly through Stripe's hosted portal
- **Update payment methods** - Change credit cards and billing information
- **View invoices** - Access all past invoices and receipts
- **Update billing details** - Modify billing address and tax information

**Implementation Details:**
- Portal sessions are created in `app/(app)/billing/actions.ts` using `stripe.billingPortal.sessions.create()`
- Users are redirected to Stripe's secure hosted portal at the generated session URL
- After managing their billing, users return to `/billing` via the `return_url` parameter
- Subscription changes are automatically synced via webhooks to the `profiles` table

**Webhook Events Handled:**
- `customer.subscription.created` - New subscription started
- `customer.subscription.updated` - Subscription modified (plan change, etc.)
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Successful payment
- `invoice.payment_failed` - Failed payment (marks subscription as past_due)

**Configuration:**
1. Enable the Customer Portal in your [Stripe Dashboard](https://dashboard.stripe.com/settings/billing/portal)
2. Configure portal settings (cancellation behavior, allowed features)
3. Ensure webhook endpoint is set up at `https://yourdomain.com/api/webhooks/stripe`
4. Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET` environment variable

## AI Generation and Emails
- `lib/ai.ts` configures the OpenAI client against the Vercel AI Gateway. Update `AI_GATEWAY_API_KEY` in production.
- `/api/generate` uses `streamText` plus `toTextStreamResponse()` for incremental JSON output; the frontend should consume the stream to display progress.
- `lib/email.ts` wraps Resend to send the `emails/Newsletter.tsx` React template. The cron job currently queues jobs; extend it to generate and send payloads while respecting Resend rate limits (about two requests per second by default).

## Cron and Background Jobs
- `vercel.json` registers **two cron jobs** that run every five minutes:
  - `/api/cron/dispatch`: Processes queued newsletter generation jobs
  - `/api/cron/deliveries`: Schedules newsletter delivery jobs
- Vercel includes an `x-vercel-signature`; ensure you set `CRON_SIGNATURE_SECRET` both locally and in production.
- The cron handlers look for due jobs, avoid duplicates, and insert records into the `jobs` table.
- Jobs are processed asynchronously to handle rate limits and ensure reliable delivery.

## Project Structure

```
ai-newsletters-generator/
├── app/
│   ├── (app)/                    # Protected app routes (requires auth)
│   │   ├── dashboard/            # Main dashboard
│   │   ├── editor/               # Newsletter editor
│   │   ├── billing/              # Subscription management
│   │   └── settings/             # User settings
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/              # Sign in page
│   │   └── sign-up/              # Sign up page
│   ├── (marketing)/              # Public marketing routes
│   │   ├── pricing/              # Pricing page
│   │   ├── privacy/              # Privacy policy
│   │   └── terms/                # Terms of service
│   ├── api/                      # API routes
│   │   ├── ai/preview/           # AI preview generation
│   │   ├── checkout/             # Stripe checkout
│   │   ├── cron/                 # Cron job endpoints
│   │   ├── generate/             # Newsletter generation
│   │   ├── jobs/                 # Job management
│   │   └── webhooks/             # Webhook handlers
│   ├── unsubscribe/[token]/      # Unsubscribe page
│   ├── globals.css               # Global styles with Tailwind imports
│   └── layout.tsx                # Root layout
├── lib/
│   ├── ai.ts                     # AI SDK configuration
│   ├── auth.ts                   # Clerk auth utilities
│   ├── billing.ts                # Stripe billing logic
│   ├── data.ts                   # Data access layer
│   ├── email.ts                  # Resend email wrapper
│   ├── newsletter.ts             # Newsletter business logic
│   ├── stripe.ts                 # Stripe client config
│   └── supabase.ts               # Supabase client setup
├── emails/                       # React Email templates
├── supabase/
│   └── migrations/               # Database migrations
│       └── 0001_init.sql         # Initial schema
├── middleware.ts                 # Clerk route protection
├── vercel.json                   # Vercel configuration (cron jobs)
└── package.json                  # Dependencies
```

## Deployment

### Vercel Deployment (Recommended)

1. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   pnpm add -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   - Go to your Vercel project settings
   - Add all environment variables from `.env.local.example`
   - Ensure `NEXT_PUBLIC_APP_URL` points to your production domain
   - Keep sensitive keys (service role, Stripe secret, AI Gateway key) server-only

3. **Set Up Webhooks**
   - **Stripe Webhook**: Configure in Stripe Dashboard to point to `https://yourdomain.com/api/webhooks/stripe`
     - Listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
     - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`
   - **Resend Webhook** (optional): Configure to point to `https://yourdomain.com/api/webhooks/resend`
     - Copy webhook signing secret to `RESEND_WEBHOOK_SECRET`

4. **Configure Cron Jobs**
   - Vercel automatically registers cron jobs from `vercel.json`
   - Both `/api/cron/dispatch` and `/api/cron/deliveries` run every 5 minutes
   - Verify cron jobs are enabled in Vercel dashboard
   - Set `CRON_SIGNATURE_SECRET` for security

5. **Database Setup**
   - Apply migrations to your production Supabase instance
   - Verify Row Level Security policies are enabled
   - Update `SUPABASE_URL` and keys in Vercel

6. **Verify Email Sending**
   - Ensure your domain is verified in Resend
   - Test email delivery with a sample newsletter
   - Monitor Resend dashboard for delivery status

### Local Testing with Production Data

```bash
# Test Stripe webhook locally
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "stripe-signature: whsec_test..." \
  -d @stripe-event.json

# Test cron endpoint locally
curl -X GET http://localhost:3000/api/cron/deliveries \
  -H "x-cron-signature: your-secret"
```

### Post-Deployment Checklist
- [ ] All environment variables set in Vercel
- [ ] Stripe webhook configured and tested
- [ ] Resend domain verified
- [ ] Cron jobs enabled in Vercel dashboard
- [ ] Database migrations applied
- [ ] Test user signup and authentication flow
- [ ] Test subscription checkout
- [ ] Test newsletter generation
- [ ] Verify email delivery

## Troubleshooting

### Common Issues

**Authentication Issues**
- Verify Clerk keys are correct in environment variables
- Check that middleware is properly configured
- Ensure sign-in/sign-up redirects are set correctly in Clerk dashboard

**Stripe Webhook Failures**
- Verify webhook signing secret matches
- Check that webhook endpoint URL is accessible from Stripe
- Ensure raw body parsing is enabled for webhook route

**Email Delivery Problems**
- Verify Resend domain is verified and active
- Check rate limits (default: ~2 requests/second)
- Monitor Resend dashboard for delivery errors
- Ensure `EMAIL_FROM` matches verified domain

**Cron Jobs Not Running**
- Verify `CRON_SIGNATURE_SECRET` is set in Vercel
- Check Vercel dashboard for cron job logs
- Ensure cron endpoints return 200 status code

**Database Connection Issues**
- Verify Supabase URL and keys are correct
- Check that RLS policies allow the operations
- Use service role key for server-side operations

## Architecture Overview

### Data Flow

1. **User Authentication**: Clerk → Middleware → Protected Routes
2. **Newsletter Generation**: User Input → `/api/generate` → Vercel AI SDK → Streaming Response
3. **Subscription Flow**: User → `/api/checkout` → Stripe Checkout → Webhook → Supabase
4. **Email Delivery**: Cron → `/api/cron/dispatch` → Job Queue → `/api/jobs/send` → Resend

### Security Considerations

- All authentication routes protected by Clerk middleware
- RLS enabled on all Supabase tables
- Webhook signatures verified for Stripe and Resend
- Service role keys never exposed to client
- Cron endpoints protected with signature verification

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is private and proprietary.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

Built with ❤️ using Next.js, Vercel AI SDK, and modern web technologies.
