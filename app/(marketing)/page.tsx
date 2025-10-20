import Link from 'next/link'

export const revalidate = 3600

export default function LandingPage() {
  return (
    <section className="relative overflow-hidden bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 py-24 text-center">
        <span className="rounded-full border border-slate-200 bg-white px-4 py-1 text-sm font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
          Premium AI newsletters in minutes
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          Generate and deliver on-brand newsletters without the busywork.
        </h1>
        <p className="max-w-2xl text-lg text-slate-600 sm:text-xl">
          From prompt to polished email, Aurora handles research, writing, and design so you can focus on strategy. Craft
          niche content, schedule deliveries, and keep subscribers engaged effortlessly.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="rounded-full bg-slate-900 px-8 py-3 text-base font-medium text-white transition hover:bg-slate-700"
          >
            Start your 7-day trial
          </Link>
          <Link
            href="#features"
            className="rounded-full border border-slate-300 px-8 py-3 text-base font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            See how it works
          </Link>
        </div>
        <dl className="grid w-full gap-6 text-left sm:grid-cols-3">
          {[
            { value: '15k+', label: 'Issues generated' },
            { value: '98%', label: 'Subscriber satisfaction' },
            { value: '2m+', label: 'Emails delivered' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <dt className="text-sm font-medium text-slate-500">{stat.label}</dt>
              <dd className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div id="features" className="border-t border-slate-200 bg-white/90">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 sm:grid-cols-2">
          {[
            {
              title: 'Guided prompt builder',
              description:
                'Describe your audience, tone, and priorities. Intelligent suggestions and guardrails help you refine the perfect brief.',
            },
            {
              title: 'AI-crafted newsletters',
              description:
                'Aurora generates sections, summaries, and CTA ideas with factual grounding and clean formatting.',
            },
            {
              title: 'Scheduling & automation',
              description:
                'Plan cadences by timezone. Automatic retries ensure each issue is generated and delivered on time.',
            },
            {
              title: 'Feedback loops',
              description:
                'Review history, track delivery outcomes, and iterate using saved preferences and issue archives.',
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-8 shadow-inner">
              <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200 bg-slate-100/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">From idea to inbox in three steps.</h2>
          </div>
          <ol className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: 'Brief the AI',
                description:
                  'Use the guided builder to outline themes, target audience, tone, must-include items, and CTA preferences.',
              },
              {
                title: 'Review the draft',
                description:
                  'Aurora streams a structured newsletter preview. Edit sections in the dashboard editor and capture stakeholder feedback.',
              },
              {
                title: 'Schedule & send',
                description:
                  'Approve the issue, set cadence and timezone, and let the automation engine deliver via Resend and track events.',
              },
            ].map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Trusted by modern operators</p>
          <blockquote className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-lg text-slate-700 shadow-inner">
            “Aurora trims hours off our newsletter workflow. The AI drafts are on-voice, the editor is intuitive, and the scheduling
            automation just works.”
            <footer className="mt-4 text-sm font-semibold text-slate-900">— Maya Chen, Growth Lead @ Orbit Labs</footer>
          </blockquote>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-full bg-slate-900 px-8 py-3 text-base font-medium text-white transition hover:bg-slate-700"
            >
              Launch your trial
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-slate-300 px-8 py-3 text-base font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Explore pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
