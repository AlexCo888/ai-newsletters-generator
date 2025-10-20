import { notFound } from 'next/navigation'

import { requireActiveSubscription } from '@/lib/auth'
import { getIssue } from '@/lib/data'

import { EditorClient } from './editor-client'
import type { IssueContent } from './actions'

type EditorPageProps = {
  params: {
    issueId: string
  }
}

export default async function EditorPage({ params }: EditorPageProps) {
  const profile = await requireActiveSubscription()
  const issue = await getIssue(params.issueId, profile.clerk_user_id)

  if (!issue) {
    notFound()
  }

  const content = issue.content_json as IssueContent | null

  return (
    <div className="flex flex-col gap-4 text-slate-200">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">Edit newsletter issue</h1>
        <p className="text-sm text-slate-400">
          Review AI-generated content, refine sections, and save updates before sending.
        </p>
      </header>
      <EditorClient issueId={issue.id} subject={issue.subject} preheader={issue.preheader} content={content} />
    </div>
  )
}

