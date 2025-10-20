import crypto from 'crypto'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

function verifySignature(payload: string, signature: string | null, timestamp: string | null, secret: string) {
  if (!signature || !timestamp) return false
  const message = `${timestamp}.${payload}`
  const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(hmac, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const secret = process.env.RESEND_WEBHOOK_SECRET

  if (secret) {
    const headerList = await headers()
    const signature = headerList.get('resend-signature')
    const timestamp = headerList.get('resend-timestamp')
    const valid = verifySignature(rawBody, signature, timestamp, secret)

    if (!valid) {
      return new NextResponse('Invalid signature', { status: 400 })
    }
  }

  let parsedBody: unknown

  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Invalid body', { status: 400 })
  }

  if (typeof parsedBody !== 'object' || parsedBody === null) {
    return new NextResponse('Invalid body', { status: 400 })
  }

  const payload = parsedBody as Record<string, unknown>
  const eventType = typeof payload.type === 'string' ? payload.type : 'unknown'
  const eventData = (payload.data ?? {}) as Record<string, unknown>
  const metadata = (eventData.metadata ?? {}) as Record<string, unknown>

  const messageId =
    typeof eventData.id === 'string'
      ? eventData.id
      : typeof (eventData as Record<string, unknown>).messageId === 'string'
        ? (eventData as Record<string, unknown>).messageId
        : undefined

  const issueId =
    typeof metadata.issue_id === 'string'
      ? metadata.issue_id
      : typeof metadata.issueId === 'string'
        ? metadata.issueId
        : undefined

  const deliveryId =
    typeof metadata.delivery_id === 'string'
      ? metadata.delivery_id
      : typeof metadata.deliveryId === 'string'
        ? metadata.deliveryId
        : undefined

  const supabase = supabaseAdmin()

  const { error: logError } = await supabase.from('email_events').insert({
    issue_id: issueId ?? null,
    resend_message_id: messageId ?? null,
    event_type: eventType,
    meta: payload,
  })

  if (logError) {
    console.error('Failed to record Resend event', logError)
  }

  if (deliveryId) {
    const status =
      eventType === 'email.delivered'
        ? 'delivered'
        : eventType === 'email.bounced'
          ? 'bounced'
          : eventType === 'email.complained'
            ? 'complained'
            : eventType === 'email.opened'
              ? 'opened'
              : null

    if (status) {
      const updatePayload: Record<string, unknown> = { status }
      const deliveredAtValue =
        typeof (eventData as Record<string, unknown>).delivered_at === 'string'
          ? (eventData as Record<string, unknown>).delivered_at
          : undefined

      if (deliveredAtValue) {
        updatePayload.delivered_at = deliveredAtValue
      }

      await supabase.from('deliveries').update(updatePayload).eq('id', deliveryId)
    }
  }

  return NextResponse.json({ received: true })
}
