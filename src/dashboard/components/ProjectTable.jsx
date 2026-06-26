import { formatBrl, formatHours } from '../../lib/format'
import { ConsumptionBar, StatusBadge } from './KpiCards'

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function truncate(text, max = 48) {
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function ProjectTable({ projects, onSelect }) {
  const sorted = [...projects].sort((a, b) => {
    const marginA = a.margin_brl == null ? -Infinity : Number(a.margin_brl)
    const marginB = b.margin_brl == null ? -Infinity : Number(b.margin_brl)
    return marginB - marginA
  })

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Projeto</th>
            <th>Valor</th>
            <th>Pagamento</th>
            <th>Custo</th>
            <th>Lucro</th>
            <th>Horas</th>
            <th>Margem</th>
            <th>Lead</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((project) => (
            <tr
              key={project.project_id}
              className="is-clickable"
              onClick={() => onSelect?.(project)}
            >
              <td>{project.name}</td>
              <td>{formatBrl(project.revenue_brl)}</td>
              <td>{formatDate(project.payment_date)}</td>
              <td>{formatBrl(project.labor_cost_brl)}</td>
              <td>{formatBrl(project.margin_brl)}</td>
              <td>{formatHours(project.total_hours)}</td>
              <td>
                <StatusBadge status={project.status} marginPct={project.margin_pct} />
              </td>
              <td>{project.lead_developer_name || '—'}</td>
              <td className="status-note-cell">
                {project.linear_project_id && (
                  <span className="badge badge--neutral" title="Vinculado ao Linear">
                    Linear
                  </span>
                )}{' '}
                {truncate(project.status_note)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ProjectGrid({ projects, onSelect }) {
  return (
    <div className="project-grid">
      {projects.map((project) => (
        <article
          key={project.project_id}
          className="project-card"
          onClick={() => onSelect?.(project)}
        >
          <div className="project-card__name">{project.name}</div>
          <div className="project-card__row">
            <span>Receita</span>
            <strong>{formatBrl(project.revenue_brl)}</strong>
          </div>
          <div className="project-card__row">
            <span>Custo horas</span>
            <strong>{formatBrl(project.labor_cost_brl)}</strong>
          </div>
          <div className="project-card__row">
            <span>Lucro</span>
            <strong>{formatBrl(project.margin_brl)}</strong>
          </div>
          <div className="project-card__row">
            <span>Horas</span>
            <strong>{formatHours(project.total_hours)}</strong>
          </div>
          <div style={{ marginTop: '0.6rem' }}>
            <StatusBadge status={project.status} marginPct={project.margin_pct} />
          </div>
          {project.status_note && (
            <div className="project-card__status-note">{truncate(project.status_note, 80)}</div>
          )}
          <div style={{ marginTop: '0.75rem' }}>
            <ConsumptionBar
              revenue={Number(project.revenue_brl) || 0}
              cost={Number(project.labor_cost_brl) || 0}
            />
          </div>
        </article>
      ))}
    </div>
  )
}
