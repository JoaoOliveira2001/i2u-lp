// Acesso à fila multi-unidade no Supabase compartilhado LongLife (somente leitura + RPCs de pausa).
const SUPABASE_URL =
  import.meta.env.VITE_LONGLIFE_SUPABASE_URL || 'https://jlyqptmxcloouaxumdqu.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_LONGLIFE_SUPABASE_KEY || 'sb_publishable_06dgJOD4td-HZzOvpeNn2w_sCz4swgJ'

const BASE_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

async function rest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...BASE_HEADERS, Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Supabase ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`)
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  return data
}

export async function fetchFila() {
  const [status, proximo] = await Promise.all([
    rest('v_fila_status?select=*&order=unidade.asc,ordem.asc'),
    rest('v_fila_proximo?select=*'),
  ])
  return { status: status || [], proximo: proximo || [] }
}

export function pausarVendedor({ unidade, idUsuarioCrm, minutos, motivo, por }) {
  return rest('rpc/pausar_vendedor', {
    method: 'POST',
    body: {
      p_unidade: unidade,
      p_id_usuario_crm: idUsuarioCrm,
      p_minutos: minutos,
      p_motivo: motivo,
      p_por: por || null,
    },
  })
}

export function retomarVendedor({ unidade, idUsuarioCrm }) {
  return rest('rpc/retomar_vendedor', {
    method: 'POST',
    body: { p_unidade: unidade, p_id_usuario_crm: idUsuarioCrm },
  })
}

export const MOTIVOS = [
  { id: 'almoco', label: 'Almoço' },
  { id: 'reuniao', label: 'Reunião' },
  { id: 'banheiro', label: 'Banheiro' },
  { id: 'outro', label: 'Outro' },
]

export const DURACOES = [30, 60, 90, 120]

export function motivoLabel(id) {
  return MOTIVOS.find((m) => m.id === id)?.label || 'Pausa'
}
