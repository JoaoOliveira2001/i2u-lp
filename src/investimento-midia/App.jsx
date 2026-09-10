import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteSpend,
  fetchCatalogo,
  fetchLonglifeProjectId,
  fetchSpendMonth,
  upsertSpend,
} from './lib/api'
import {
  currentYearMonth,
  DEFAULT_ATUALIZADO_POR,
  draftValue,
  isDirty,
  parseValor,
  QUEM_STORAGE_KEY,
  UNIDADE,
  yearMonthToPeriodo,
} from './lib/config'

function rowStatus(campanha, draftByCampanha, savedByCampanha) {
  if (isDirty(campanha, draftByCampanha, savedByCampanha)) {
    return { label: 'não salvo', kind: 'dirty' }
  }
  if (savedByCampanha[campanha]) {
    return { label: 'lançado', kind: 'saved' }
  }
  return { label: 'sem lançamento', kind: 'empty' }
}

export default function App() {
  const [mes, setMes] = useState(currentYearMonth)
  const [quem, setQuem] = useState('')
  const [projectId, setProjectId] = useState('')
  const [catalogo, setCatalogo] = useState([])
  const [savedByCampanha, setSavedByCampanha] = useState({})
  const [draftByCampanha, setDraftByCampanha] = useState({})
  const [status, setStatus] = useState({ text: 'Carregando campanhas…', kind: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setQuem(localStorage.getItem(QUEM_STORAGE_KEY) || '')
  }, [])

  const periodoMes = useMemo(() => yearMonthToPeriodo(mes), [mes])

  const applySavedRows = useCallback((rows) => {
    const nextSaved = {}
    const nextDraft = {}
    rows.forEach((row) => {
      nextSaved[row.campanha] = row
      nextDraft[row.campanha] = String(row.valor_investimento)
    })
    setSavedByCampanha(nextSaved)
    setDraftByCampanha(nextDraft)
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setStatus({ text: 'Carregando…', kind: '' })
    try {
      const id = projectId || (await fetchLonglifeProjectId())
      if (!projectId) setProjectId(id)

      const [items, rows] = await Promise.all([
        fetchCatalogo(id),
        periodoMes ? fetchSpendMonth(id, periodoMes) : Promise.resolve([]),
      ])
      setCatalogo(items)
      applySavedRows(rows)
      setStatus({
        text: `${items.length} campanhas · ${rows.length} lançamento(s) neste mês · unidade ${UNIDADE}`,
        kind: '',
      })
    } catch (err) {
      setStatus({ text: `Erro ao carregar: ${err.message}`, kind: 'err' })
    } finally {
      setLoading(false)
    }
  }, [applySavedRows, periodoMes, projectId])

  useEffect(() => {
    reload()
  }, [reload])

  const handleDraftChange = (campanha, value) => {
    setDraftByCampanha((prev) => ({ ...prev, [campanha]: value }))
  }

  const handleSave = async () => {
    if (!periodoMes) {
      setStatus({ text: 'Escolha o mês.', kind: 'err' })
      return
    }

    const auditor = quem.trim() || DEFAULT_ATUALIZADO_POR
    localStorage.setItem(QUEM_STORAGE_KEY, auditor)
    setQuem(auditor)

    const dirty = catalogo
      .map((item) => item.campanha)
      .filter((name) => isDirty(name, draftByCampanha, savedByCampanha))

    if (!dirty.length) {
      setStatus({ text: 'Nada para salvar neste mês.', kind: '' })
      return
    }

    setSaving(true)
    setStatus({ text: `Salvando ${dirty.length} campanha(s)…`, kind: '' })

    try {
      const id = projectId || (await fetchLonglifeProjectId())
      if (!projectId) setProjectId(id)

      for (const campanha of dirty) {
        const parsed = parseValor(draftValue(campanha, draftByCampanha, savedByCampanha))
        if (parsed.empty) {
          await deleteSpend({ projectId: id, periodoMes, campanha })
          continue
        }
        if (parsed.invalid) {
          throw new Error(`Valor inválido em “${campanha}”`)
        }
        await upsertSpend({
          projectId: id,
          periodoMes,
          campanha,
          valor: parsed.valor,
          atualizadoPor: auditor,
        })
      }

      const rows = await fetchSpendMonth(id, periodoMes)
      applySavedRows(rows)
      setStatus({
        text: `Salvo. ${rows.length} lançamento(s) neste mês.`,
        kind: 'ok',
      })
    } catch (err) {
      setStatus({ text: `Erro ao salvar: ${err.message}`, kind: 'err' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="midia-app">
      <header className="midia-header">
        <div className="midia-header__inner">
          <h1>Investimento de mídia — Bragança</h1>
          <p>
            Lance o <strong>valor investido</strong> por campanha no{' '}
            <strong>mês de entrada do lead</strong> (coorte). Campanhas vêm do CRM; o
            time não cadastra campanha aqui. Sem valor no mês → CAC e % aquisição
            ficam vazios no dashboard.
          </p>
          <div className="badge-row">
            <span className="badge">v1 · unidade braganca</span>
            <span className="badge">grava no i2u-lucro</span>
          </div>
        </div>
      </header>

      <main className="midia-main">
        <div className="rule">
          <strong>Mês de entrada, não de veiculação.</strong> Lead que entrou em
          janeiro e fechou em agosto entra no CAC de <em>janeiro</em>. Campo
          vazio = sem lançamento (remove o valor). Zero é um lançamento de R$ 0.
        </div>

        <div className="toolbar">
          <label>
            Mês da coorte
            <input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            />
          </label>
          <label>
            Seu nome (auditoria)
            <input
              type="text"
              value={quem}
              onChange={(e) => setQuem(e.target.value)}
              placeholder="ex.: João"
              autoComplete="name"
            />
          </label>
          <div className="actions">
            <button type="button" onClick={handleSave} disabled={saving || loading}>
              Salvar mês
            </button>
            <button
              type="button"
              className="secondary"
              onClick={reload}
              disabled={saving || loading}
            >
              Recarregar
            </button>
          </div>
        </div>

        <p className={`status${status.kind ? ` ${status.kind}` : ''}`}>{status.text}</p>

        {!catalogo.length && !loading ? (
          <p className="empty">
            Nenhuma campanha no catálogo. Rode o refresh a partir do CRM Bragança.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campanha (CRM)</th>
                  <th>Valor investido (R$)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {catalogo.map((item) => {
                  const campanha = item.campanha
                  const draft = draftValue(campanha, draftByCampanha, savedByCampanha)
                  const dirty = isDirty(campanha, draftByCampanha, savedByCampanha)
                  const tag = rowStatus(campanha, draftByCampanha, savedByCampanha)
                  return (
                    <tr key={campanha} className={dirty ? 'dirty' : undefined}>
                      <td>{campanha}</td>
                      <td>
                        <input
                          className="money"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="vazio = NULL"
                          value={draft}
                          onChange={(e) => handleDraftChange(campanha, e.target.value)}
                        />
                      </td>
                      <td>
                        <span className={`tag ${tag.kind}`}>{tag.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="midia-footer">
          Dashboard CAC:{' '}
          <a
            href="https://metabase.integration2u.com/dashboard/4"
            target="_blank"
            rel="noreferrer"
          >
            metabase.integration2u.com/dashboard/4
          </a>{' '}
          · Depois de salvar, o João ainda precisa copiar os valores para o
          Supabase Bragança (<code>sync_spend_i2u_to_braganca.py</code>) para o
          Metabase enxergar.
        </footer>
      </main>
    </div>
  )
}
