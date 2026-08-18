import { AssistantErrorBoundary } from './AssistantErrorBoundary'
import { AssistantFab } from './AssistantFab'
import { AssistantPanel } from './AssistantPanel'

export function AppShell({
  page,
  onNavigate,
  children,
  assistantOpen,
  onAssistantOpen,
  onAssistantClose,
  onDataChanged,
}) {
  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__header-inner">
          <div className="brand">
            <span className="brand__dot" />
            <span>Integration2U · Lucratividade</span>
          </div>
          <nav className="nav">
            <button
              type="button"
              className={`nav__link ${page === 'overview' ? 'is-active' : ''}`}
              onClick={() => onNavigate('overview')}
            >
              Visão Geral
            </button>
            <button
              type="button"
              className={`nav__link ${page === 'projects' ? 'is-active' : ''}`}
              onClick={() => onNavigate('projects')}
            >
              Projetos
            </button>
            <button
              type="button"
              className={`nav__link ${page === 'monthly' ? 'is-active' : ''}`}
              onClick={() => onNavigate('monthly')}
            >
              Lucro Mensal
            </button>
            <button
              type="button"
              className={`nav__link ${page === 'hours' ? 'is-active' : ''}`}
              onClick={() => onNavigate('hours')}
            >
              Horas
            </button>
            <button
              type="button"
              className={`nav__link ${page === 'team' ? 'is-active' : ''}`}
              onClick={() => onNavigate('team')}
            >
              Equipe
            </button>
            <button
              type="button"
              className={`nav__link ${page === 'bot-g2l' ? 'is-active' : ''}`}
              onClick={() => onNavigate('bot-g2l')}
            >
              Bot G2L
            </button>
            <button
              type="button"
              className={`nav__link ${page === 'passwords' ? 'is-active' : ''}`}
              onClick={() => onNavigate('passwords')}
            >
              Senhas
            </button>
          </nav>
        </div>
      </header>

      <main className="shell__main">{children}</main>

      <AssistantFab onClick={() => onAssistantOpen(true)} />
      {assistantOpen && (
        <AssistantErrorBoundary onClose={onAssistantClose}>
          <AssistantPanel
            open
            onClose={onAssistantClose}
            onDataChanged={onDataChanged}
          />
        </AssistantErrorBoundary>
      )}
    </div>
  )
}
