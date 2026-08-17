import { getSupabaseAdmin } from './supabase-admin.mjs'
import { syncProjectIssues } from './linear-sync.mjs'

const TZ = 'America/Sao_Paulo'

const PRIORITY_LABELS = {
  1: 'Urgente',
  2: 'Alta',
  3: 'Normal',
  4: 'Baixa',
}

function getMonthContext(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)

  const year = Number(parts.find((p) => p.type === 'year').value)
  const month = Number(parts.find((p) => p.type === 'month').value)
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const monthLabel = new Date(`${start}T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  })

  return { year, month, start, end, monthLabel }
}

function sumHours(entries) {
  return entries.reduce((acc, row) => acc + Number(row.hours_decimal || 0), 0)
}

function formatUpdatedAt(value) {
  if (!value) return null
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: TZ,
  })
}

async function fetchOpenIssues(supabase, projectId) {
  const { data, error } = await supabase
    .from('linear_issues')
    .select(
      'identifier, title, state_name, state_type, assignee_name, url, linear_updated_at, priority',
    )
    .eq('project_id', projectId)
    .not('state_type', 'eq', 'completed')
    .not('state_type', 'eq', 'canceled')
    .order('linear_updated_at', { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  return data || []
}

function mapIssues(issues) {
  return issues.map((issue) => ({
    identifier: issue.identifier,
    title: issue.title,
    stateName: issue.state_name,
    stateType: issue.state_type,
    assigneeName: issue.assignee_name,
    url: issue.url,
    updatedAt: issue.linear_updated_at,
    updatedLabel: formatUpdatedAt(issue.linear_updated_at),
    priority: issue.priority,
    priorityLabel: PRIORITY_LABELS[issue.priority] || null,
  }))
}

function buildTaskSummary(tasks) {
  const byState = new Map()
  for (const task of tasks) {
    const key = task.stateName || 'Sem status'
    byState.set(key, (byState.get(key) || 0) + 1)
  }
  return Array.from(byState.entries())
    .map(([stateName, count]) => ({ stateName, count }))
    .sort((a, b) => b.count - a.count)
}

export async function getClientPortalData(slug) {
  const normalizedSlug = String(slug || '')
    .trim()
    .toLowerCase()
  if (!normalizedSlug) return null

  const supabase = getSupabaseAdmin()
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(
      'id, name, linear_project_id, linear_url, linear_synced_at, included_hours_monthly, contract_value_brl, client_portal_enabled, status',
    )
    .eq('client_portal_slug', normalizedSlug)
    .eq('client_portal_enabled', true)
    .maybeSingle()

  if (projectError) throw new Error(projectError.message)
  if (!project) return null

  let linearSyncedAt = project.linear_synced_at || null
  let linearSyncLive = false

  if (project.linear_project_id && process.env.LINEAR_API_KEY) {
    try {
      const result = await syncProjectIssues(supabase, project.linear_project_id)
      linearSyncedAt = result.syncedAt
      linearSyncLive = true
    } catch (err) {
      console.error('[client-portal] Linear sync failed:', err.message)
    }
  }

  const { start, end, monthLabel } = getMonthContext()

  const [monthEntriesRes, issues] = await Promise.all([
    supabase
      .from('time_entries')
      .select('work_date, hours_decimal, task_description')
      .eq('project_id', project.id)
      .gte('work_date', start)
      .lte('work_date', end)
      .order('work_date', { ascending: false }),
    fetchOpenIssues(supabase, project.id),
  ])

  if (monthEntriesRes.error) throw new Error(monthEntriesRes.error.message)

  const monthEntries = monthEntriesRes.data || []
  const usedThisMonth = sumHours(monthEntries)
  const includedMonthly = Number(project.included_hours_monthly) || 0
  const remainingThisMonth = includedMonthly - usedThisMonth
  const usagePercent =
    includedMonthly > 0 ? Math.round((usedThisMonth / includedMonthly) * 1000) / 10 : 0

  const openTasks = mapIssues(issues)

  return {
    projectName: project.name,
    monthLabel,
    hours: {
      includedMonthly,
      usedThisMonth,
      remainingThisMonth,
      usagePercent,
    },
    entriesThisMonth: monthEntries.map((entry) => ({
      workDate: entry.work_date,
      hours: Number(entry.hours_decimal) || 0,
      description: entry.task_description || null,
    })),
    openTasks,
    taskSummary: buildTaskSummary(openTasks),
    openTasksCount: openTasks.length,
    linear: {
      linked: Boolean(project.linear_project_id),
      url: project.linear_url || null,
      syncedAt: linearSyncedAt,
      syncLive: linearSyncLive,
    },
    updatedAt: new Date().toISOString(),
  }
}

export async function handleClientPortalHttp(req, res, slug) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const data = await getClientPortalData(slug)
    if (!data) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Portal não encontrado' }))
      return
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    })
    res.end(JSON.stringify(data))
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message || 'Erro interno' }))
  }
}

export async function handleClientPortalVercel(req, res, slug) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = await getClientPortalData(slug)
    if (!data) {
      return res.status(404).json({ error: 'Portal não encontrado' })
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno' })
  }
}
