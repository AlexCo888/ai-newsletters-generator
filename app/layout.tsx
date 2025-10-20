import './globals.css'

import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Newsletters',
  description: 'AI-tailored newsletters',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
          {children}
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
