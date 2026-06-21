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

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createProject({ name, contractValueBrl, paymentDate, notes }) {
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

export async function fetchProjectById(projectId) {
  const { data, error } = await supabase
    .from('project_profitability')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) throw error
  return data
}
