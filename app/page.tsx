export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 py-16 text-slate-900">
      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">AI Newsletters</span>
      <h1 className="max-w-2xl text-center text-4xl font-semibold tracking-tight sm:text-5xl">
        Tailored newsletters crafted in minutes, delivered on your schedule.
      </h1>
      <p className="max-w-2xl text-center text-lg text-slate-600">
        Generate, schedule, and send premium newsletters without the busywork. Connect your topics, define your tone, and let our
        AI handle the rest.
      </p>
    </main>
  )
}
