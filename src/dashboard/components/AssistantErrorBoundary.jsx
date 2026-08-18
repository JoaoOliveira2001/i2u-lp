import { Component } from 'react'

export class AssistantErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <>
          <button
            type="button"
            className="assistant-backdrop"
            onClick={this.props.onClose}
            aria-label="Fechar"
          />
          <aside className="assistant-panel" role="dialog" aria-label="Assistente i2u">
            <header className="assistant-panel__header">
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)' }}>Assistente</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Não foi possível abrir o assistente.
                </p>
              </div>
              <button type="button" className="btn btn--ghost" onClick={this.props.onClose}>
                Fechar
              </button>
            </header>
            <div className="assistant-panel__messages">
              <div className="error-banner">
                {this.state.error.message ||
                  'Erro inesperado. Verifique se OPENAI_API_KEY está configurada no servidor.'}
              </div>
            </div>
          </aside>
        </>
      )
    }

    return this.props.children
  }
}
