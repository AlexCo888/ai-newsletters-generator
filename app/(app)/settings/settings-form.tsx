'use client'

import { FormEvent, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import type { PreferenceRecord } from '@/lib/data'

import { savePreferences } from './actions'

type SettingsFormProps = {
  preferences: PreferenceRecord | null
  timezones: string[]
}

export function SettingsForm({ preferences, timezones }: SettingsFormProps) {
  const [tone, setTone] = useState(preferences?.tone ?? 'professional')
  const [isPending, startTransition] = useTransition()

  const timezoneOptions = useMemo(() => {
    return timezones.map((tz) => ({ value: tz, label: tz.replace('_', ' ') }))
  }, [timezones])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const result = await savePreferences(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Unable to save preferences')
      } else {
        toast.success('Preferences saved')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cadence per month</span>
          <select
            name="cadence"
            defaultValue={preferences?.cadence?.toString() ?? '1'}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
          >
            <option value="1">1 issue</option>
            <option value="2">2 issues</option>
            <option value="4">4 issues</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Send day of month</span>
          <input
            name="send_day"
            type="number"
            min={1}
            max={31}
            defaultValue={preferences?.send_day ?? ''}
            placeholder="e.g. 15"
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Send time</span>
          <input
            type="time"
            name="send_time"
            defaultValue={preferences?.send_time ?? ''}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Timezone</span>
          <select
            name="timezone"
            defaultValue={preferences?.timezone ?? 'UTC'}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
          >
            {timezoneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Topics or sources (comma separated)
        </span>
        <input
          name="topics"
          defaultValue={preferences?.topics?.join(', ') ?? ''}
          placeholder="AI safety, frontier models, case studies"
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tone</span>
          <select
            name="tone"
            value={tone}
            onChange={(event) => setTone(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="playful">Playful</option>
            <option value="analytical">Analytical</option>
            <option value="editorial">Editorial</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preferred length</span>
          <select
            name="length"
            defaultValue={preferences?.length ?? 'medium'}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </label>
      </div>

      {tone === 'custom' && (
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Describe your custom tone</span>
          <textarea
            name="tone_custom"
            defaultValue={preferences?.tone_custom ?? ''}
            rows={3}
            placeholder="Confident yet approachable, with clear takeaways and strategic insights."
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
          />
        </label>
      )}

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Must include (comma separated)</span>
        <input
          name="must_include"
          defaultValue={preferences?.must_include?.join(', ') ?? ''}
          placeholder="Upcoming launches, community highlights"
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Avoid topics (comma separated)</span>
        <input
          name="avoid"
          defaultValue={preferences?.avoid?.join(', ') ?? ''}
          placeholder="Speculation, unverified rumors"
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Default call-to-action</span>
        <input
          name="cta"
          defaultValue={preferences?.cta ?? ''}
          placeholder="Book a consultation to plan your AI roadmap."
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sender name</span>
          <input
            name="sender_name"
            defaultValue={preferences?.sender_name ?? ''}
            placeholder="Aurora from AI Newsletters"
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reply-to email</span>
          <input
            name="reply_to"
            defaultValue={preferences?.reply_to ?? ''}
            placeholder="hello@ainewsletters.app"
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Saving…' : 'Save preferences'}
      </button>
    </form>
  )
}

