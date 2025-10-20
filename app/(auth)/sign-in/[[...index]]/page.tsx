'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex w-full max-w-md justify-center rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/40">
      <SignIn appearance={{ elements: { card: { backgroundColor: 'transparent', boxShadow: 'none' } } }} />
    </div>
  )
}

