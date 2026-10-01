#!/usr/bin/env node
/**
 * Upsert the Linear Longlife hours catalog into public.projects.
 * Does not require LINEAR_API_KEY. Existing project ids are preserved.
 */
import { config } from 'dotenv'
import { getSupabaseAdmin } from '../server/lib/supabase-admin.mjs'
import { ensureLonglifeHoursProjects } from '../src/lib/longlifeHoursProjects.js'

config({ path: '.env.local' })
config()

const result = await ensureLonglifeHoursProjects(getSupabaseAdmin())
console.log(JSON.stringify({ ok: true, source: 'longlife-catalog', ...result }, null, 2))
