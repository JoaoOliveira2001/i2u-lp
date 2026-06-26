import { fetchAllProjects, fetchProjectIssues } from './linear-client.mjs'
import { slugify } from './slugify.mjs'

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function levenshtein(a, b) {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0))

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

function namesLikelyMatch(a, b) {
  const left = normalizeName(a)
  const right = normalizeName(b)
  if (!left || !right) return false
  if (left === right) return true
  if (Math.abs(left.length - right.length) > 1) return false
  return levenshtein(left, right) <= 1
}

function pickBestProjectMatch(matches) {
  if (matches.length === 0) return null
  return matches.sort((a, b) => {
    const aHasValue = a.contract_value_brl != null ? 1 : 0
    const bHasValue = b.contract_value_brl != null ? 1 : 0
    if (aHasValue !== bHasValue) return bHasValue - aHasValue
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })[0]
}

async function findDeveloperByName(supabase, name) {
  if (!name) return null
  const { data } = await supabase.from('developers').select('id, name').eq('active', true)
  const target = normalizeName(name)
  const match = (data || []).find((dev) => {
    const devName = normalizeName(dev.name)
    return devName === target || target.includes(devName) || devName.includes(target)
  })
  return match?.id || null
}

export async function resolveLeadDeveloperId(supabase, lead) {
  if (!lead?.id) return null

  const { data: mapped } = await supabase
    .from('linear_user_map')
    .select('developer_id')
    .eq('linear_user_id', lead.id)
    .maybeSingle()

  if (mapped?.developer_id) return mapped.developer_id

  const candidateName = lead.displayName || lead.name
  const byName = await findDeveloperByName(supabase, candidateName)
  if (byName) {
    await supabase.from('linear_user_map').upsert(
      {
        linear_user_id: lead.id,
        linear_user_name: candidateName,
        developer_id: byName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'linear_user_id' },
    )
    return byName
  }

  await supabase.from('linear_user_map').upsert(
    {
      linear_user_id: lead.id,
      linear_user_name: candidateName || lead.id,
      developer_id: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'linear_user_id' },
  )

  return null
}

async function uniqueSlug(supabase, name, excludeProjectId) {
  const base = slugify(name) || 'projeto'
  let slug = base
  let attempt = 0

  while (attempt < 6) {
    const { data } = await supabase.from('projects').select('id').eq('slug', slug).limit(1)
    const existing = data?.[0]
    if (!existing || existing.id === excludeProjectId) return slug
    attempt += 1
    slug = `${base}-${attempt}`
  }

  return `${base}-${Date.now()}`
}

async function findProjectByNormalizedName(supabase, name) {
  const target = normalizeName(name)
  if (!target) return null

  const { data: projects } = await supabase
    .from('projects')
    .select('id, slug, name, linear_project_id, contract_value_brl, created_at')

  const matches = (projects || []).filter((project) => namesLikelyMatch(project.name, name))
  return pickBestProjectMatch(matches)
}

async function findProjectBySlug(supabase, name, excludeProjectId) {
  const base = slugify(name)
  if (!base) return null

  const { data: projects } = await supabase
    .from('projects')
    .select('id, slug, name, linear_project_id, contract_value_brl, created_at')

  const matches = (projects || []).filter((project) => {
    if (project.id === excludeProjectId) return false
    const projectSlug = project.slug.replace(/-\d+$/, '')
    return projectSlug === base || levenshtein(projectSlug, base) <= 1
  })

  return pickBestProjectMatch(matches)
}

async function findExistingProjectForLinear(supabase, linearProject) {
  const { data: byLinearId } = await supabase
    .from('projects')
    .select('id, slug, name, linear_project_id, contract_value_brl, created_at')
    .eq('linear_project_id', linearProject.id)
    .maybeSingle()

  if (byLinearId) return byLinearId

  const name = linearProject.name?.trim()
  const byName = await findProjectByNormalizedName(supabase, name)
  if (byName && !byName.linear_project_id) return byName

  const bySlug = await findProjectBySlug(supabase, name)
  if (bySlug && !bySlug.linear_project_id) return bySlug

  return null
}

