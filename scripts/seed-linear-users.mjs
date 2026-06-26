#!/usr/bin/env node
import { config } from 'dotenv'
import { fetchWorkspaceUsers } from '../server/lib/linear-client.mjs'
import { getSupabaseAdmin } from '../server/lib/supabase-admin.mjs'

config({ path: '.env.local' })
config()

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

async function main() {
  const supabase = getSupabaseAdmin()
  const [users, devsRes] = await Promise.all([
    fetchWorkspaceUsers(),
    supabase.from('developers').select('id, name').eq('active', true).order('name'),
  ])

  const developers = devsRes.data || []
  console.log('\nUsuários Linear:')
  for (const user of users) {
    console.log(`- ${user.displayName || user.name} (${user.email}) → ${user.id}`)
  }

  console.log('\nDevs i2u:')
  for (const dev of developers) {
    console.log(`- ${dev.name} → ${dev.id}`)
  }

  console.log('\nAuto-match por nome:')
  for (const user of users) {
    const userName = normalizeName(user.displayName || user.name)
    const dev = developers.find((d) => normalizeName(d.name) === userName)
    const label = user.displayName || user.name

    const { error } = await supabase.from('linear_user_map').upsert(
      {
        linear_user_id: user.id,
        linear_user_name: label,
        developer_id: dev?.id || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'linear_user_id' },
    )

    if (error) {
      console.error(`  ✗ ${label}:`, error.message)
      continue
    }

    console.log(`  ✓ ${label} → ${dev?.name || '(sem match)'}`)
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
