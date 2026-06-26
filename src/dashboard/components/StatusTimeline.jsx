function formatWhen(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function StatusTimeline({ entries }) {
  if (!entries?.length) {
    return <p className="loading">Nenhum status registrado ainda.</p>
  }

  return (
    <ul className="status-timeline">
      {entries.map((entry) => (
        <li key={entry.id} className="status-timeline__item">
          <div className="status-timeline__meta">
            <span>{formatWhen(entry.created_at)}</span>
            <span className="badge badge--neutral">
              {entry.source === 'assistant' ? 'IA' : 'Manual'}
            </span>
          </div>
          <p className="status-timeline__note">{entry.note}</p>
        </li>
      ))}
    </ul>
  )
}
