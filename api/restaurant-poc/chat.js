import '../../server/lib/load-env.mjs'
import { handleRestaurantPocChat } from '../../server/lib/restaurant-poc/chat-handler.mjs'

export const config = {
  runtime: 'nodejs',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const request = new Request(`https://${req.headers.host}/api/restaurant-poc/chat`, {
    method: 'POST',
    headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
    body: JSON.stringify(req.body),
  })

  const response = await handleRestaurantPocChat(request)
  const headers = Object.fromEntries(response.headers.entries())
  res.status(response.status)
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value)
  }
  res.send(Buffer.from(await response.arrayBuffer()))
}
