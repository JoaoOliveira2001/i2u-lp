import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DURACOES,
  MOTIVOS,
  fetchFila,
  metabaseReportUrl,
  motivoLabel,
  pausarVendedor,
  retomarVendedor,
} from './lib/fila'

const QUEM_KEY = 'll_fila_quem'
const REFRESH_MS = 30000

const UNIT_META = {
  braganca: { label: 'Bragança', funnel: 'funil 6777' },
  jundiai: { label: 'Jundiaí', funnel: 'funil 7175' },
}

function relative(iso) {
  if (!iso) return 'nunca'
  const min = Math.floor((Date.now() - Date.parse(iso)) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h${min % 60 ? ` ${min % 60}min` : ''}`
  return `há ${Math.floor(h / 24)}d`
}

function minutesLeft(iso) {
  if (!iso) return 0
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 60000))
}

function statusOf(row) {
  if (!row.ativo) return { key: 'inativo', label: 'Inativo' }
  if (row.em_pausa) return { key: 'pausa', label: `${motivoLabel(row.pausa_motivo)} ${minutesLeft(row.pausado_ate)}min` }
  return { key: 'ativo', label: 'Ativo' }
}

function Pill({ status }) {
  return (
    <span className={`pill pill--${status.key}`}>
      <span className="pill__dot" aria-hidden="true" />
      {status.label}
    </span>
  )
}

function UnitSection({ unidade, rows, proximo, quem, onDone }) {
  const [motivo, setMotivo] = useState('almoco')
  const [duracao, setDuracao] = useState(60)
  const [busy, setBusy] = useState(null)

  const meta = UNIT_META[unidade] || { label: unidade, funnel: '' }
  const ativos = rows.filter((r) => r.ativo)
  const emPausa = ativos.filter((r) => r.em_pausa)
  const disponiveis = ativos.filter((r) => !r.em_pausa)
  const inativos = rows.length - ativos.length
  const totalLeads = rows.reduce((a, r) => a + Number(r.leads_recebidos || 0), 0)
  const maxLeads = Math.max(1, ...rows.map((r) => Number(r.leads_recebidos || 0)))

  async function acao(uid, fn) {
    setBusy(uid)
    try {
      await fn()
      await onDone()
    } catch (e) {
      window.alert(e.message || 'Falha na ação')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="unit" aria-labelledby={`unit-${unidade}`}>
      <header className="unit__head">
        <div className="unit__title">
          <h2 id={`unit-${unidade}`}>{meta.label}</h2>
          <span className="unit__funnel">{meta.funnel}</span>
        </div>
        <dl className="stats">
          <div className="stat">
            <dt>Disponíveis</dt>
            <dd>{disponiveis.length}</dd>
          </div>
          <div className="stat stat--pausa">
            <dt>Em pausa</dt>
            <dd>{emPausa.length}</dd>
          </div>
          <div className="stat">
            <dt>Inativos</dt>
            <dd>{inativos}</dd>
          </div>
          <div className="stat">
            <dt>Próximo</dt>
            <dd className="stat__name">{proximo?.nome || '—'}</dd>
          </div>
          <div className="stat">
            <dt>Leads da fila</dt>
            <dd>{totalLeads}</dd>
          </div>
        </dl>
      </header>

      <table className="fila">
        <colgroup>
          <col className="c-name" />
          <col className="c-status" />
          <col className="c-ordem" />
          <col className="c-leads" />
          <col className="c-ultimo" />
          <col className="c-janela" />
          <col className="c-acao" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Vendedor</th>
            <th scope="col">Status</th>
            <th scope="col" className="num">Ordem</th>
            <th scope="col">Leads na fila</th>
            <th scope="col">Último lead</th>
            <th scope="col">Janela de atendimento</th>
            <th scope="col">Ação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = statusOf(r)
            const leads = Number(r.leads_recebidos || 0)
            const uid = r.id_usuario_crm
            return (
              <tr key={uid} className={status.key === 'pausa' ? 'is-pausa' : ''}>
                <td className="cell-name">
                  {r.nome}
                  {r.foi_o_ultimo && <span className="tag">último</span>}
                </td>
                <td><Pill status={status} /></td>
                <td className="num mono">{r.ordem}</td>
                <td>
                  <div className="bar">
                    <span className="bar__fill" style={{ width: `${(leads / maxLeads) * 100}%` }} />
                    <span className="bar__val mono">{leads}</span>
                  </div>
                </td>
                <td className="mono muted">{relative(r.ultimo_lead_at)}</td>
                <td className="muted">{r.janela}</td>
                <td>
                  {status.key === 'inativo' ? (
                    <span className="muted">—</span>
                  ) : status.key === 'pausa' ? (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busy === uid}
                      onClick={() => acao(uid, () => retomarVendedor({ unidade, idUsuarioCrm: uid }))}
                    >
                      {busy === uid ? '...' : 'Retomar'}
                    </button>
                  ) : (
                    <div className="acao">
                      <label className="sr-only" htmlFor={`m-${uid}`}>Motivo</label>
                      <select id={`m-${uid}`} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                        {MOTIVOS.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                      <label className="sr-only" htmlFor={`d-${uid}`}>Duração</label>
                      <select id={`d-${uid}`} value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}>
                        {DURACOES.map((d) => (
                          <option key={d} value={d}>{d}min</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn"
                        disabled={busy === uid}
                        onClick={() =>
                          acao(uid, () =>
                            pausarVendedor({ unidade, idUsuarioCrm: uid, minutos: duracao, motivo, por: quem }),
                          )
                        }
                      >
                        {busy === uid ? '...' : 'Pausar'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export function App() {
  const [status, setStatus] = useState([])
  const [proximo, setProximo] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [quem, setQuem] = useState(() => localStorage.getItem(QUEM_KEY) || '')
  const timer = useRef(null)

  const load = useCallback(async () => {
    try {
      const { status: s, proximo: p } = await fetchFila()
      setStatus(s)
      setProximo(p)
      setUpdatedAt(new Date())
      setError('')
    } catch (e) {
      setError(e.message || 'Falha ao carregar a fila')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    timer.current = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer.current)
  }, [load])

  useEffect(() => {
    localStorage.setItem(QUEM_KEY, quem)
  }, [quem])

  const byUnit = useMemo(() => {
    const map = { braganca: [], jundiai: [] }
    for (const row of status) {
      if (!map[row.unidade]) map[row.unidade] = []
      map[row.unidade].push(row)
    }
    const proxMap = Object.fromEntries(proximo.map((p) => [p.unidade, p]))
    return Object.entries(map).map(([unidade, rows]) => ({ unidade, rows, prox: proxMap[unidade] }))
  }, [status, proximo])

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand__dot" aria-hidden="true" />
          <div>
            <p className="brand__kicker">Long Life</p>
            <p className="brand__title">Filas de atendimento</p>
          </div>
        </div>
        <div className="topbar__right">
          <label className="quem" htmlFor="quem">
            <span>Você é</span>
            <input
              id="quem"
              value={quem}
              onChange={(e) => setQuem(e.target.value)}
              placeholder="seu nome (opcional)"
              autoComplete="off"
            />
          </label>
          <button type="button" className="btn btn--ghost" onClick={load}>
            Atualizar
          </button>
          <span className="updated" aria-live="polite">
            {updatedAt ? `atualizado ${relative(updatedAt.toISOString())}` : ''}
          </span>
        </div>
      </header>

      {error && <div className="error" role="alert">{error}</div>}
      {loading ? (
        <div className="loading">Carregando filas…</div>
      ) : (
        <main className="units">
          {byUnit.map((u) => (
            <UnitSection
              key={u.unidade}
              unidade={u.unidade}
              rows={u.rows}
              proximo={u.prox}
              quem={quem}
              onDone={load}
            />
          ))}
        </main>
      )}

      <section className="report" aria-labelledby="report-title">
        <header className="report__head">
          <h2 id="report-title">Relatório</h2>
          <span className="report__hint">Metabase · atualiza sozinho</span>
        </header>
        <div className="report__grid">
          {['braganca', 'jundiai'].map((u) => (
            <article className="embed" key={u}>
              <div className="embed__head">
                <span className="embed__unit">{UNIT_META[u]?.label || u}</span>
                <a
                  className="embed__open"
                  href={metabaseReportUrl(u)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir ↗
                </a>
              </div>
              <iframe
                className="embed__frame"
                title={`Relatório comercial ${UNIT_META[u]?.label || u}`}
                src={metabaseReportUrl(u)}
                loading="lazy"
              />
            </article>
          ))}
        </div>
      </section>

      <footer className="foot">
        Atualiza a cada 30s · fuso America/Sao_Paulo · pausa some sozinha ao fim do tempo
      </footer>
    </div>
  )
}