export async function upsertProjectFromLinear(supabase, linearProject) {
  const lead =
    linearProject.lead ||
    (linearProject.leadId ? { id: linearProject.leadId, name: linearProject.leadId } : null)
  const leadDeveloperId = await resolveLeadDeveloperId(supabase, lead)

  const existing = await findExistingProjectForLinear(supabase, linearProject)

  const now = new Date().toISOString()
  const payload = {
    name: linearProject.name?.trim() || 'Projeto Linear',
    notes: linearProject.description?.trim() || null,
    linear_project_id: linearProject.id,
    linear_url: linearProject.url || null,
    lead_developer_id: leadDeveloperId,
    linear_synced_at: now,
    linear_archived_at: linearProject.archivedAt || null,
  }

  if (existing) {
    const updatePayload = { ...payload }
    if (existing.contract_value_brl != null) {
      delete updatePayload.name
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const slug = await uniqueSlug(supabase, payload.name)
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...payload, slug })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function archiveProjectFromLinear(supabase, linearProjectId) {
  const { error } = await supabase
    .from('projects')
    .update({ linear_archived_at: new Date().toISOString(), linear_synced_at: new Date().toISOString() })
    .eq('linear_project_id', linearProjectId)

  if (error) throw new Error(error.message)
}

export async function upsertIssueFromLinear(supabase, linearIssue) {
  const linearProjectId = linearIssue.projectId || linearIssue.project?.id
  if (!linearProjectId) return null

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('linear_project_id', linearProjectId)
    .maybeSingle()

  if (!project) return null

  const payload = {
    linear_issue_id: linearIssue.id,
    project_id: project.id,
    identifier: linearIssue.identifier || null,
    title: linearIssue.title || 'Sem título',
    state_name: linearIssue.state?.name || null,
    state_type: linearIssue.state?.type || null,
    assignee_linear_id: linearIssue.assignee?.id || null,
    assignee_name: linearIssue.assignee?.displayName || linearIssue.assignee?.name || null,
    priority: linearIssue.priority ?? null,
    url: linearIssue.url || null,
    completed_at: linearIssue.completedAt || null,
    linear_updated_at: linearIssue.updatedAt || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('linear_issues')
    .upsert(payload, { onConflict: 'linear_issue_id' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function removeIssueFromLinear(supabase, linearIssueId) {
  const { error } = await supabase.from('linear_issues').delete().eq('linear_issue_id', linearIssueId)
  if (error) throw new Error(error.message)
}

export async function syncProjectIssues(supabase, linearProjectId) {
  const issues = await fetchProjectIssues(linearProjectId)
  for (const issue of issues) {
    await upsertIssueFromLinear(supabase, { ...issue, projectId: linearProjectId })
  }
  return issues.length
}

export async function syncAllFromLinear(supabase) {
  const projects = await fetchAllProjects()
  let issueCount = 0

  for (const project of projects) {
    if (project.archivedAt) {
      await archiveProjectFromLinear(supabase, project.id)
      continue
    }
    await upsertProjectFromLinear(supabase, project)
    issueCount += await syncProjectIssues(supabase, project.id)
  }

  return { projects: projects.length, issues: issueCount }
}

export async function handleLinearWebhook(supabase, payload) {
  const { action, type, data } = payload
  if (!type || !data) return { ok: true, skipped: true }

  if (type === 'Project') {
    if (action === 'remove') {
      await archiveProjectFromLinear(supabase, data.id)
      return { ok: true, type: 'Project', action: 'archive' }
    }
    const project = await upsertProjectFromLinear(supabase, data)
    const issues = await syncProjectIssues(supabase, data.id)
    return { ok: true, type: 'Project', action, projectId: project.id, issues }
  }

  if (type === 'Issue') {
    if (action === 'remove') {
      await removeIssueFromLinear(supabase, data.id)
      return { ok: true, type: 'Issue', action: 'remove' }
    }
    const issue = await upsertIssueFromLinear(supabase, data)
    return { ok: true, type: 'Issue', action, issueId: issue?.id || null }
  }

  return { ok: true, skipped: true, type }
}
