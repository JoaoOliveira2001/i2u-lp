import { getBriefingSecret, isBriefingAuthorized } from './briefing-auth.mjs'

const EVENT_TYPE_ALIASES = {
  success: 'success',
  sucesso: 'success',
  ok: 'success',
  finished: 'success',
  finalizado: 'success',
  conversation_success: 'success',
  conversation_end: 'conversation_end',
  end: 'conversation_end',
  error: 'error',
  erro: 'error',
  exception: 'error',
  failure: 'error',
  falha: 'error',
  exception_redirect: 'exception_redirect',
  redirect_exception: 'exception_redirect',
  redirect: 'exception_redirect',
  excecao: 'exception_redirect',
  exceção: 'exception_redirect',
  conversation_start: 'conversation_start',
  start: 'conversation_start',
  inicio: 'conversation_start',
}

export function normalizeEventType(raw) {
  if (!raw) return 'other'
  const key = String(raw).trim().toLowerCase().replace(/\s+/g, '_')
  return EVENT_TYPE_ALIASES[key] || (EVENT_TYPE_ALIASES[key.replace(/-/g, '_')] ?? 'other')
}

function pickString(...values) {
  for (const value of values) {
    if (value == null) continue
    const text = String(value).trim()
    if (text) return text
  }
  return null
}

function normalizeEvent(raw = {}, fallbackProjectId) {
  const eventType = normalizeEventType(
    raw.event_type ?? raw.eventType ?? raw.type ?? raw.status ?? raw.outcome,
  )

  const occurredAt = raw.occurred_at ?? raw.occurredAt ?? raw.timestamp ?? raw.created_at
  const parsedDate = occurredAt ? new Date(occurredAt) : new Date()

  return {
    project_id: raw.project_id ?? raw.projectId ?? fallbackProjectId ?? null,
    event_type: eventType,
    block_id: pickString(raw.block_id, raw.blockId, raw.block?.id, raw.state?.id),
    block_name: pickString(raw.block_name, raw.blockName, raw.block?.name, raw.state?.name),
    conversation_id: pickString(
      raw.conversation_id,
      raw.conversationId,
      raw.identity,
      raw.session_id,
      raw.sessionId,
    ),
    contact_id: pickString(raw.contact_id, raw.contactId, raw.user_id, raw.userId),
    error_code: pickString(raw.error_code, raw.errorCode, raw.code),
    error_message: pickString(raw.error_message, raw.errorMessage, raw.message, raw.reason),
    raw_payload: raw.raw ?? raw.payload ?? raw,
    occurred_at: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
  }
}

async function resolveProject(supabase, { projectId, projectSlug, projectName }) {
  if (projectId) {
    const { data } = await supabase.from('projects').select('id, slug, name').eq('id', projectId).maybeSingle()
    if (data) return data
  }

  const slug = projectSlug || (projectName ? String(projectName).toLowerCase().replace(/\s+/g, '-') : null)
  if (slug) {
    const { data } = await supabase.from('projects').select('id, slug, name').eq('slug', slug).maybeSingle()
    if (data) return data
  }

  if (projectName) {
    const { data } = await supabase
      .from('projects')
      .select('id, slug, name')
      .ilike('name', projectName)
      .maybeSingle()
    if (data) return data
  }

  return null
}

async function resolveMonitor(supabase, projectId) {
  const { data } = await supabase
    .from('bot_monitors')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle()
  return data?.id ?? null
}

export async function ingestBotEvents(supabase, body) {
  const projectRef = {
    projectId: body.project_id ?? body.projectId,
    projectSlug: body.project_slug ?? body.projectSlug ?? body.project,
    projectName: body.project_name ?? body.projectName,
  }

  const project = await resolveProject(supabase, projectRef)
  if (!project) {
    throw new Error('Projeto não encontrado. Informe project, project_slug ou project_id.')
  }

  const monitorId = await resolveMonitor(supabase, project.id)
  const rawEvents = Array.isArray(body.events)
    ? body.events
    : Array.isArray(body.items)
      ? body.items
      : body.event || body.event_type || body.type
        ? [body]
        : []

  if (!rawEvents.length) {
    throw new Error('Nenhum evento informado.')
  }

  const rows = rawEvents.map((raw) => {
    const normalized = normalizeEvent(raw, project.id)
    return {
      monitor_id: monitorId,
      project_id: project.id,
      event_type: normalized.event_type,
      block_id: normalized.block_id,
      block_name: normalized.block_name,
      conversation_id: normalized.conversation_id,
      contact_id: normalized.contact_id,
      error_code: normalized.error_code,
      error_message: normalized.error_message,
      raw_payload: normalized.raw_payload,
      occurred_at: normalized.occurred_at,
    }
  })

  const { data, error } = await supabase.from('bot_events').insert(rows).select('id, event_type, occurred_at')
  if (error) throw new Error(error.message)

  return {
    ok: true,
    project: { id: project.id, slug: project.slug, name: project.name },
    inserted: data?.length ?? rows.length,
    events: data,
  }
}

