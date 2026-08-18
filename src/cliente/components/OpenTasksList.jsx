const COLUMN_ORDER = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Blocked']

const COLUMN_LABELS = {
  Backlog: 'Backlog',
  Todo: 'A fazer',
  'In Progress': 'Em progresso',
  'In Review': 'Em revisão',
  Blocked: 'Bloqueado',
}

function priorityClass(label) {
  if (label === 'Urgente') return 'is-urgent'
  if (label === 'Alta') return 'is-high'
  return ''
}

function buildColumns(tasks) {
  const grouped = new Map()

  for (const task of tasks) {
    const key = task.stateName || 'Sem status'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(task)
  }

  const known = COLUMN_ORDER.filter((name) => grouped.has(name)).map((name) => ({
    id: name,
    label: COLUMN_LABELS[name] || name,
    tasks: grouped.get(name),
  }))

  const extras = [...grouped.keys()]
    .filter((name) => !COLUMN_ORDER.includes(name))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((name) => ({
      id: name,
      label: COLUMN_LABELS[name] || name,
      tasks: grouped.get(name),
    }))

  return [...known, ...extras]
}

function TaskCard({ task }) {
  return (
    <article className="kanban-card">
      <div className="kanban-card__top">
        <span className="kanban-card__id">{task.identifier || '—'}</span>
        {task.url && (
          <a
            href={task.url}
            target="_blank"
            rel="noreferrer"
            className="kanban-card__link"
            aria-label="Abrir no Linear"
          >
            ↗
          </a>
        )}
      </div>
      <strong className="kanban-card__title">{task.title}</strong>
      <div className="kanban-card__meta">
        {task.priorityLabel && (
          <span className={`cliente-pill ${priorityClass(task.priorityLabel)}`}>
            {task.priorityLabel}
          </span>
        )}
        {task.assigneeName && <span>{task.assigneeName}</span>}
      </div>
    </article>
  )
}

export function OpenTasksList({ tasks, linear }) {
  const linearLinked = linear?.linked
  const columns = buildColumns(tasks)

  return (
    <>
      <div className="cliente-panel__header">
        <div>
          <h2>Board — tasks abertas</h2>
          <p className="cliente-panel__hint">
            Visão Kanban sincronizada com o Linear
          </p>
        </div>
        <div className="cliente-panel__actions">
          <span className="cliente-badge">{tasks.length}</span>
          {linear?.url && (
            <a href={linear.url} target="_blank" rel="noreferrer" className="btn-cliente btn-cliente--ghost">
              Abrir no Linear
            </a>
          )}
        </div>
      </div>

      {!linearLinked && (
        <p className="cliente-hint">
          O board Linear ainda não está vinculado. Assim que a integração for concluída, as tasks
          aparecerão aqui automaticamente.
        </p>
      )}

      {linearLinked && tasks.length === 0 && (
        <p className="cliente-hint">Nenhuma task aberta no momento — tudo concluído ou em fila fechada.</p>
      )}

      {tasks.length > 0 && (
        <div className="kanban-board">
          {columns.map((column) => (
            <section key={column.id} className="kanban-column">
              <header className="kanban-column__header">
                <h3>{column.label}</h3>
                <span className="kanban-column__count">{column.tasks.length}</span>
              </header>
              <div className="kanban-column__cards">
                {column.tasks.map((task) => (
                  <TaskCard key={`${task.identifier}-${task.title}`} task={task} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
