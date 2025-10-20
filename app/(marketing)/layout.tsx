import type { ReactNode } from 'react'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              AI
            </span>
            <span>AI Newsletters</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/pricing" className="transition hover:text-slate-900">
              Pricing
            </Link>
            <a href="#features" className="transition hover:text-slate-900">
              Features
            </a>
            {userId ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-700"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="transition hover:text-slate-900">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-700"
                >
                  Start trial
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} AI Newsletters. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-700">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
