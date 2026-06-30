import { formatBrl, formatHours } from '../../lib/format'
import { getDeveloperBreakdown, getProjectEntries } from '../hooks/useProfitability'
import { AddTimeEntryForm } from '../components/AddTimeEntryForm'
import { ProjectEditForm } from '../components/ProjectEditForm'
import { LinearIssuesPanel } from '../components/LinearIssuesPanel'
import { FigmaPanel } from '../components/FigmaPanel'
import { StatusNoteForm } from '../components/StatusNoteForm'
import { StatusBadge } from '../components/KpiCards'
import { TimeEntryTable } from '../components/TimeEntryTable'

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

export function ProjectDetail({ project, timeEntries, developers, onBack, onRefresh }) {
  const entries = getProjectEntries(timeEntries, project.project_id)
  const breakdown = getDeveloperBreakdown(entries)

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Voltar
      </button>

      <h1 className="page-title">{project.name}</h1>
      <p className="page-subtitle">
        <StatusBadge status={project.status} marginPct={project.margin_pct} />
        {' · '}
        Pagamento: {formatDate(project.payment_date)}
        {project.status_note && (
          <>
            {' · '}
            <span className="status-inline">{project.status_note}</span>
          </>
        )}
      </p>

      <StatusNoteForm project={project} onSaved={onRefresh} />

      <FigmaPanel project={project} />

      <LinearIssuesPanel project={project} />

      <section className="panel">
        <ProjectEditForm project={project} onSaved={onRefresh} />
      </section>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card__label">Receita</div>
          <div className="kpi-card__value">{formatBrl(project.revenue_brl)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Custo</div>
          <div className="kpi-card__value">{formatBrl(project.labor_cost_brl)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Lucro</div>
          <div
            className={`kpi-card__value ${
              Number(project.margin_brl) >= 0 ? 'is-positive' : 'is-negative'
            }`}
          >
            {formatBrl(project.margin_brl)}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Horas totais</div>
          <div className="kpi-card__value">{formatHours(project.total_hours)}</div>
        </div>
      </div>

      {breakdown.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">Custo por desenvolvedor</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dev</th>
                  <th>Taxa/h</th>
                  <th>Horas</th>
                  <th>Custo</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{formatBrl(row.rate)}</td>
                    <td>{formatHours(row.hours)}</td>
                    <td>{formatBrl(row.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel">
        <AddTimeEntryForm
          projectId={project.project_id}
          developers={developers}
          onSaved={onRefresh}
        />
      </section>

      <section className="panel">
        <h2 className="panel__title">Registro de horas</h2>
        <TimeEntryTable entries={entries} />
      </section>
    </>
  )
}
