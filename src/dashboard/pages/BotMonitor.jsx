import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EVENT_LABELS = {
  success: 'Sucesso',
  error: 'Erro',
  exception_redirect: 'Exceção',
  conversation_start: 'Início',
  conversation_end: 'Fim',
  other: 'Outro',
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function EventBadge({ type }) {
  const className =
    type === 'success' || type === 'conversation_end'
      ? 'badge badge--profit'
      : type === 'error' || type === 'exception_redirect'
        ? 'badge badge--loss'
        : 'badge badge--neutral'
  return <span className={className}>{EVENT_LABELS[type] || type}</span>
}

function EventLinks({ event }) {
  const n8nUrl = event.n8n_execution_url
  const blipUrl = event.blip_contact_url
  const contactLabel = event.contact_id || event.conversation_id

  if (!n8nUrl && !blipUrl) {
    return <span className="status-note-cell">—</span>
  }

  return (
    <div className="bot-monitor-links">
      {n8nUrl && (
        <a href={n8nUrl} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
          n8n
        </a>
      )}
      {blipUrl && (
        <a href={blipUrl} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
          Blip{contactLabel ? `: ${contactLabel.split('@')[0]}` : ''}
        </a>
      )}
    </div>
  )
}

async function fetchBotMonitorData(projectSlug = 'gl2', days = 30) {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, slug')
    .eq('slug', projectSlug)
    .maybeSingle()

  if (projectError) throw projectError
  if (!project) throw new Error(`Projeto ${projectSlug} não encontrado.`)

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString()

  const [{ data: monitor }, { data: events }, { data: blocks }] = await Promise.all([
    supabase.from('bot_monitors').select('label, n8n_webhook_url, blip_app_id, active').eq('project_id', project.id).maybeSingle(),
    supabase
      .from('bot_events')
      .select(
        'id, event_type, block_id, block_name, conversation_id, contact_id, error_message, occurred_at, n8n_execution_url, blip_contact_url',
      )
      .eq('project_id', project.id)
      .gte('occurred_at', sinceIso)
      .order('occurred_at', { ascending: false }),
    supabase
      .from('bot_monitor_block_stats')
      .select('*')
      .eq('project_id', project.id)
      .order('total_exception_hits', { ascending: false })
      .limit(12),
  ])

  const rows = events || []
  const successCount = rows.filter((e) => ['success', 'conversation_end'].includes(e.event_type)).length
  const errorCount = rows.filter((e) => e.event_type === 'error').length
  const redirectCount = rows.filter((e) => e.event_type === 'exception_redirect').length
  const startCount = rows.filter((e) => e.event_type === 'conversation_start').length
  const uniqueConversations = new Set(rows.map((e) => e.conversation_id).filter(Boolean)).size
  const totalOutcomes = successCount + errorCount + redirectCount
  const successRate = totalOutcomes > 0 ? Math.round((successCount / totalOutcomes) * 1000) / 10 : null

  return {
    project,
    monitor,
    stats: {
      success_count: successCount,
      error_count: errorCount,
      exception_redirect_count: redirectCount,
      conversation_start_count: startCount,
      unique_conversations: uniqueConversations,
      success_rate_pct: successRate,
      last_event_at: rows[0]?.occurred_at ?? null,
    },
    top_exception_blocks: blocks || [],
    recent_events: rows.slice(0, 40),
  }
}

export function BotMonitor() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchBotMonitorData('gl2', days)
      setData(result)
    } catch (err) {
      setError(err.message || 'Erro ao carregar monitoramento')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const stats = data?.stats

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bot G2L</h1>
          <p className="page-subtitle">
            Monitoramento do bot Blip — conversas finalizadas, erros e blocos que mais caem em exceção.
          </p>
        </div>
        <div className="chip-row">
          {[7, 30, 90].map((option) => (
            <button
              key={option}
              type="button"
              className={`chip ${days === option ? 'is-active' : ''}`}
              onClick={() => setDays(option)}
            >
              {option} dias
            </button>
          ))}
          <button type="button" className="btn btn--ghost btn--sm" onClick={load}>
            Atualizar
          </button>
        </div>
      </div>

      {data?.monitor?.n8n_webhook_url && (
        <section className="panel">
          <h2 className="panel__title">Integração n8n → Supabase</h2>
          <p className="panel__hint">
            Webhook:{' '}
            <a href={data.monitor.n8n_webhook_url} target="_blank" rel="noreferrer" className="link-muted">
              {data.monitor.n8n_webhook_url}
            </a>
          </p>
          {data.monitor.blip_app_id && (
            <p className="panel__hint">Bot Blip (portal): {data.monitor.blip_app_id}</p>
          )}
        </section>
      )}

      {loading && <p className="loading">Carregando monitoramento...</p>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card__label">Sucessos</div>
              <div className="kpi-card__value is-positive">{stats.success_count}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Erros</div>
              <div className={`kpi-card__value ${stats.error_count > 0 ? 'is-negative' : ''}`}>
                {stats.error_count}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Redirecionamentos p/ exceção</div>
              <div className={`kpi-card__value ${stats.exception_redirect_count > 0 ? 'is-negative' : ''}`}>
                {stats.exception_redirect_count}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Taxa de sucesso</div>
              <div className="kpi-card__value">
                {stats.success_rate_pct != null ? `${stats.success_rate_pct}%` : '—'}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Conversas únicas</div>
              <div className="kpi-card__value">{stats.unique_conversations}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Último evento</div>
              <div className="kpi-card__value bot-monitor-kpi-date">
                {formatDateTime(stats.last_event_at)}
              </div>
            </div>
          </div>

          <section className="panel">
            <h2 className="panel__title">Blocos que mais caem em exceção</h2>
            {data.top_exception_blocks.length === 0 ? (
              <p className="loading">Nenhum evento de exceção ainda no período.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bloco</th>
                      <th>ID</th>
                      <th>Exceções</th>
                      <th>Erros</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_exception_blocks.map((row) => (
                      <tr key={`${row.block_id}-${row.block_name}`}>
                        <td>{row.block_label}</td>
                        <td className="status-note-cell">{row.block_id || '—'}</td>
                        <td>{row.redirect_count}</td>
                        <td>{row.error_count}</td>
                        <td>
                          <strong>{row.total_exception_hits}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel">
            <h2 className="panel__title">Eventos recentes</h2>
            {data.recent_events.length === 0 ? (
              <p className="loading">
                Sem eventos nos últimos {days} dias. Configure o n8n para enviar ao endpoint de ingest.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Quando</th>
                      <th>Tipo</th>
                      <th>Bloco</th>
                      <th>Detalhe</th>
                      <th>Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_events.map((event) => (
                      <tr key={event.id} className={event.event_type === 'error' || event.event_type === 'exception_redirect' ? 'row-loss' : ''}>
                        <td>{formatDateTime(event.occurred_at)}</td>
                        <td>
                          <EventBadge type={event.event_type} />
                        </td>
                        <td>{event.block_name || event.block_id || '—'}</td>
                        <td className="status-note-cell">{event.error_message || '—'}</td>
                        <td>
                          <EventLinks event={event} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}
