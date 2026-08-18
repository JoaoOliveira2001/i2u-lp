import { formatHours } from '../../lib/format'

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

export function HoursLog({ entries, monthLabel }) {
  return (
    <>
      <div className="cliente-panel__header">
        <h2>Horas registradas</h2>
        <span className="cliente-panel__hint">{monthLabel}</span>
      </div>

      {entries.length === 0 ? (
        <p className="cliente-hint">Nenhuma hora registrada neste mês.</p>
      ) : (
        <div className="cliente-table-wrap">
          <table className="cliente-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Horas</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`${entry.workDate}-${entry.hours}-${entry.description || ''}`}>
                  <td>{formatDate(entry.workDate)}</td>
                  <td>{formatHours(entry.hours)}</td>
                  <td>{entry.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
