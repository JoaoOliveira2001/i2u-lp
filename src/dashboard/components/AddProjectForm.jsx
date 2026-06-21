import { useState } from 'react'
import { createProject } from '../../lib/mutations'
import { FormField } from './FormField'

export function AddProjectForm({ onSaved, onCancel }) {
  const [name, setName] = useState('')
  const [contractValue, setContractValue] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Nome do projeto é obrigatório')
      return
    }

    setSaving(true)
    setError('')

    try {
      await createProject({
        name,
        contractValueBrl: contractValue,
        paymentDate: paymentDate || null,
        notes,
      })
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Erro ao criar projeto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <h3 className="panel__title">Novo projeto</h3>
      {error && <div className="error-banner">{error}</div>}

      <FormField label="Nome">
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Cliente X"
        />
      </FormField>

      <FormField label="Valor combinado (R$)">
        <input
          className="form-input"
          type="number"
          min="0"
          step="0.01"
          value={contractValue}
          onChange={(e) => setContractValue(e.target.value)}
          placeholder="Opcional"
        />
      </FormField>

      <FormField label="Data do pagamento">
        <input
          className="form-input"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
        />
      </FormField>

      <FormField label="Observações">
        <textarea
          className="form-input"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </FormField>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar projeto'}
        </button>
      </div>
    </form>
  )
}
