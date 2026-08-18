import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })
config()

let client

export function getSupabaseAdmin() {
  if (client) return client

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase env vars missing (SUPABASE_URL / SUPABASE_ANON_KEY)')
  }

  client = createClient(url, key)
  return client
}
