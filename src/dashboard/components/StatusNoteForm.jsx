import { useEffect, useState } from 'react'
import { fetchStatusHistory, updateProjectStatusNote } from '../../lib/mutations'
import { FormField } from './FormField'
import { StatusTimeline } from './StatusTimeline'

export function StatusNoteForm({ project, onSaved }) {
  const [note, setNote] = useState('')
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const rows = await fetchStatusHistory(project.project_id)
      setHistory(rows)
    } catch (err) {
      setError(err.message || 'Erro ao carregar histórico')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [project.project_id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!note.trim()) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateProjectStatusNote(project.project_id, note, 'manual')
      setNote('')
      setSuccess('Status atualizado')
      await loadHistory()
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Erro ao salvar status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Status operacional</h2>
      <p className="panel__hint">
        Anote bloqueios ou próximos passos. Também pode mandar pela IA: &quot;orlario falta
        cliente aprovar escopo&quot;.
      </p>

      {project.status_note && (
        <div className="status-current">
          <span className="badge badge--neutral">Atual</span>
          <p>{project.status_note}</p>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <form className="edit-form" onSubmit={handleSubmit}>
        <FormField label="Novo status">
          <textarea
            className="form-input"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: Falta cliente aprovar escopo"
          />
        </FormField>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={saving || !note.trim()}>
            {saving ? 'Salvando...' : 'Salvar status'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <h3 className="panel__title" style={{ fontSize: '0.92rem' }}>
          Histórico
        </h3>
        {loadingHistory ? (
          <p className="loading">Carregando histórico...</p>
        ) : (
          <StatusTimeline entries={history} />
        )}
      </div>
    </section>
  )
}
