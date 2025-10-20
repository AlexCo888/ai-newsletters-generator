export const revalidate = 86400

const sections = [
  {
    title: 'Data collection',
    body:
      'We collect account details provided during sign-up (name, email), subscription data from Stripe, and preferences you configure for newsletter generation. AI prompts and generated content are stored to help you review and resend issues.',
  },
  {
    title: 'Usage of information',
    body:
      'Your data powers the product experience: generating newsletters, scheduling deliveries, processing payments, and safeguarding account access. We never sell your data. We only share it with trusted processors like Clerk, Stripe, Supabase, and Resend to deliver the service.',
  },
  {
    title: 'Security',
    body:
      'We rely on industry-leading providers and enforce role-based access controls. Keys and service credentials are stored securely and never exposed to the client. Supabase is configured with row-level security and service role keys are server-only.',
  },
  {
    title: 'Your rights',
    body:
      'You can access, update, or delete your data by contacting support. Unsubscribe links are included in every email. For data export or deletion requests, email privacy@ainewsletters.app.',
  },
]

export default function PrivacyPage() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Privacy Policy</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900">Protecting your data is non-negotiable.</h1>
          <p className="mt-4 text-sm text-slate-600">
            Last updated {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>
        <div className="space-y-8">
          {sections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-inner">
              <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-3 text-sm text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
        <footer className="rounded-3xl border border-slate-200 bg-slate-100 p-6 text-sm text-slate-600">
          Questions? Contact{' '}
          <a href="mailto:privacy@ainewsletters.app" className="font-medium text-slate-900 underline">
            privacy@ainewsletters.app
          </a>
        </footer>
      </div>
    </section>
  )
}

