import { NextResponse } from 'next/server'

import { sendNewsletterEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'
import type { NewsletterSection } from '@/emails/Newsletter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type DeliveryRecord = {
  id: string
  issue_id: string
  user_id: string
  to_email: string
  payload: {
    title?: string
    intro?: string
    sections?: NewsletterSection[]
    outro?: string
    palette?: { primary?: string; accent?: string; background?: string }
    preheader?: string
  } | null
  send_at: string
}

export async function GET(request: Request) {
  const signature = request.headers.get('x-cron-signature')
  if (!signature || signature !== process.env.CRON_SIGNATURE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = supabaseAdmin()

  const { data: dueDeliveries, error } = await supabase
    .from('deliveries')
    .select('id, issue_id, user_id, to_email, payload, send_at')
    .lte('send_at', new Date().toISOString())
    .eq('status', 'scheduled')
    .limit(20)

  if (error) {
    console.error('Failed to load due deliveries', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const deliveries = (dueDeliveries as DeliveryRecord[] | null) ?? []

  if (!deliveries.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const processedIds: string[] = []
  const failures: { id: string; message: string }[] = []

  for (const delivery of deliveries) {
    try {
      const payload = delivery.payload ?? {}

      await sendNewsletterEmail(delivery.to_email, {
        title: payload.title ?? 'Your AI Newsletter',
        intro: payload.intro ?? undefined,
        sections: payload.sections ?? [],
        outro: payload.outro ?? undefined,
        palette: payload.palette ?? undefined,
        preheader: payload.preheader ?? undefined,
      })

      await supabase
        .from('deliveries')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', delivery.id)

      processedIds.push(delivery.id)
    } catch (err) {
      console.error('Failed to process delivery', delivery.id, err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      failures.push({ id: delivery.id, message })

      await supabase
        .from('deliveries')
        .update({ status: 'failed', error: message })
        .eq('id', delivery.id)
    }
  }

  return NextResponse.json({ ok: true, processed: processedIds.length, failures })
}
