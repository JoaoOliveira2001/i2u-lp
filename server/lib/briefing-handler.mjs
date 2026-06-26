import { isBriefingAuthorized } from './briefing-auth.mjs'
import {
  getMorningBriefing,
  getProjectLead,
  listLinearTasks,
  listProjects,
  listProjectsWithStatus,
} from './briefing-queries.mjs'

export async function handleBriefingRoute(req, pathname, query) {
  if (!isBriefingAuthorized(req)) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  try {
    if (pathname === '/api/briefing/morning') {
      return { status: 200, body: await getMorningBriefing() }
    }

    if (pathname === '/api/briefing/projects') {
      const status = query.get('status') || undefined
      return { status: 200, body: await listProjects({ status, includeAlerts: true }) }
    }

    if (pathname === '/api/briefing/status') {
      const onlyWithStatus = query.get('onlyWithStatus') === 'true'
      return { status: 200, body: await listProjectsWithStatus({ onlyWithStatus }) }
    }

    if (pathname === '/api/briefing/linear-tasks') {
      const projectName = query.get('projectName')
      if (!projectName) {
        return { status: 400, body: { error: 'projectName é obrigatório' } }
      }
      const filter = query.get('filter') || 'open'
      const result = await listLinearTasks({ projectName, filter })
      if (result.error) {
        return { status: result.status || 404, body: { error: result.error } }
      }
      return { status: 200, body: result }
    }

    if (pathname === '/api/briefing/lead') {
      const projectName = query.get('projectName')
      if (!projectName) {
        return { status: 400, body: { error: 'projectName é obrigatório' } }
      }
      const result = await getProjectLead({ projectName })
      if (result.error) {
        return { status: result.status || 404, body: { error: result.error } }
      }
      return { status: 200, body: result }
    }

    return { status: 404, body: { error: 'Not found' } }
  } catch (error) {
    console.error('[briefing]', pathname, error)
    return { status: 500, body: { error: error.message || 'Erro interno' } }
  }
}

export function queryFromRequest(req) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query || {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)))
    } else if (value != null) {
      params.set(key, String(value))
    }
  }
  return params
}

export async function handleBriefingVercel(req, res, pathname) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { status, body } = await handleBriefingRoute(req, pathname, queryFromRequest(req))
  sendBriefingResponse(res, status, body)
}

export function sendBriefingResponse(res, status, body) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(body)
    return
  }
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

export function handleBriefingHttp(req, res) {
  const url = req.url || ''
  const pathname = url.split('?')[0]
  const query = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '')

  handleBriefingRoute(req, pathname, query).then(({ status, body }) => {
    sendBriefingResponse(res, status, body)
  })
}
