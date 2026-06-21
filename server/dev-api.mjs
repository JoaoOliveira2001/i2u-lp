import { createServer } from 'node:http'
import { handleAssistantChat } from './lib/assistant-handler.mjs'

const port = Number(process.env.API_PORT || 3001)

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
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
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: error.message || 'Erro interno' }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(port, () => {
  console.log(`[api] assistant server on http://localhost:${port}`)
})
