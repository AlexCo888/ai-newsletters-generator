import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

function assertEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export function supabaseAdmin() {
  if (!adminClient) {
    const url = assertEnv('SUPABASE_URL', process.env.SUPABASE_URL)
    const serviceKey = assertEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)
    adminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  return adminClient
}

export function supabaseUserClient(accessToken: string) {
  const url = assertEnv('SUPABASE_URL', process.env.SUPABASE_URL)
  const anonKey = assertEnv('SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY)

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
