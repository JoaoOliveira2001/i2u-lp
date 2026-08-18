/**
 * Extrai itens numerados ou com bullet de um texto de status.
 * Suporta: "Pendências:\n1) ...\n2) ..." ou linhas "1) ..." / "- ..."
 */
export function parsePendenciesFromText(text) {
  if (!text) return []

  const lines = String(text).split('\n')
  const pendencies = []
  let inSection = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (/^pend[eê]ncias?\s*:/i.test(trimmed)) {
      inSection = true
      continue
    }

    const numbered = trimmed.match(/^\d+[\).:]\s*(.+)/)
    const bulleted = trimmed.match(/^[-*•]\s+(.+)/)

    if (numbered) {
      pendencies.push(numbered[1].trim())
      inSection = true
      continue
    }

    if (bulleted) {
      pendencies.push(bulleted[1].trim())
      inSection = true
      continue
    }

    if (inSection && pendencies.length) {
      // Linha de continuação após item numerado
      pendencies[pendencies.length - 1] += ` ${trimmed}`
    }
  }

  return pendencies
}

/**
 * Coleta pendências operacionais: status_note atual + histórico de logs.
 * Se o status_note não tiver lista estruturada, busca no histórico mais recente.
 */
export function collectOperationalPendencies(statusNote, statusLogs = []) {
  const seen = new Set()
  const result = []

  const add = (item) => {
    const key = item.toLowerCase().trim()
    if (!key || seen.has(key)) return
    seen.add(key)
    result.push(item.trim())
  }

  for (const item of parsePendenciesFromText(statusNote)) {
    add(item)
  }

  if (result.length === 0) {
    for (const log of statusLogs) {
      const parsed = parsePendenciesFromText(log.note)
      if (parsed.length) {
        parsed.forEach(add)
        break
      }
    }
  } else {
    // Complementa com pendências de logs mais recentes que não estejam no note
    for (const log of statusLogs) {
      for (const item of parsePendenciesFromText(log.note)) {
        add(item)
      }
    }
  }

  return result
}

export function formatStatusHistory(logs, limit = 5) {
  return (logs || []).slice(0, limit).map((log) => ({
    note: log.note,
    source: log.source,
    created_at: log.created_at,
  }))
}
