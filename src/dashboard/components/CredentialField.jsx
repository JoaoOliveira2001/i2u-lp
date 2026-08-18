import { useState } from 'react'

export function CredentialField({ label, value, secret = false }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!value) return null

  const displayValue = secret && !revealed ? '••••••••••••' : value

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="credential-field">
      <span className="credential-field__label">{label}</span>
      <div className="credential-field__row">
        <code className={`credential-field__value${secret ? ' is-secret' : ''}`}>{displayValue}</code>
        <div className="credential-field__actions">
          {secret && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setRevealed((v) => !v)}
            >
              {revealed ? 'Ocultar' : 'Mostrar'}
            </button>
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={handleCopy}>
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
