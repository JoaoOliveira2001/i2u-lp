import { useState } from 'react'
import { AddProjectForm } from '../components/AddProjectForm'
import { ProjectTable } from '../components/ProjectTable'

const FILTERS = [
  { key: 'ativos', label: 'Ativos' },
  { key: 'ocultos', label: 'Ocultos' },
  { key: 'todos', label: 'Todos' },
]

export function Projects({
  projects,
  activeProjects,
  finalizedProjects,
  onSelectProject,
  onRefresh,
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('ativos')

  const visibleProjects =
    filter === 'ocultos'
      ? finalizedProjects
      : filter === 'todos'
        ? projects
        : activeProjects

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projetos</h1>
          <p className="page-subtitle">
            Gerencie valor combinado, data de pagamento e margem de cada projeto.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Fechar formulário' : '+ Novo projeto'}
        </button>
      </div>

      {showAdd && (
        <section className="panel">
          <AddProjectForm
            onCancel={() => setShowAdd(false)}
            onSaved={() => {
              setShowAdd(false)
              onRefresh?.()
            }}
          />
        </section>
      )}

      <section className="panel">
        <nav className="nav project-filter" aria-label="Filtrar projetos">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`nav__link ${filter === key ? 'is-active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <ProjectTable projects={visibleProjects} onSelect={onSelectProject} />
      </section>
    </>
  )
}
