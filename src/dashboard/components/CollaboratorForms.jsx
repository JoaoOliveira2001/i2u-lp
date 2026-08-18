import { useState } from 'react'
import { createCollaborator, updateCollaborator } from '../../lib/mutations'
import { formatBrl } from '../../lib/format'
import { FormField } from './FormField'

export function AddCollaboratorForm({ onSaved, onCancel }) {
  const [name, setName] = useState('')
  const [costModel, setCostModel] = useState('hourly')
  const [hourlyRate, setHourlyRate] = useState('')
  const [fixedCost, setFixedCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setSaving(true)
    setError('')

    try {
      await createCollaborator({
        name,
        costModel,
        hourlyRateBrl: costModel === 'hourly' ? hourlyRate : null,
        fixedMonthlyCostBrl: costModel === 'fixed_monthly' ? fixedCost : null,
      })
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Erro ao adicionar colaborador')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <h3 className="panel__title">Novo colaborador</h3>
      {error && <div className="error-banner">{error}</div>}

      <FormField label="Nome">
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>

      <FormField label="Tipo de custo">
        <select
          className="form-input"
          value={costModel}
          onChange={(e) => setCostModel(e.target.value)}
        >
          <option value="hourly">Por hora</option>
          <option value="fixed_monthly">Fixo mensal</option>
        </select>
      </FormField>

      {costModel === 'hourly' ? (
        <FormField label="Valor/hora (R$)">
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
        </FormField>
      ) : (
        <FormField label="Custo fixo mensal (R$)">
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            value={fixedCost}
            onChange={(e) => setFixedCost(e.target.value)}
          />
        </FormField>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar colaborador'}
        </button>
      </div>
    </form>
  )
}

function CollaboratorRow({ dev, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(dev.name)
  const [costModel, setCostModel] = useState(dev.cost_model || 'hourly')
  const [hourlyRate, setHourlyRate] = useState(
    dev.hourly_rate_brl != null ? String(dev.hourly_rate_brl) : '',
  )
  const [fixedCost, setFixedCost] = useState(
    dev.fixed_monthly_cost_brl != null ? String(dev.fixed_monthly_cost_brl) : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await updateCollaborator(dev.id, {
        name,
        costModel,
        hourlyRateBrl: costModel === 'hourly' ? hourlyRate : null,
        fixedMonthlyCostBrl: costModel === 'fixed_monthly' ? fixedCost : null,
      })
      setEditing(false)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <tr>
        <td>{dev.name}</td>
        <td>{dev.cost_model === 'fixed_monthly' ? 'Fixo mensal' : 'Por hora'}</td>
        <td>
          {dev.cost_model === 'fixed_monthly'
            ? formatBrl(dev.fixed_monthly_cost_brl)
            : `${formatBrl(dev.hourly_rate_brl)}/h`}
        </td>
        <td>
          <button type="button" className="btn btn--ghost" onClick={() => setEditing(true)}>
            Editar
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td colSpan={4}>
        <div className="inline-edit">
          {error && <div className="error-banner">{error}</div>}
          <div className="form-row">
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            <select
              className="form-input"
              value={costModel}
              onChange={(e) => setCostModel(e.target.value)}
            >
              <option value="hourly">Por hora</option>
              <option value="fixed_monthly">Fixo mensal</option>
            </select>
            {costModel === 'hourly' ? (
              <input
                className="form-input"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="R$/h"
              />
            ) : (
              <input
                className="form-input"
                type="number"
                value={fixedCost}
                onChange={(e) => setFixedCost(e.target.value)}
                placeholder="R$/mês"
              />
            )}
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
              Salvar
            </button>
            <button type="button" className="btn" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

export function CollaboratorTable({ developers, onSaved }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Custo</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {developers.map((dev) => (
            <CollaboratorRow key={dev.id} dev={dev} onSaved={onSaved} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
