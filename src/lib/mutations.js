import { supabase } from './supabase'
import { slugify } from './slugify'

export async function updateProject(projectId, fields) {
  const payload = {}

  if (fields.name != null) payload.name = fields.name.trim()
  if (fields.contractValueBrl !== undefined) {
    payload.contract_value_brl =
      fields.contractValueBrl === '' || fields.contractValueBrl == null
        ? null
        : Number(fields.contractValueBrl)
  }
  if (fields.paymentDate !== undefined) {
    payload.payment_date =
      fields.paymentDate === '' || fields.paymentDate == null ? null : fields.paymentDate
  }
  if (fields.notes !== undefined) payload.notes = fields.notes?.trim() || null
  if (fields.projectStatus !== undefined) payload.status = fields.projectStatus
  if (fields.figmaUrl !== undefined) {
    payload.figma_url = fields.figmaUrl?.trim() || null
  }

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createProject({ name, contractValueBrl, paymentDate, notes, figmaUrl }) {
  const baseSlug = slugify(name)
  let slug = baseSlug
  let attempt = 0

  while (attempt < 5) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        slug,
        contract_value_brl:
          contractValueBrl === '' || contractValueBrl == null ? null : Number(contractValueBrl),
        payment_date: paymentDate || null,
        notes: notes?.trim() || null,
        figma_url: figmaUrl?.trim() || null,
      })
      .select('*')
      .single()

    if (!error) return data
    if (error.code !== '23505') throw error
    attempt += 1
    slug = `${baseSlug}-${attempt}`
  }

  throw new Error('Não foi possível gerar slug único para o projeto')
}

export async function createCollaborator({ name, costModel, hourlyRateBrl, fixedMonthlyCostBrl }) {
  const payload = {
    name: name.trim(),
    cost_model: costModel,
    active: true,
  }

  if (costModel === 'hourly') {
    payload.hourly_rate_brl = Number(hourlyRateBrl)
    payload.fixed_monthly_cost_brl = null
  } else {
    payload.fixed_monthly_cost_brl = Number(fixedMonthlyCostBrl)
    payload.hourly_rate_brl = null
  }

  const { data, error } = await supabase.from('developers').insert(payload).select('*').single()
  if (error) throw error
  return data
}

export async function updateCollaborator(developerId, fields) {
  const payload = {}

  if (fields.name != null) payload.name = fields.name.trim()
  if (fields.costModel != null) payload.cost_model = fields.costModel
  if (fields.hourlyRateBrl !== undefined) {
    payload.hourly_rate_brl =
      fields.hourlyRateBrl === '' || fields.hourlyRateBrl == null
        ? null
        : Number(fields.hourlyRateBrl)
  }
  if (fields.fixedMonthlyCostBrl !== undefined) {
    payload.fixed_monthly_cost_brl =
      fields.fixedMonthlyCostBrl === '' || fields.fixedMonthlyCostBrl == null
        ? null
        : Number(fields.fixedMonthlyCostBrl)
  }
  if (fields.active !== undefined) payload.active = fields.active

  const { data, error } = await supabase
    .from('developers')
    .update(payload)
    .eq('id', developerId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createTimeEntry({
  projectId,
  developerId,
  workDate,
  hoursDecimal,
  taskDescription,
}) {
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      project_id: projectId,
      developer_id: developerId,
      work_date: workDate,
      hours_decimal: Number(hoursDecimal),
      task_description: taskDescription?.trim() || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateTimeEntry(entryId, {
  projectId,
  workDate,
  hoursDecimal,
  taskDescription,
}) {
  const payload = {}

  if (projectId != null) payload.project_id = projectId
  if (workDate != null) payload.work_date = workDate
  if (hoursDecimal != null) payload.hours_decimal = Number(hoursDecimal)
  if (taskDescription !== undefined) {
    payload.task_description = taskDescription?.trim() || null
  }

  const { data, error } = await supabase
    .from('time_entries')
    .update(payload)
    .eq('id', entryId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function fetchProjectById(projectId) {
  const { data, error } = await supabase
    .from('project_profitability')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) throw error
  return data
}

export async function fetchStatusHistory(projectId) {
  const { data, error } = await supabase
    .from('project_status_logs')
    .select('id, note, source, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateProjectStatusNote(projectId, note, source = 'manual') {
  const trimmed = note?.trim()
  if (!trimmed) throw new Error('Status não pode ser vazio')

  const { error: logError } = await supabase.from('project_status_logs').insert({
    project_id: projectId,
    note: trimmed,
    source,
  })
  if (logError) throw logError

  const { data, error } = await supabase
    .from('projects')
    .update({
      status_note: trimmed,
      status_note_updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function fetchLinearIssues(projectId, filter = 'open') {
  let query = supabase
    .from('linear_issues')
    .select('*')
    .eq('project_id', projectId)
    .order('linear_updated_at', { ascending: false, nullsFirst: false })

  if (filter === 'open') {
    query = query.not('state_type', 'eq', 'completed').not('state_type', 'eq', 'canceled')
  } else if (filter === 'done') {
    query = query.in('state_type', ['completed', 'canceled'])
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchLinearUserMap() {
  const { data, error } = await supabase
    .from('linear_user_map')
    .select('*, developers(id, name)')
    .order('linear_user_name')

  if (error) throw error
  return data || []
}

export async function upsertLinearUserMap({ linearUserId, linearUserName, developerId }) {
  const { data, error } = await supabase
    .from('linear_user_map')
    .upsert(
      {
        linear_user_id: linearUserId,
        linear_user_name: linearUserName,
        developer_id: developerId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'linear_user_id' },
    )
    .select('*, developers(id, name)')
    .single()

  if (error) throw error
  return data
}

export async function fetchSharedCredentials() {
  const { data, error } = await supabase
    .from('shared_credentials')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true })

  if (error) throw error
  return data || []
}
