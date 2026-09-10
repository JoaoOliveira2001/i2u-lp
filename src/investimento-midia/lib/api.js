import { supabase } from '../../lib/supabase'
import { PROJECT_SLUG, UNIDADE } from './config'

export async function fetchLonglifeProjectId() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', PROJECT_SLUG)
    .single()

  if (error) throw error
  if (!data?.id) throw new Error(`Projeto ${PROJECT_SLUG} não encontrado`)
  return data.id
}

export async function fetchCatalogo(projectId) {
  const { data, error } = await supabase
    .from('investimento_midia_catalogo')
    .select('campanha, last_seen_at')
    .eq('project_id', projectId)
    .eq('unidade', UNIDADE)
    .order('campanha')

  if (error) throw error
  return data || []
}

export async function fetchSpendMonth(projectId, periodoMes) {
  const { data, error } = await supabase
    .from('investimento_midia')
    .select('campanha, valor_investimento, atualizado_em, atualizado_por')
    .eq('project_id', projectId)
    .eq('unidade', UNIDADE)
    .eq('periodo_mes', periodoMes)
    .order('campanha')

  if (error) throw error
  return data || []
}

export async function upsertSpend({ projectId, periodoMes, campanha, valor, atualizadoPor }) {
  const { error } = await supabase.from('investimento_midia').upsert(
    {
      project_id: projectId,
      unidade: UNIDADE,
      periodo_mes: periodoMes,
      campanha,
      valor_investimento: valor,
      atualizado_por: atualizadoPor,
    },
    { onConflict: 'project_id,unidade,periodo_mes,campanha' },
  )

  if (error) throw error
}

export async function deleteSpend({ projectId, periodoMes, campanha }) {
  const { error } = await supabase
    .from('investimento_midia')
    .delete()
    .eq('project_id', projectId)
    .eq('unidade', UNIDADE)
    .eq('periodo_mes', periodoMes)
    .eq('campanha', campanha)

  if (error) throw error
}
