import { useEffect, useState } from 'react'
import { HoursSummary } from './components/HoursSummary'
import { HoursProgress } from './components/HoursProgress'
import { ProjectOverview } from './components/ProjectOverview'
import { OpenTasksList } from './components/OpenTasksList'
import { HoursLog } from './components/HoursLog'

function getPortalSlug() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts[0] === 'cliente' && parts[1]) return parts[1].toLowerCase()
  return ''
}

export function App() {
  const slug = getPortalSlug()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!slug) {
        setError('Link inválido — use /cliente/nome-do-projeto')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/client-portal/${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        })
        const json = await response.json()
        if (!response.ok) {
          throw new Error(json.error || 'Não foi possível carregar o portal')
        }
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erro ao carregar')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="cliente-page">
        <div className="cliente-shell">
          <div className="cliente-loading-wrap">
            <span className="brand__dot brand__dot--pulse" />
            <p className="cliente-loading">Carregando portal...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cliente-page">
        <div className="cliente-shell">
          <div className="cliente-error">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="cliente-page">
      <div className="cliente-shell">
        <header className="cliente-header">
          <div className="cliente-header__row">
            <div className="cliente-brand">
              <span className="brand__dot" />
              <div>
                <p className="cliente-kicker">Integration2U</p>
                <h1>{data.projectName}</h1>
                <p className="cliente-subtitle">Portal do cliente · {data.monthLabel}</p>
              </div>
            </div>
            {slug === 'longlife' && (
              <a
                href="/docs-longlife.html"
                target="_blank"
                rel="noreferrer"
                className="btn-cliente btn-cliente--ghost btn-cliente--docs"
              >
                Documentação Long Life ↗
              </a>
            )}
          </div>
        </header>

        <ProjectOverview
          linear={data.linear}
          openTasksCount={data.openTasksCount}
          taskSummary={data.taskSummary}
        />

        <HoursSummary hours={data.hours} monthLabel={data.monthLabel} />

        <HoursProgress hours={data.hours} monthLabel={data.monthLabel} />

        <section className="cliente-panel">
          <OpenTasksList tasks={data.openTasks} linear={data.linear} />
        </section>

        <section className="cliente-panel">
          <HoursLog entries={data.entriesThisMonth} monthLabel={data.monthLabel} />
        </section>

        <footer className="cliente-footer">
          Atualizado ao abrir · fuso America/Sao_Paulo
          {data.linear?.syncedAt && (
            <>
              {' '}
              · Linear{' '}
              {data.linear.syncLive ? 'sincronizado agora' : 'em cache'} (
              {new Date(data.linear.syncedAt).toLocaleString('pt-BR')})
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
