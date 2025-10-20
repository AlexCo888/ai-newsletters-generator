import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const sig = request.headers.get('x-cron-signature')
  if (!sig || sig !== process.env.CRON_SIGNATURE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supa = supabaseAdmin()
  const { data: due, error } = await supa
    .from('deliveries')
    .select('id, send_at')
    .lte('send_at', new Date().toISOString())
    .eq('status', 'scheduled')
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // TODO: generate content (if not generated) and send via Resend

  return NextResponse.json({ ok: true, processed: due?.length ?? 0 })
}
