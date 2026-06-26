import { formatBrl } from '../../lib/format'
import { getAttentionProjects } from '../../lib/projectAlerts'
import { StatusBadge } from './KpiCards'

function truncate(text, max = 60) {
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function AttentionPanel({ projects, onSelectProject }) {
  const items = getAttentionProjects(projects)

  if (!items.length) {
    return (
      <section className="panel">
        <h2 className="panel__title">Precisa de atenção</h2>
        <p className="loading">Nenhum projeto crítico no momento.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Precisa de atenção</h2>
      <p className="panel__hint">
        Projetos com margem baixa, sem valor/pagamento ou com status operacional registrado.
      </p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Projeto</th>
              <th>Valor</th>
              <th>Margem</th>
              <th>Status operacional</th>
              <th>Motivos</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ project, reasons }) => (
              <tr
                key={project.project_id}
                className="is-clickable"
                onClick={() => onSelectProject?.(project)}
              >
                <td>{project.name}</td>
                <td>{formatBrl(project.revenue_brl)}</td>
                <td>
                  <StatusBadge status={project.status} marginPct={project.margin_pct} />
                </td>
                <td>{truncate(project.status_note)}</td>
                <td>
                  <ul className="attention-reasons">
                    {reasons.slice(0, 3).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
