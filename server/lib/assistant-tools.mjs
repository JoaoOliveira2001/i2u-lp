import { tool } from 'ai'
import { z } from 'zod'
import {
  findProject,
  getProjectLead as queryProjectLead,
  listLinearTasks as queryLinearTasks,
  listProjects as queryListProjects,
  listProjectsWithStatus as queryListProjectsWithStatus,
} from './briefing-queries.mjs'
import { getSupabaseAdmin } from './supabase-admin.mjs'

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseHours(value) {
  if (typeof value === 'number') return value
  const str = String(value).trim()
  if (str.includes(':')) {
    const [h, m] = str.split(':').map(Number)
    return h + (m || 0) / 60
  }
  return Number(str)
}

async function findDeveloper(query) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('developers')
    .select('id, name, hourly_rate_brl')
    .ilike('name', `%${query}%`)
    .limit(5)

  if (error) throw new Error(error.message)
  return data || []
}

async function saveProjectStatusNote(supabaseAdmin, projectId, note, source) {
  const { error: logError } = await supabaseAdmin.from('project_status_logs').insert({
    project_id: projectId,
    note,
    source,
  })
  if (logError) throw new Error(logError.message)

  const { error: updateError } = await supabaseAdmin
    .from('projects')
    .update({
      status_note: note,
      status_note_updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (updateError) throw new Error(updateError.message)
}

export function createAssistantTools() {
  return {
    listProjects: tool({
      description: 'Lista todos os projetos com receita, custo, margem e status de lucratividade.',
      inputSchema: z.object({}),
      execute: async () => queryListProjects(),
    }),

    getProjectDetail: tool({
      description: 'Retorna detalhes de lucratividade e horas de um projeto pelo nome.',
      inputSchema: z.object({
        projectName: z.string().describe('Nome ou parte do nome do projeto'),
      }),
      execute: async ({ projectName }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const matches = await findProject(projectName)
        if (!matches.length) return { error: `Projeto "${projectName}" não encontrado` }

        const project = matches[0]
        const { data: profitability } = await supabaseAdmin
          .from('project_profitability')
          .select('*')
          .eq('project_id', project.id)
          .single()

        const { data: entries, error } = await supabaseAdmin
          .from('time_entries')
          .select('work_date, hours_decimal, task_description, developers(name, hourly_rate_brl)')
          .eq('project_id', project.id)
          .order('work_date', { ascending: false })

        if (error) throw new Error(error.message)

        return { project: profitability, entries }
      },
    }),

    updateProjectValue: tool({
      description: 'Atualiza o valor combinado/contrato (receita) de um projeto em reais.',
      inputSchema: z.object({
        projectName: z.string(),
        valueBrl: z.number().nonnegative(),
      }),
      execute: async ({ projectName, valueBrl }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const matches = await findProject(projectName)
        if (!matches.length) return { error: `Projeto "${projectName}" não encontrado` }

        const project = matches[0]
        const { error } = await supabaseAdmin
          .from('projects')
          .update({ contract_value_brl: valueBrl })
          .eq('id', project.id)

        if (error) throw new Error(error.message)

        const { data } = await supabaseAdmin
          .from('project_profitability')
          .select('*')
          .eq('project_id', project.id)
          .single()

        return {
          ok: true,
          message: `Valor de ${project.name} atualizado para R$ ${valueBrl}`,
          profitability: data,
        }
      },
    }),

    updateProjectPaymentDate: tool({
      description: 'Atualiza ou remove a data em que o pagamento do projeto foi recebido.',
      inputSchema: z.object({
        projectName: z.string(),
        paymentDate: z
          .string()
          .nullable()
          .describe('Data YYYY-MM-DD ou null para limpar'),
      }),
      execute: async ({ projectName, paymentDate }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const matches = await findProject(projectName)
        if (!matches.length) return { error: `Projeto "${projectName}" não encontrado` }

        const project = matches[0]
        const { error } = await supabaseAdmin
          .from('projects')
          .update({ payment_date: paymentDate || null })
          .eq('id', project.id)

        if (error) throw new Error(error.message)

        return {
          ok: true,
          message: paymentDate
            ? `Pagamento de ${project.name} registrado em ${paymentDate}`
            : `Data de pagamento de ${project.name} removida`,
        }
      },
    }),

    updateProject: tool({
      description:
        'Atualiza dados de um projeto: nome, valor combinado, data de pagamento e observações.',
      inputSchema: z.object({
        projectName: z.string(),
        projectStatus: z.enum(['active', 'finalized']).optional(),
        newName: z.string().optional(),
        contractValueBrl: z.number().nonnegative().nullable().optional(),
        paymentDate: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
      execute: async ({ projectName, projectStatus, newName, contractValueBrl, paymentDate, notes }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const matches = await findProject(projectName)
        if (!matches.length) return { error: `Projeto "${projectName}" não encontrado` }

        const project = matches[0]
        const payload = {}
        if (newName != null) payload.name = newName
        if (contractValueBrl !== undefined) payload.contract_value_brl = contractValueBrl
        if (paymentDate !== undefined) payload.payment_date = paymentDate
        if (notes !== undefined) payload.notes = notes
        if (projectStatus !== undefined) payload.status = projectStatus

        const { error } = await supabaseAdmin.from('projects').update(payload).eq('id', project.id)
        if (error) throw new Error(error.message)

        const { data } = await supabaseAdmin
          .from('project_profitability')
          .select('*')
          .eq('project_id', project.id)
          .single()

        return { ok: true, message: `Projeto ${project.name} atualizado`, project: data }
      },
    }),

    addProject: tool({
      description: 'Cria um novo projeto.',
      inputSchema: z.object({
        name: z.string(),
        contractValueBrl: z.number().nonnegative().nullable().optional(),
        paymentDate: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
      execute: async ({ name, contractValueBrl, paymentDate, notes }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const baseSlug = slugify(name)
        let slug = baseSlug
        let attempt = 0
        let data
        let error

        while (attempt < 5) {
          ;({ data, error } = await supabaseAdmin
            .from('projects')
            .insert({
              name,
              slug,
              contract_value_brl: contractValueBrl ?? null,
              payment_date: paymentDate ?? null,
              notes: notes ?? null,
            })
            .select('*')
            .single())

          if (!error) break
          if (error.code !== '23505') throw new Error(error.message)
          attempt += 1
          slug = `${baseSlug}-${attempt}`
        }

        if (error) throw new Error(error.message)

        return { ok: true, message: `Projeto ${name} criado`, project: data }
      },
    }),

    addCollaborator: tool({
      description: 'Adiciona um colaborador por hora ou com custo fixo mensal.',
      inputSchema: z.object({
        name: z.string(),
        costModel: z.enum(['hourly', 'fixed_monthly']),
        hourlyRateBrl: z.number().nonnegative().optional(),
        fixedMonthlyCostBrl: z.number().nonnegative().optional(),
      }),
      execute: async ({ name, costModel, hourlyRateBrl, fixedMonthlyCostBrl }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const payload = {
          name,
          cost_model: costModel,
          active: true,
          hourly_rate_brl: costModel === 'hourly' ? hourlyRateBrl ?? null : null,
          fixed_monthly_cost_brl:
            costModel === 'fixed_monthly' ? fixedMonthlyCostBrl ?? null : null,
        }

        const { data, error } = await supabaseAdmin.from('developers').insert(payload).select('*').single()
        if (error) throw new Error(error.message)

        return { ok: true, message: `Colaborador ${name} adicionado`, collaborator: data }
      },
    }),

    addTimeEntry: tool({
      description: 'Registra horas trabalhadas em um projeto.',
      inputSchema: z.object({
        projectName: z.string(),
        developerName: z.string(),
        workDate: z.string().describe('Data no formato YYYY-MM-DD'),
        hours: z.union([z.number(), z.string()]),
        taskDescription: z.string().optional(),
      }),
      execute: async ({ projectName, developerName, workDate, hours, taskDescription }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const projects = await findProject(projectName)
        const devs = await findDeveloper(developerName)

        if (!projects.length) return { error: `Projeto "${projectName}" não encontrado` }
        if (!devs.length) return { error: `Desenvolvedor "${developerName}" não encontrado` }

        const hoursDecimal = parseHours(hours)
        if (!hoursDecimal || hoursDecimal <= 0) return { error: 'Horas inválidas' }

        const { error } = await supabaseAdmin.from('time_entries').insert({
          project_id: projects[0].id,
          developer_id: devs[0].id,
          work_date: workDate,
          hours_decimal: hoursDecimal,
          task_description: taskDescription || null,
        })

        if (error) throw new Error(error.message)

        const { data } = await supabaseAdmin
          .from('project_profitability')
          .select('*')
          .eq('project_id', projects[0].id)
          .single()

        return {
          ok: true,
          message: `Registrado ${hoursDecimal}h de ${devs[0].name} em ${projects[0].name}`,
          profitability: data,
        }
      },
    }),

    listDevelopers: tool({
      description: 'Lista desenvolvedores com taxa horária ou custo fixo mensal.',
      inputSchema: z.object({}),
      execute: async () => {
        const supabaseAdmin = getSupabaseAdmin()
        const { data, error } = await supabaseAdmin
          .from('developers')
          .select('name, cost_model, hourly_rate_brl, fixed_monthly_cost_brl, active')
          .order('name')

        if (error) throw new Error(error.message)
        return { developers: data }
      },
    }),

    updateProjectStatusNote: tool({
      description:
        'Atualiza o status operacional de um projeto (bloqueios, próximos passos). Cria histórico.',
      inputSchema: z.object({
        projectName: z.string(),
        note: z.string().describe('Texto livre do status, ex: falta cliente aprovar escopo'),
      }),
      execute: async ({ projectName, note }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const matches = await findProject(projectName)
        if (!matches.length) return { error: `Projeto "${projectName}" não encontrado` }

        const trimmed = note.trim()
        if (!trimmed) return { error: 'Status não pode ser vazio' }

        await saveProjectStatusNote(supabaseAdmin, matches[0].id, trimmed, 'assistant')

        const { data } = await supabaseAdmin
          .from('project_profitability')
          .select('name, status_note, status_note_updated_at')
          .eq('project_id', matches[0].id)
          .single()

        return {
          ok: true,
          message: `Status de ${matches[0].name} atualizado`,
          project: data,
        }
      },
    }),

    getProjectStatusHistory: tool({
      description: 'Retorna o histórico de status operacionais de um projeto.',
      inputSchema: z.object({
        projectName: z.string(),
      }),
      execute: async ({ projectName }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const matches = await findProject(projectName)
        if (!matches.length) return { error: `Projeto "${projectName}" não encontrado` }

        const { data, error } = await supabaseAdmin
          .from('project_status_logs')
          .select('note, source, created_at')
          .eq('project_id', matches[0].id)
          .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)

        return { project: matches[0].name, history: data }
      },
    }),

    listProjectsWithStatus: tool({
      description: 'Lista projetos ativos com status operacional atual.',
      inputSchema: z.object({
        onlyWithStatus: z.boolean().optional().describe('Se true, só projetos com status preenchido'),
      }),
      execute: async ({ onlyWithStatus }) => queryListProjectsWithStatus({ onlyWithStatus }),
    }),

    listLinearTasks: tool({
      description: 'Lista tasks/issues do Linear de um projeto (abertas por padrão).',
      inputSchema: z.object({
        projectName: z.string(),
        filter: z.enum(['open', 'all', 'done']).optional(),
      }),
      execute: async ({ projectName, filter = 'open' }) => {
        const result = await queryLinearTasks({ projectName, filter })
        if (result.error) return { error: result.error }
        return result
      },
    }),

    getProjectLead: tool({
      description: 'Retorna o dev responsável (lead) de um projeto vindo do Linear.',
      inputSchema: z.object({
        projectName: z.string(),
      }),
      execute: async ({ projectName }) => {
        const result = await queryProjectLead({ projectName })
        if (result.error) return { error: result.error }
        return result
      },
    }),

    updateDeveloperFixedCost: tool({
      description: 'Atualiza o custo fixo mensal de um colaborador em reais.',
      inputSchema: z.object({
        developerName: z.string(),
        fixedMonthlyCostBrl: z.number().nonnegative(),
      }),
      execute: async ({ developerName, fixedMonthlyCostBrl }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const devs = await findDeveloper(developerName)
        if (!devs.length) return { error: `Colaborador "${developerName}" não encontrado` }

        const { error } = await supabaseAdmin
          .from('developers')
          .update({
            cost_model: 'fixed_monthly',
            fixed_monthly_cost_brl: fixedMonthlyCostBrl,
            hourly_rate_brl: null,
          })
          .eq('id', devs[0].id)

        if (error) throw new Error(error.message)

        return {
          ok: true,
          message: `Custo fixo de ${devs[0].name} atualizado para R$ ${fixedMonthlyCostBrl}/mês`,
        }
      },
    }),

    updateDeveloperRate: tool({
      description: 'Atualiza a taxa horária de um desenvolvedor em reais.',
      inputSchema: z.object({
        developerName: z.string(),
        hourlyRateBrl: z.number().nonnegative(),
      }),
      execute: async ({ developerName, hourlyRateBrl }) => {
        const supabaseAdmin = getSupabaseAdmin()
        const devs = await findDeveloper(developerName)
        if (!devs.length) return { error: `Desenvolvedor "${developerName}" não encontrado` }

        const { error } = await supabaseAdmin
          .from('developers')
          .update({
            cost_model: 'hourly',
            hourly_rate_brl: hourlyRateBrl,
            fixed_monthly_cost_brl: null,
          })
          .eq('id', devs[0].id)

        if (error) throw new Error(error.message)

        return {
          ok: true,
          message: `Taxa de ${devs[0].name} atualizada para R$ ${hourlyRateBrl}/h`,
        }
      },
    }),
  }
}
