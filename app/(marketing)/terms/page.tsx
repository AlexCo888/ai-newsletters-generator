export const revalidate = 86400

const items = [
  {
    title: 'Service & license',
    detail:
      'AI Newsletters provides tools to generate, schedule, and send newsletters. We grant you a revocable, non-exclusive license to use the platform for your business needs. Generated content is yours to use and modify.',
  },
  {
    title: 'Accounts & billing',
    detail:
      'Subscriptions renew monthly until canceled. You are responsible for maintaining accurate billing information and complying with email regulations. Downgrading or canceling takes effect at the end of the billing cycle.',
  },
  {
    title: 'Acceptable use',
    detail:
      'You may not use the platform for unlawful content, spam, or harassment. We reserve the right to suspend accounts that violate our policies or applicable laws.',
  },
  {
    title: 'Liability',
    detail:
      'We make no guarantees regarding deliverability, engagement, or revenue generated. Our liability is limited to fees paid in the preceding three months.',
  },
]

export default function TermsPage() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Terms of Service</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900">Know what to expect when using AI Newsletters.</h1>
          <p className="mt-4 text-sm text-slate-600">
            Effective as of {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>
        <div className="space-y-8">
          {items.map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-inner">
              <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
        <footer className="rounded-3xl border border-slate-200 bg-slate-100 p-6 text-sm text-slate-600">
          Need a custom agreement? Email{' '}
          <a href="mailto:legal@ainewsletters.app" className="font-medium text-slate-900 underline">
            legal@ainewsletters.app
          </a>
          .
        </footer>
      </div>
    </section>
  )
}

