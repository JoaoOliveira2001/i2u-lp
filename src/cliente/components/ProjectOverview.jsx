export function ProjectOverview({ linear, openTasksCount, taskSummary }) {
  return (
    <section className="cliente-panel cliente-overview">
      <div className="cliente-panel__header">
        <h2>Visão do projeto</h2>
      </div>
      <div className="cliente-overview__grid">
        <div className="cliente-overview__item">
          <span className="cliente-overview__label">Tasks abertas</span>
          <strong>{openTasksCount}</strong>
          {taskSummary?.length > 0 && (
            <span className="cliente-overview__meta">
              {taskSummary.map((s) => `${s.count} ${s.stateName}`).join(' · ')}
            </span>
          )}
        </div>
        <div className="cliente-overview__item">
          <span className="cliente-overview__label">Linear</span>
          {linear?.linked ? (
            <>
              <strong className="is-positive">Conectado</strong>
              {linear.url && (
                <a href={linear.url} target="_blank" rel="noreferrer" className="cliente-link">
                  Abrir board ↗
                </a>
              )}
            </>
          ) : (
            <strong className="cliente-overview__meta">Sincronização pendente</strong>
          )}
        </div>
      </div>
    </section>
  )
}
