export function FigmaPanel({ project }) {
  const url = project?.figma_url?.trim()

  return (
    <section className="panel">
      <div className="panel__header-row">
        <h2 className="panel__title">Figma</h2>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
            Abrir no Figma
          </a>
        )}
      </div>

      {url ? (
        <p className="panel__hint">
          <a href={url} target="_blank" rel="noreferrer" className="link-muted">
            {url}
          </a>
        </p>
      ) : (
        <p className="loading">Nenhum link do Figma cadastrado. Adicione em Editar projeto.</p>
      )}
    </section>
  )
}
