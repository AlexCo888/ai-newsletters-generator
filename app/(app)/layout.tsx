import type { ReactNode } from 'react'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { headers } from 'next/headers'

import { requireProfile } from '@/lib/auth'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile()
  const user = await currentUser()
  const headerList = await headers()
  const pathname = headerList.get('x-invoke-path') ?? headerList.get('next-url') ?? ''

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/settings', label: 'Settings' },
    { href: '/billing', label: 'Billing' },
  ]

  const hasActiveSubscription = profile.subscription_status === 'active'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:block">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{user?.fullName ?? user?.username ?? 'Subscriber'}</p>
            <p className="text-xs text-slate-600">{profile.email ?? user?.primaryEmailAddress?.emailAddress ?? ''}</p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                hasActiveSubscription ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {hasActiveSubscription ? 'Active plan' : 'Payment required'}
            </span>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3 py-2 font-medium transition ${
                    active
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">AI Newsletters Studio</h1>
              <p className="text-sm text-slate-600">Craft, schedule, and deliver premium newsletters effortlessly.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard?view=issues"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Issue history
              </Link>
            </div>
          </header>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
