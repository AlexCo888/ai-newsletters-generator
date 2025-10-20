import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            &larr; Back to home
          </Link>
          <span className="text-sm font-semibold text-slate-900">AI Newsletters</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">{children}</main>
    </div>
  )
}

