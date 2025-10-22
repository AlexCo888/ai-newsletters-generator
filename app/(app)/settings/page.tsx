import { Suspense } from 'react'

import { getPreferences } from '@/lib/data'
import { requireActiveSubscription } from '@/lib/auth'

import { SettingsForm } from './settings-form'

function getTimezones() {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    return ['UTC']
  }
}

export default async function SettingsPage() {
  const profile = await requireActiveSubscription()
  const preferences = await getPreferences(profile.id)
  const timezones = getTimezones()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Delivery preferences</h1>
        <p className="mt-2 text-sm text-slate-600">
          Control cadence, tone, and sender details. These defaults inform the AI briefing and scheduling engine.
        </p>
      </header>

      <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">Loading...</div>}>
        <SettingsForm preferences={preferences} timezones={timezones} />
      </Suspense>
    </div>
  )
}
