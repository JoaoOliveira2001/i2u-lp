import { useEffect, useState } from 'react'
import { fetchSharedCredentials } from '../../lib/mutations'
import { CredentialField } from '../components/CredentialField'

export function Passwords() {
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const rows = await fetchSharedCredentials()
        if (!cancelled) setCredentials(rows)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Erro ao carregar senhas')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Senhas</h1>
          <p className="page-subtitle">
            Credenciais compartilhadas de integrações e ferramentas internas da Integration2U.
          </p>
        </div>
      </div>

      {loading && <p className="loading">Carregando credenciais...</p>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && !error && credentials.length === 0 && (
        <section className="panel">
          <p className="loading">
            Nenhuma credencial cadastrada. Execute a migration{' '}
            <code>010_shared_credentials.sql</code> no Supabase.
          </p>
        </section>
      )}

      {credentials.map((item) => (
        <section className="panel credential-card" key={item.id}>
          <div className="panel__header-row">
            <div>
              <h2 className="panel__title">{item.label}</h2>
              {item.service && <span className="credential-card__service">{item.service}</span>}
            </div>
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
                Abrir
              </a>
            )}
          </div>

          {item.notes && <p className="panel__hint">{item.notes}</p>}

          <div className="credential-card__fields">
            <CredentialField label="E-mail" value={item.email} />
            <CredentialField label="Usuário" value={item.username} />
            <CredentialField label="Senha" value={item.password} secret />
          </div>
        </section>
      ))}
    </>
  )
}
