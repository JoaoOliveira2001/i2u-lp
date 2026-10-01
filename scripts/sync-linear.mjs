#!/usr/bin/env node
/**
 * Pair public.projects with Linear.
 * Applies the Longlife hours catalog first, then pulls the workspace when
 * LINEAR_API_KEY is set.
 */
import { config } from 'dotenv'
import { getSupabaseAdmin } from '../server/lib/supabase-admin.mjs'
import { syncAllFromLinear } from '../server/lib/linear-sync.mjs'

config({ path: '.env.local' })
config()

const result = await syncAllFromLinear(getSupabaseAdmin())
console.log(JSON.stringify({ ok: true, ...result }, null, 2))
