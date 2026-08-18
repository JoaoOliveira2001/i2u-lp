import { useState } from 'react'
import { formatHours } from '../../lib/format'

export function ClientPortalBanner({ project }) {
  const [copied, setCopied] = useState(false)

  if (!project?.client_portal_enabled || !project?.client_portal_slug) return null

  const path = `/cliente/${project.client_portal_slug}`
  const fullUrl = `${window.location.origin}${path}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="panel client-portal-banner">
      <div className="client-portal-banner__row">
        <div>
          <h2 className="panel__title">Portal do cliente</h2>
          <p className="panel__hint">
            Link público para o cliente acompanhar tasks e horas.
            {project.included_hours_monthly != null && (
              <>
                {' '}
                Franquia: {formatHours(Number(project.included_hours_monthly))}/mês.
              </>
            )}
          </p>
          <code className="client-portal-banner__url">{fullUrl}</code>
        </div>
        <div className="client-portal-banner__actions">
          <button type="button" className="btn btn--ghost" onClick={handleCopy}>
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
          <a href={path} target="_blank" rel="noreferrer" className="btn btn--primary btn--sm">
            Abrir portal
          </a>
        </div>
      </div>
    </section>
  )
}