export async function getBotMonitorStats(supabase, projectSlug = 'gl2', { days = 30 } = {}) {
  const project = await resolveProject(supabase, { projectSlug })
  if (!project) throw new Error(`Projeto "${projectSlug}" não encontrado.`)

  const since = new Date()
  since.setDate(since.getDate() - Number(days || 30))
  const sinceIso = since.toISOString()

  const [{ data: summary }, { data: blocks }, { data: recentEvents }, { data: monitor }] =
    await Promise.all([
      supabase
        .from('bot_events')
        .select('event_type, conversation_id, occurred_at')
        .eq('project_id', project.id)
        .gte('occurred_at', sinceIso),
      supabase
        .from('bot_monitor_block_stats')
        .select('*')
        .eq('project_id', project.id)
        .order('total_exception_hits', { ascending: false })
        .limit(15),
      supabase
        .from('bot_events')
        .select(
          'id, event_type, block_id, block_name, conversation_id, error_message, occurred_at',
        )
        .eq('project_id', project.id)
        .gte('occurred_at', sinceIso)
        .order('occurred_at', { ascending: false })
        .limit(50),
      supabase.from('bot_monitors').select('*').eq('project_id', project.id).maybeSingle(),
    ])

  const events = summary || []
  const successCount = events.filter((e) => ['success', 'conversation_end'].includes(e.event_type)).length
  const errorCount = events.filter((e) => e.event_type === 'error').length
  const redirectCount = events.filter((e) => e.event_type === 'exception_redirect').length
  const startCount = events.filter((e) => e.event_type === 'conversation_start').length
  const uniqueConversations = new Set(events.map((e) => e.conversation_id).filter(Boolean)).size
  const totalOutcomes = successCount + errorCount + redirectCount
  const successRate = totalOutcomes > 0 ? Math.round((successCount / totalOutcomes) * 1000) / 10 : null

  return {
    project,
    monitor,
    period_days: Number(days || 30),
    stats: {
      success_count: successCount,
      error_count: errorCount,
      exception_redirect_count: redirectCount,
      conversation_start_count: startCount,
      unique_conversations: uniqueConversations,
      success_rate_pct: successRate,
      last_event_at: events.length
        ? events.reduce((max, e) => (e.occurred_at > max ? e.occurred_at : max), events[0].occurred_at)
        : null,
    },
    top_exception_blocks: blocks || [],
    recent_events: recentEvents || [],
  }
}

export function isBotMonitorAuthorized(req) {
  return isBriefingAuthorized(req)
}

export function getBotMonitorSecret() {
  return getBriefingSecret()
}

export async function handleBotMonitorIngest(req, supabase, parsedBody) {
  if (req.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } }
  }
  if (!isBotMonitorAuthorized(req)) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  let body = parsedBody
  if (body == null) {
    try {
      body = await req.json()
    } catch {
      return { status: 400, body: { error: 'JSON inválido' } }
    }
  }

  try {
    const result = await ingestBotEvents(supabase, body)
    return { status: 200, body: result }
  } catch (error) {
    return { status: 400, body: { error: error.message || 'Erro ao registrar eventos' } }
  }
}

export async function handleBotMonitorStats(req, supabase, projectSlug = 'gl2', queryOverride) {
  if (req.method !== 'GET') {
    return { status: 405, body: { error: 'Method not allowed' } }
  }

  const query =
    queryOverride ||
    (req.url ? new URL(req.url, 'http://localhost').searchParams : new URLSearchParams())
  const days = Number(query.get('days') || 30)
  const slug = query.get('project') || projectSlug

  try {
    const result = await getBotMonitorStats(supabase, slug, { days })
    return { status: 200, body: result }
  } catch (error) {
    return { status: 404, body: { error: error.message || 'Monitor não encontrado' } }
  }
}

export async function handleBotMonitorHttp(req, res, pathname, parsedBody) {
  const { getSupabaseAdmin } = await import('./supabase-admin.mjs')
  const supabase = getSupabaseAdmin()
  const query = new URL(req.url || '/', 'http://localhost').searchParams

  let result
  if (pathname === '/api/bot-monitor/ingest') {
    result = await handleBotMonitorIngest(req, supabase, parsedBody)
  } else if (pathname.startsWith('/api/bot-monitor/stats')) {
    result = await handleBotMonitorStats(req, supabase, 'gl2', query)
  } else {
    result = { status: 404, body: { error: 'Not found' } }
  }

  res.writeHead(result.status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result.body))
}

export async function handleBotMonitorVercel(req, res, pathname) {
  const { getSupabaseAdmin } = await import('./supabase-admin.mjs')
  const supabase = getSupabaseAdmin()

  let result
  if (pathname === '/api/bot-monitor/ingest') {
    result = await handleBotMonitorIngest(req, supabase)
  } else if (pathname.startsWith('/api/bot-monitor/stats')) {
    result = await handleBotMonitorStats(req, supabase)
  } else {
    result = { status: 404, body: { error: 'Not found' } }
  }

  res.status(result.status).json(result.body)
}
