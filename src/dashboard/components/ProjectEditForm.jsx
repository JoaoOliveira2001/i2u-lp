import { useState } from 'react'
import { updateProject } from '../../lib/mutations'
import { FormField } from './FormField'

export function ProjectEditForm({ project, onSaved }) {
  const [name, setName] = useState(project.name || '')
  const [contractValue, setContractValue] = useState(
    project.revenue_brl != null ? String(project.revenue_brl) : '',
  )
  const [paymentDate, setPaymentDate] = useState(project.payment_date || '')
  const [notes, setNotes] = useState(project.notes || '')
  const [figmaUrl, setFigmaUrl] = useState(project.figma_url || '')
  const [projectStatus, setProjectStatus] = useState(project.project_status || 'active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateProject(project.project_id, {
        name,
        contractValueBrl: contractValue,
        paymentDate,
        notes,
        figmaUrl,
        projectStatus,
      })
      setSuccess('Projeto atualizado')
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const clearPaymentDate = () => setPaymentDate('')

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <h2 className="panel__title">Editar projeto</h2>
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <FormField label="Nome">
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>

      <FormField label="Valor combinado (R$)">
        <input
          className="form-input"
          type="number"
          min="0"
          step="0.01"
          value={contractValue}
          onChange={(e) => setContractValue(e.target.value)}
          placeholder="Deixe vazio se ainda não definido"
        />
      </FormField>

      <FormField label="Data do pagamento">
        <div className="inline-actions">
          <input
            className="form-input"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
          {paymentDate && (
            <button type="button" className="btn btn--ghost" onClick={clearPaymentDate}>
              Limpar
            </button>
          )}
        </div>
      </FormField>

      <FormField label="Status do projeto">
        <select
          className="form-input"
          value={projectStatus}
          onChange={(e) => setProjectStatus(e.target.value)}
        >
          <option value="active">Ativo (aparece no dashboard)</option>
          <option value="finalized">Finalizado e pago (oculto)</option>
        </select>
      </FormField>

      <FormField label="Link do Figma">
        <input
          className="form-input"
          type="url"
          value={figmaUrl}
          onChange={(e) => setFigmaUrl(e.target.value)}
          placeholder="https://www.figma.com/design/..."
        />
      </FormField>

      <FormField label="Observações">
        <textarea
          className="form-input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </FormField>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}
