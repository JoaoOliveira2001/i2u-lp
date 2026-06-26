import { getAttentionReasons } from '../../src/lib/projectAlerts.js'
import {
  collectOperationalPendencies,
  formatStatusHistory,
} from './briefing-pendencies.mjs'
import { getSupabaseAdmin } from './supabase-admin.mjs'

export async function findProject(query) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id, slug, name, contract_value_brl')
    .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
    .limit(5)

  if (error) throw new Error(error.message)
  return data || []
}

function financialAlerts(project) {
  return getAttentionReasons(project).filter((reason) => reason !== project.status_note)
}

function withFinancialAlerts(projects) {
  return projects.map((project) => ({
    ...project,
    alerts: financialAlerts(project),
  }))
}

export async function listProjects({ status, includeAlerts = false } = {}) {
  const supabaseAdmin = getSupabaseAdmin()
  let query = supabaseAdmin.from('project_profitability').select('*').order('name')

  if (status) {
    query = query.eq('project_status', status)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const projects = data || []
  return {
    projects: includeAlerts ? withFinancialAlerts(projects) : projects,
  }
}

export async function listProjectsWithStatus({ onlyWithStatus } = {}) {
  const supabaseAdmin = getSupabaseAdmin()
  let query = supabaseAdmin
    .from('project_profitability')
    .select('project_id, name, status_note, status_note_updated_at, project_status, revenue_brl, margin_pct')
    .eq('project_status', 'active')
    .order('name')

  if (onlyWithStatus) {
    query = query.not('status_note', 'is', null)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const projects = data || []
  const projectIds = projects.map((p) => p.project_id)

  let logsByProject = new Map()
  if (projectIds.length) {
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('project_status_logs')
      .select('project_id, note, source, created_at')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })

    if (logsError) throw new Error(logsError.message)

    for (const log of logs || []) {
      const list = logsByProject.get(log.project_id) || []
      list.push(log)
      logsByProject.set(log.project_id, list)
    }
  }

  return {
    projects: projects.map((p) => {
      const projectLogs = logsByProject.get(p.project_id) || []
      return {
        ...p,
        operational_status: p.status_note,
        pendencies: collectOperationalPendencies(p.status_note, projectLogs),
        status_history: formatStatusHistory(projectLogs),
      }
    }),
  }
}

export async function listLinearTasks({ projectName, filter = 'open' }) {
  const supabaseAdmin = getSupabaseAdmin()
  const matches = await findProject(projectName)
  if (!matches.length) {
    return { error: `Projeto "${projectName}" não encontrado`, status: 404 }
  }

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, name, linear_project_id')
    .eq('id', matches[0].id)
    .single()

  if (!project?.linear_project_id) {
    return { error: `Projeto "${matches[0].name}" não está vinculado ao Linear`, status: 404 }
  }

  let query = supabaseAdmin
    .from('linear_issues')
    .select('identifier, title, state_name, state_type, assignee_name, url, priority')
    .eq('project_id', project.id)
    .order('linear_updated_at', { ascending: false })

  if (filter === 'open') {
    query = query.not('state_type', 'eq', 'completed').not('state_type', 'eq', 'canceled')
  } else if (filter === 'done') {
    query = query.in('state_type', ['completed', 'canceled'])
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return { project: project.name, filter, tasks: data || [] }
}

export async function getProjectLead({ projectName }) {
  const supabaseAdmin = getSupabaseAdmin()
  const matches = await findProject(projectName)
  if (!matches.length) {
    return { error: `Projeto "${projectName}" não encontrado`, status: 404 }
  }

  const { data, error } = await supabaseAdmin
    .from('project_profitability')
    .select('name, lead_developer_name, linear_url, linear_open_issues')
    .eq('project_id', matches[0].id)
    .single()

  if (error) throw new Error(error.message)
  return { project: data }
}

export async function getMorningBriefing() {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: projects, error } = await supabaseAdmin
    .from('project_profitability')
    .select('*')
    .eq('project_status', 'active')
    .order('name')

  if (error) throw new Error(error.message)

  const activeProjects = projects || []
  const projectIds = activeProjects.map((p) => p.project_id)

  let openTasks = []
  let statusLogs = []

  if (projectIds.length) {
    const [tasksResult, logsResult] = await Promise.all([
      supabaseAdmin
        .from('linear_issues')
        .select(
          'project_id, identifier, title, state_name, state_type, assignee_name, url, priority',
        )
        .in('project_id', projectIds)
        .not('state_type', 'eq', 'completed')
        .not('state_type', 'eq', 'canceled')
        .order('linear_updated_at', { ascending: false }),
      supabaseAdmin
        .from('project_status_logs')
        .select('project_id, note, source, created_at')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false }),
    ])

    if (tasksResult.error) throw new Error(tasksResult.error.message)
    if (logsResult.error) throw new Error(logsResult.error.message)

    openTasks = tasksResult.data || []
    statusLogs = logsResult.data || []
  }

  const tasksByProject = new Map()
  for (const task of openTasks) {
    const list = tasksByProject.get(task.project_id) || []
    list.push({
      identifier: task.identifier,
      title: task.title,
      state_name: task.state_name,
      state_type: task.state_type,
      assignee_name: task.assignee_name,
      url: task.url,
      priority: task.priority,
    })
    tasksByProject.set(task.project_id, list)
  }

  const logsByProject = new Map()
  for (const log of statusLogs) {
    const list = logsByProject.get(log.project_id) || []
    list.push(log)
    logsByProject.set(log.project_id, list)
  }

  return {
    generated_at: new Date().toISOString(),
    projects: activeProjects.map((p) => {
      const projectLogs = logsByProject.get(p.project_id) || []
      const projectOpenTasks = tasksByProject.get(p.project_id) || []
      const pendencies = collectOperationalPendencies(p.status_note, projectLogs)

      return {
        name: p.name,
        project_id: p.project_id,
        operational_status: p.status_note,
        status_note: p.status_note,
        status_note_updated_at: p.status_note_updated_at,
        pendencies,
        status_history: formatStatusHistory(projectLogs),
        lead: p.lead_developer_name,
        linear_open_issues: p.linear_open_issues,
        linear_url: p.linear_url,
        open_tasks: projectOpenTasks,
        alerts: financialAlerts(p),
        revenue_brl: p.revenue_brl,
        margin_pct: p.margin_pct,
        margin_brl: p.margin_brl,
        payment_date: p.payment_date,
        status: p.status,
        project_status: p.project_status,
      }
    }),
  }
}
