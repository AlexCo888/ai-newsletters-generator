'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex w-full max-w-md justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <SignIn 
        appearance={{ 
          elements: { 
            card: { 
              backgroundColor: 'transparent', 
              boxShadow: 'none',
              border: 'none'
            },
            headerTitle: {
              color: '#0f172a'
            },
            headerSubtitle: {
              color: '#64748b'
            },
            formButtonPrimary: {
              backgroundColor: '#0f172a',
              '&:hover': {
                backgroundColor: '#334155'
              }
            }
          } 
        }} 
      />
    </div>
  )
}

