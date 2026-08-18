import { useEffect, useState } from 'react'
import { fetchLinearIssues } from '../../lib/mutations'

const FILTERS = [
  { id: 'open', label: 'Abertas' },
  { id: 'all', label: 'Todas' },
  { id: 'done', label: 'Concluídas' },
]

function priorityLabel(value) {
  if (value == null) return null
  const map = { 1: 'Urgente', 2: 'Alta', 3: 'Normal', 4: 'Baixa' }
  return map[value] || null
}

export function LinearIssuesPanel({ project }) {
  const [filter, setFilter] = useState('open')
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!project?.project_id || !project?.linear_project_id) {
        setIssues([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const rows = await fetchLinearIssues(project.project_id, filter)
        if (!cancelled) setIssues(rows)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erro ao carregar tasks')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [project?.project_id, project?.linear_project_id, filter])

  if (!project?.linear_project_id) {
    return (
      <section className="panel">
        <h2 className="panel__title">Tasks Linear</h2>
        <p className="loading">Projeto ainda não vinculado ao Linear.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel__header-row">
        <div>
          <h2 className="panel__title">Tasks Linear</h2>
          {project.lead_developer_name && (
            <p className="panel__hint">Responsável: {project.lead_developer_name}</p>
          )}
        </div>
        {project.linear_url && (
          <a
            href={project.linear_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn--ghost btn--sm"
          >
            Abrir no Linear
          </a>
        )}
      </div>

      <div className="chip-row" style={{ marginBottom: '0.85rem' }}>
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${filter === item.id ? 'is-active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="loading">Carregando tasks...</p>}

      {!loading && !issues.length && (
        <p className="loading">Nenhuma task neste filtro.</p>
      )}

      {!loading && issues.length > 0 && (
        <ul className="linear-issue-list">
          {issues.map((issue) => (
            <li key={issue.id} className="linear-issue-item">
              <div className="linear-issue-item__top">
                <div>
                  <span className="linear-issue-item__id">{issue.identifier || '—'}</span>
                  <strong>{issue.title}</strong>
                </div>
                {issue.url && (
                  <a href={issue.url} target="_blank" rel="noreferrer" className="linear-issue-item__link">
                    ↗
                  </a>
                )}
              </div>
              <div className="linear-issue-item__meta">
                <span className="badge badge--neutral">{issue.state_name || '—'}</span>
                {issue.assignee_name && <span>{issue.assignee_name}</span>}
                {priorityLabel(issue.priority) && (
                  <span>{priorityLabel(issue.priority)}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
