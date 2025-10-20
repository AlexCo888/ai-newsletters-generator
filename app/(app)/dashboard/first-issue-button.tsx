'use client'

import { useTransition } from 'react'
import clsx from 'clsx'
import { toast } from 'sonner'

import { triggerFirstIssue } from './actions'

type FirstIssueButtonProps = {
  variant?: 'primary' | 'outline'
  size?: 'default' | 'small'
  className?: string
}

export function FirstIssueButton({ variant = 'primary', size = 'default', className }: FirstIssueButtonProps) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await triggerFirstIssue()

        if (result.ok) {
          toast.success('Newsletter sent to your inbox!')
          return
        }

        toast.error(result.message ?? 'Unable to send the first newsletter. Please review your settings.')
      } catch (error) {
        console.error('Failed to trigger first issue', error)
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  const baseClasses =
    'inline-flex items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'
  const paddingClasses = size === 'small' ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'
  const variantClasses =
    variant === 'outline'
      ? 'border border-slate-700 text-slate-100 hover:border-slate-500 hover:text-white'
      : 'bg-emerald-500 text-white hover:bg-emerald-400'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={clsx(baseClasses, paddingClasses, variantClasses, className)}
    >
      {pending ? 'Sending...' : 'Generate & send first issue'}
    </button>
  )
}
