import { redirect, notFound } from 'next/navigation'

import { supabaseAdmin } from '@/lib/supabase'

import { unsubscribeByToken } from './actions'

async function getRecipient(token: string) {
  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from('recipients')
    .select('email, status')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  if (error) {
    console.error('Failed to load recipient', error)
    throw new Error('Unable to load subscriber')
  }

  return data as { email: string | null; status: string } | null
}

type UnsubscribePageProps = {
  params: {
    token: string
  }
  searchParams?: {
    status?: string
    error?: string
  }
}

export default async function UnsubscribePage({ params, searchParams }: UnsubscribePageProps) {
  const recipient = await getRecipient(params.token)

  if (!recipient) {
    notFound()
  }

  const status = searchParams?.status
  const error = searchParams?.error

  const unsubscribeAction = async (formData: FormData) => {
    'use server'
    const result = await unsubscribeByToken(params.token, formData)

    if (!result.ok) {
      redirect(`/unsubscribe/${params.token}?error=${encodeURIComponent(result.error ?? 'Request failed')}`)
    }

    const outcome = result.alreadyUnsubscribed ? 'already' : 'success'
    redirect(`/unsubscribe/${params.token}?status=${outcome}`)
  }

  const alreadyUnsubscribed = recipient.status === 'unsubscribed'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-16">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h1 className="text-2xl font-semibold text-white">Manage subscription</h1>
          <p className="mt-3 text-sm text-slate-400">
            Confirm below to stop receiving newsletters from AI Newsletters. This action applies to{' '}
            <span className="font-semibold text-slate-200">{recipient.email ?? 'this address'}</span>.
          </p>
        </header>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          {status === 'success' || status === 'already' ? (
            <div className="flex flex-col gap-3 text-sm text-slate-300">
              <p>
                {status === 'already'
                  ? 'This address was already unsubscribed. No further emails will be sent.'
                  : 'You have been unsubscribed. Future newsletters will no longer be delivered.'}
              </p>
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ainewsletters.app'}`}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Return to website
              </a>
            </div>
          ) : alreadyUnsubscribed ? (
            <div className="flex flex-col gap-3 text-sm text-slate-300">
              <p>This address is already unsubscribed. No further emails will be sent unless you re-opt in.</p>
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ainewsletters.app'}`}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Return to website
              </a>
            </div>
          ) : (
            <form action={unsubscribeAction} className="flex flex-col gap-4 text-sm text-slate-200">
              <p>
                Clicking below immediately unsubscribes you from future newsletters. You can rejoin anytime by signing up
                again.
              </p>
              {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{decodeURIComponent(error)}</p>}
              <button
                type="submit"
                className="rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-red-950 transition hover:bg-red-400"
              >
                Unsubscribe me
              </button>
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ainewsletters.app'}`}
                className="text-xs font-semibold text-slate-400 underline hover:text-slate-300"
              >
                Keep me subscribed
              </a>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
