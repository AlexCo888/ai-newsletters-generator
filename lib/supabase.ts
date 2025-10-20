import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.warn('SUPABASE_URL is not set. Database access will fail until configured.')
}

export function supabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role client requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'ai-newsletters-generator-admin',
      },
    },
  })
}

export function supabaseBrowser(accessToken?: string) {
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase browser client requires SUPABASE_URL and SUPABASE_ANON_KEY.')
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        'X-Client-Info': 'ai-newsletters-generator-browser',
      },
    },
  })
}
