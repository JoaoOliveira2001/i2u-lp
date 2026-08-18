import { useMemo, useState } from 'react'
import { formatBrl, formatHours } from '../../lib/format'
import { HoursEvolutionChart } from '../components/HoursEvolutionChart'
import { MonthlyPayrollPanel } from '../components/MonthlyPayrollPanel'

const LIMIT = 80

function sortByLatest(entries) {
  return [...entries].sort((a, b) => {
    const createdDiff = new Date(b.created_at) - new Date(a.created_at)
    if (createdDiff !== 0) return createdDiff
    return new Date(b.work_date) - new Date(a.work_date)
  })
}

export function RecentHours({ timeEntries, developers, onSelectProject }) {
  const [developerId, setDeveloperId] = useState('all')

  const activeDevs = useMemo(
    () => developers.filter((d) => d.active !== false && d.cost_model !== 'fixed_monthly'),
    [developers],
  )

  const filtered = useMemo(() => {
    const sorted = sortByLatest(timeEntries)
    if (developerId === 'all') return sorted.slice(0, LIMIT)
    return sorted.filter((e) => e.developer_id === developerId).slice(0, LIMIT)
  }, [timeEntries, developerId])

  const summary = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recent = timeEntries.filter((e) => new Date(e.created_at) >= sevenDaysAgo)
    const hours = recent.reduce((sum, e) => sum + (Number(e.hours_decimal) || 0), 0)
    return { count: recent.length, hours }
  }, [timeEntries])

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Horas recentes</h1>
          <p className="page-subtitle">
            Últimos lançamentos da equipe — {summary.count} registros nos últimos 7 dias (
            {formatHours(summary.hours)}).
          </p>
        </div>
        <label className="hours-filter">
          <span>Colaborador</span>
          <select value={developerId} onChange={(e) => setDeveloperId(e.target.value)}>
            <option value="all">Todos</option>
            {activeDevs.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <MonthlyPayrollPanel timeEntries={timeEntries} developers={developers} />

      <section className="panel">
        <h2 className="panel__title">Evolução de horas por colaborador</h2>
        <p className="panel__hint">Total de horas lançadas por mês — uma linha por funcionário.</p>
        <HoursEvolutionChart timeEntries={timeEntries} developers={developers} />
      </section>

      <section className="panel">
        {!filtered.length ? (
          <p className="loading">Nenhuma hora registrada ainda.</p>
        ) : (
          <>
            <p className="panel__hint">
              Mostrando até {LIMIT} lançamentos, do mais recente ao mais antigo.
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Registrado</th>
                    <th>Data trabalho</th>
                    <th>Colaborador</th>
                    <th>Projeto</th>
                    <th>Horas</th>
                    <th>Custo</th>
                    <th>Atividade</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const rate = Number(entry.developers?.hourly_rate_brl) || 0
                    const hours = Number(entry.hours_decimal) || 0
                    const projectName = entry.projects?.name || '—'
                    const projectId = entry.project_id

                    return (
                      <tr key={entry.id}>
                        <td>
                          {new Date(entry.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td>{new Date(entry.work_date).toLocaleDateString('pt-BR')}</td>
                        <td>{entry.developers?.name || '—'}</td>
                        <td>
                          {projectId && onSelectProject ? (
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() =>
                                onSelectProject({
                                  project_id: projectId,
                                  name: projectName,
                                  slug: entry.projects?.slug,
                                })
                              }
                            >
                              {projectName}
                            </button>
                          ) : (
                            projectName
                          )}
                        </td>
                        <td>{formatHours(hours)}</td>
                        <td>{formatBrl(hours * rate)}</td>
                        <td>{entry.task_description || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  )
}
