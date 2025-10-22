export const revalidate = 3600

const features = [
  'Unlimited AI-generated newsletter drafts',
  'Saved prompts, tone, and audience presets',
  'Scheduled sends with timezone awareness',
  'React Email template with on-brand styling',
  'Stripe + Supabase integration for billing insights',
  'Priority email support',
]

const faqs = [
  {
    question: 'Is there a free trial?',
    answer:
      'Yes. Every new account includes a 7-day free trial. We will remind you before the first charge and you can cancel anytime from the billing page.',
  },
  {
    question: 'Can I customize the AI output?',
    answer:
      'Absolutely. You can update your tone, topics, must-include items, and CTA defaults. Each generated issue can also be edited before scheduling.',
  },
  {
    question: 'What happens if AI generation fails?',
    answer:
      'We automatically retry generation with a fallback model and notify you if manual review is needed. Delivery is paused until a valid issue is ready.',
  },
  {
    question: 'Do you support agencies or teams?',
    answer:
      'Team seats and advanced brand kits are on our roadmap. Reach out to support and we can help tailor the product to your workflow.',
  },
]

export default function PricingPage() {
  return (
    <section className="bg-white pb-24 pt-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pricing</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Simple, transparent pricing for serious newsletter operators.
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            One flat plan unlocks guided prompt workflows, automated generation, and professional email delivery.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-10 text-left shadow-xl shadow-slate-200/50">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Creator Plan</h2>
              <p className="mt-2 text-sm text-slate-600">Perfect for solo operators, consultants, and marketers.</p>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="text-5xl font-semibold text-slate-900">$5</span>
                <span className="text-sm text-slate-500">per month</span>
              </div>
              <p className="mt-4 text-sm text-slate-500">Includes up to 4 scheduled newsletters per month.</p>
              <ul className="mt-8 flex flex-col gap-3 text-sm text-slate-700">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="/sign-up"
              className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-700"
            >
              Start trial
            </a>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-10">
            <h3 className="text-lg font-semibold text-slate-900">Frequently asked questions</h3>
            <dl className="mt-6 space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <dt className="text-sm font-semibold text-slate-900">{faq.question}</dt>
                  <dd className="mt-3 text-sm text-slate-600">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}

