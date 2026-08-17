import { handleBotMonitorVercel } from '../../server/lib/bot-monitor.mjs'

export const config = { runtime: 'nodejs' }

export default function handler(req, res) {
  return handleBotMonitorVercel(req, res, '/api/bot-monitor/stats')
}
