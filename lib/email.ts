import { Resend } from 'resend'
import Newsletter from '@/emails/Newsletter'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendNewsletterEmail(to: string, data: Parameters<typeof Newsletter>[0]) {
  return await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: data.title || 'Your AI Newsletter',
    react: Newsletter(data) as any,
  })
}
