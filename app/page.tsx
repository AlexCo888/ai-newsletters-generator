import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="rounded-full bg-slate-900/5 px-4 py-1 text-sm font-medium text-slate-700">
          AI-tailored newsletters
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Ship delightful newsletters on autopilot.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Generate niche, on-brand issues in seconds, schedule delivery, and keep your audience engaged with zero busywork.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            Start free trial
          </Link>
          <Link href="/pricing" className="text-base font-semibold text-slate-700 hover:text-slate-900">
            View pricing →
          </Link>
        </div>
      </div>
    </main>
  )
}
