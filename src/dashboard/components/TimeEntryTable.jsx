import { formatBrl, formatHours } from '../../lib/format'

export function TimeEntryTable({ entries }) {
  if (!entries.length) {
    return <p className="loading">Nenhuma hora registrada neste projeto.</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Dev</th>
            <th>Horas</th>
            <th>Custo</th>
            <th>Atividade</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const rate = Number(entry.developers?.hourly_rate_brl) || 0
            const hours = Number(entry.hours_decimal) || 0
            return (
              <tr key={entry.id}>
                <td>{new Date(entry.work_date).toLocaleDateString('pt-BR')}</td>
                <td>{entry.developers?.name}</td>
                <td>{formatHours(hours)}</td>
                <td>{formatBrl(hours * rate)}</td>
                <td>{entry.task_description || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
