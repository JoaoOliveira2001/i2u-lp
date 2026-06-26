import { createServer } from 'node:http'
import { handleAssistantChat } from './lib/assistant-handler.mjs'
import { handleBriefingHttp } from './lib/briefing-handler.mjs'
import { getSupabaseAdmin } from './lib/supabase-admin.mjs'
import { verifyWebhookSignature } from './lib/linear-client.mjs'
import { handleLinearWebhook, syncAllFromLinear } from './lib/linear-sync.mjs'

const port = Number(process.env.API_PORT || 3001)

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function jsonResponse(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/briefing/')) {
    handleBriefingHttp(req, res)
    return
  }

  if (req.method === 'POST' && req.url === '/api/assistant/chat') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)

    const request = new Request(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
      body,
    })

    try {
      const response = await handleAssistantChat(request)
      const headers = Object.fromEntries(response.headers.entries())
      res.writeHead(response.status, headers)
      res.end(Buffer.from(await response.arrayBuffer()))
    } catch (error) {
      jsonResponse(res, 500, { error: error.message || 'Erro interno' })
    }
    return
  }

  if (req.method === 'POST' && req.url === '/api/linear/webhook') {
    try {
      const rawBody = (await readRawBody(req)).toString('utf8')
      const signature = req.headers['linear-signature']
      if (!verifyWebhookSignature(rawBody, signature)) {
        jsonResponse(res, 401, { error: 'Invalid signature' })
        return
      }
      const payload = JSON.parse(rawBody)
      const result = await handleLinearWebhook(getSupabaseAdmin(), payload)
      jsonResponse(res, 200, result)
    } catch (error) {
      jsonResponse(res, 500, { error: error.message || 'Erro interno' })
    }
    return
  }

  if (req.method === 'POST' && req.url === '/api/linear/sync') {
    const secret = process.env.LINEAR_SYNC_SECRET || process.env.VITE_DASHBOARD_PASSWORD
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!secret || token !== secret) {
      jsonResponse(res, 401, { error: 'Unauthorized' })
      return
    }

    try {
      const result = await syncAllFromLinear(getSupabaseAdmin())
      jsonResponse(res, 200, { ok: true, ...result })
    } catch (error) {
      jsonResponse(res, 500, { error: error.message || 'Erro interno' })
    }
    return
  }

  jsonResponse(res, 404, { error: 'Not found' })
})

server.listen(port, () => {
  console.log(`[api] server on http://localhost:${port}`)
})
