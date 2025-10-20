'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import type { IssueContent } from './actions'
import { saveIssue } from './actions'

type EditorClientProps = {
  issueId: string
  subject: string | null
  preheader: string | null
  content: IssueContent | null
}

function normalizeContent(subject: string | null, preheader: string | null, content: IssueContent | null): IssueContent {
  if (content) {
    return {
      ...content,
      title: content.title ?? subject ?? 'Untitled issue',
      preheader: content.preheader ?? preheader ?? '',
      sections: content.sections.map((section) => ({
        ...section,
        linkSuggestions: section.linkSuggestions ?? [],
      })),
    }
  }

  return {
    title: subject ?? 'Untitled issue',
    preheader: preheader ?? '',
    intro: '',
    sections: [
      {
        title: 'New section',
        summary: 'Summarize the key insight.',
        pullQuote: '',
        linkSuggestions: [],
      },
    ],
    outro: '',
    cta: {
      headline: '',
      buttonLabel: '',
      buttonUrl: null,
    },
  }
}

export function EditorClient({ issueId, subject, preheader, content }: EditorClientProps) {
  const initialState = useMemo(() => normalizeContent(subject, preheader, content), [subject, preheader, content])
  const [draft, setDraft] = useState<IssueContent>(initialState)
  const [isSaving, startSaving] = useTransition()

  const updateSection = (index: number, field: 'title' | 'summary' | 'pullQuote' | 'linkSuggestions', value: string) => {
    setDraft((current) => {
      const sections = [...current.sections]
      const target = { ...sections[index] }
      if (field === 'linkSuggestions') {
        target.linkSuggestions = value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      } else if (field === 'pullQuote') {
        target.pullQuote = value
      } else if (field === 'title') {
        target.title = value
      } else if (field === 'summary') {
        target.summary = value
      }
      sections[index] = target
      return { ...current, sections }
    })
  }

  const addSection = () => {
    setDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          title: 'New section',
          summary: '',
          pullQuote: '',
          linkSuggestions: [],
        },
      ],
    }))
  }

  const removeSection = (index: number) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((_, i) => i !== index),
    }))
  }

  const handleSave = () => {
    startSaving(async () => {
      try {
        const result = await saveIssue(issueId, draft)
        if (!result.ok) {
          toast.error(result.error ?? 'Failed to save issue')
          return
        }
        toast.success('Issue saved')
      } catch (error) {
        console.error(error)
        toast.error('Failed to save issue')
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject line</span>
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preheader</span>
          <input
            value={draft.preheader}
            onChange={(event) => setDraft((current) => ({ ...current, preheader: event.target.value }))}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-slate-200">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Intro</span>
        <textarea
          value={draft.intro ?? ''}
          onChange={(event) => setDraft((current) => ({ ...current, intro: event.target.value }))}
          rows={4}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
        />
      </label>

      <div className="space-y-6">
        {draft.sections.map((section, index) => (
          <div key={index} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Section {index + 1}</h3>
              {draft.sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="text-xs font-semibold text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Title</span>
                <input
                  value={section.title}
                  onChange={(event) => updateSection(index, 'title', event.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pull quote</span>
                <input
                  value={section.pullQuote ?? ''}
                  onChange={(event) => updateSection(index, 'pullQuote', event.target.value)}
                  placeholder="Optional pull quote"
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
                />
              </label>
            </div>
            <label className="mt-4 flex flex-col gap-2 text-sm text-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</span>
              <textarea
                value={section.summary}
                onChange={(event) => updateSection(index, 'summary', event.target.value)}
                rows={4}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
              />
            </label>
            <label className="mt-4 flex flex-col gap-2 text-sm text-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Link suggestions (one per line)</span>
              <textarea
                  value={(section.linkSuggestions ?? []).join('\n')}
                onChange={(event) => updateSection(index, 'linkSuggestions', event.target.value)}
                rows={3}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Add section
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">CTA headline</span>
          <input
            value={draft.cta?.headline ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                cta: { ...(current.cta ?? { headline: '', buttonLabel: '', buttonUrl: null }), headline: event.target.value },
              }))
            }
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">CTA button label</span>
          <input
            value={draft.cta?.buttonLabel ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                cta: {
                  ...(current.cta ?? { headline: '', buttonLabel: '', buttonUrl: null }),
                  buttonLabel: event.target.value,
                },
              }))
            }
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-slate-200">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">CTA URL</span>
        <input
          value={draft.cta?.buttonUrl ?? ''}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              cta: {
                ...(current.cta ?? { headline: '', buttonLabel: '', buttonUrl: null }),
                buttonUrl: event.target.value ? event.target.value : null,
              },
            }))
          }
          placeholder="https://"
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-200">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outro</span>
        <textarea
          value={draft.outro ?? ''}
          onChange={(event) => setDraft((current) => ({ ...current, outro: event.target.value }))}
          rows={3}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
        />
      </label>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setDraft(initialState)}
          disabled={isSaving}
          className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reset changes
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save issue'}
        </button>
      </div>
    </div>
  )
}
