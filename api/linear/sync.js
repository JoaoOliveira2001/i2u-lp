import { getSupabaseAdmin } from '../../server/lib/supabase-admin.mjs'
import { syncAllFromLinear } from '../../server/lib/linear-sync.mjs'

export const config = {
  runtime: 'nodejs',
}

function isAuthorized(req) {
  const secret = process.env.LINEAR_SYNC_SECRET || process.env.VITE_DASHBOARD_PASSWORD
  if (!secret) return false
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === secret
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const result = await syncAllFromLinear(supabase)
    res.status(200).json({ ok: true, ...result })
  } catch (error) {
    console.error('[linear/sync]', error)
    res.status(500).json({ error: error.message || 'Erro interno' })
  }
}
