import { getSupabaseAdmin } from '../../server/lib/supabase-admin.mjs'
import { verifyWebhookSignature } from '../../server/lib/linear-client.mjs'
import { handleLinearWebhook } from '../../server/lib/linear-sync.mjs'

export const config = {
  runtime: 'nodejs',
}

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const rawBody = await readRawBody(req)
    const signature = req.headers['linear-signature']
    if (!verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    const payload = JSON.parse(rawBody)
    const supabase = getSupabaseAdmin()
    const result = await handleLinearWebhook(supabase, payload)
    res.status(200).json(result)
  } catch (error) {
    console.error('[linear/webhook]', error)
    res.status(500).json({ error: error.message || 'Erro interno' })
  }
}
