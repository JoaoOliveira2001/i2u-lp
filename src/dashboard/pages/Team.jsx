import { useState } from 'react'
import { AddCollaboratorForm, CollaboratorTable } from '../components/CollaboratorForms'

export function Team({ developers, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipe</h1>
          <p className="page-subtitle">
            Colaboradores por hora ou custo fixo mensal — usados no cálculo de lucratividade.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Fechar formulário' : '+ Novo colaborador'}
        </button>
      </div>

      {showAdd && (
        <section className="panel">
          <AddCollaboratorForm
            onCancel={() => setShowAdd(false)}
            onSaved={() => {
              setShowAdd(false)
              onRefresh?.()
            }}
          />
        </section>
      )}

      <section className="panel">
        <CollaboratorTable developers={developers} onSaved={onRefresh} />
      </section>
    </>
  )
}
