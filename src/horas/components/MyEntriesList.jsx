import { useState } from 'react'
import { formatHours } from '../../lib/format'
import { EditTimeEntryForm } from './EditTimeEntryForm'

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

export function MyEntriesList({ entries, projects, onSaved }) {
  const [editingId, setEditingId] = useState(null)

  if (!entries.length) {
    return (
      <section className="panel">
        <h2 className="panel__title">Seus registros recentes</h2>
        <p className="loading">Nenhuma hora registrada nas últimas 3 semanas.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Seus registros recentes</h2>
      <ul className="entry-list">
        {entries.map((entry) => (
          <li key={entry.id} className="entry-item">
            {editingId === entry.id ? (
              <EditTimeEntryForm
                entry={entry}
                projects={projects}
                onSaved={() => {
                  setEditingId(null)
                  onSaved?.()
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="entry-item__top">
                  <span className="entry-item__project">{entry.projects?.name || '—'}</span>
                  <div className="entry-item__actions">
                    <span className="entry-item__hours">{formatHours(entry.hours_decimal)}</span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setEditingId(entry.id)}
                    >
                      Editar
                    </button>
                  </div>
                </div>
                <div className="entry-item__meta">{formatDate(entry.work_date)}</div>
                {entry.task_description && (
                  <p className="entry-item__task">{entry.task_description}</p>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
