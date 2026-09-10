export const PROJECT_SLUG = 'longlife'
export const UNIDADE = 'braganca'
export const QUEM_STORAGE_KEY = 'lon22_quem'
export const DEFAULT_ATUALIZADO_POR = 'pagina-investimento'

export function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function yearMonthToPeriodo(ym) {
  return ym ? `${ym}-01` : null
}

export function parseValor(raw) {
  const trimmed = String(raw ?? '').trim()
  if (trimmed === '') return { empty: true, valor: null }
  const valor = Number(String(trimmed).replace(',', '.'))
  if (!Number.isFinite(valor) || valor < 0) {
    return { empty: false, valor: null, invalid: true }
  }
  return { empty: false, valor }
}

export function draftValue(campanha, draftByCampanha, savedByCampanha) {
  if (Object.prototype.hasOwnProperty.call(draftByCampanha, campanha)) {
    return draftByCampanha[campanha]
  }
  const saved = savedByCampanha[campanha]
  return saved ? String(saved.valor_investimento) : ''
}

export function isDirty(campanha, draftByCampanha, savedByCampanha) {
  const draft = draftValue(campanha, draftByCampanha, savedByCampanha).trim()
  const saved = savedByCampanha[campanha]
  if (!saved) return draft !== ''
  return draft !== String(saved.valor_investimento)
}
