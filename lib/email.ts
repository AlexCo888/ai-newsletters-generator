import { Resend } from 'resend'
import Newsletter from '@/emails/Newsletter'

type NewsletterProps = Parameters<typeof Newsletter>[0]

const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set. Emails will not send until configured.')
}

const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendNewsletterEmail(to: string, data: NewsletterProps) {
  if (!resend) {
    throw new Error('Resend client is not configured. Set RESEND_API_KEY to send emails.')
  }

  const from = process.env.EMAIL_FROM
  if (!from) {
    throw new Error('EMAIL_FROM is not configured.')
  }

  return resend.emails.send({
    from,
    to,
    subject: data.title || 'Your AI Newsletter',
    react: Newsletter(data) as any,
  })
}
