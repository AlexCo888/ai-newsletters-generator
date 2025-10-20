import { Resend } from 'resend'
import Newsletter, { type NewsletterTemplateProps } from '@/emails/Newsletter'

let resendClient: Resend | null = null

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }

  return resendClient
}

export async function sendNewsletterEmail(to: string, data: NewsletterTemplateProps) {
  if (!process.env.EMAIL_FROM) {
    throw new Error('EMAIL_FROM is not set')
  }

  const resend = getResendClient()

  return resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: data.title ?? 'Your AI Newsletter',
    react: Newsletter(data) as any,
  })
}
