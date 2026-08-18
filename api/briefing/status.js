import { handleBriefingVercel } from '../../server/lib/briefing-handler.mjs'

export const config = {
  runtime: 'nodejs',
}

export default function handler(req, res) {
  return handleBriefingVercel(req, res, '/api/briefing/status')
}
