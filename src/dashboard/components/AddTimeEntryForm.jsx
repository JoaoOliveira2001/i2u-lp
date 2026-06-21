import { useState } from 'react'
import { createTimeEntry } from '../../lib/mutations'
import { FormField } from './FormField'

function parseHoursInput(value) {
  const str = String(value).trim()
  if (str.includes(':')) {
    const [h, m] = str.split(':').map(Number)
    return h + (m || 0) / 60
  }
  return Number(str)
}

export function AddTimeEntryForm({ projectId, developers, onSaved }) {
  const hourlyDevs = developers.filter((d) => d.cost_model !== 'fixed_monthly' && d.active !== false)
  const [developerId, setDeveloperId] = useState(hourlyDevs[0]?.id || '')
  const [workDate, setWorkDate] = useState('')
  const [hours, setHours] = useState('')
  const [task, setTask] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const hoursDecimal = parseHoursInput(hours)
    if (!developerId || !workDate || !hoursDecimal || hoursDecimal <= 0) {
      setError('Preencha dev, data e horas válidas')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createTimeEntry({
        projectId,
        developerId,
        workDate,
        hoursDecimal,
        taskDescription: task,
      })
      setHours('')
      setTask('')
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!hourlyDevs.length) {
    return <p className="loading">Cadastre um colaborador por hora para registrar horas.</p>
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <h3 className="panel__title">Registrar horas</h3>
      {error && <div className="error-banner">{error}</div>}

      <FormField label="Colaborador">
        <select
          className="form-input"
          value={developerId}
          onChange={(e) => setDeveloperId(e.target.value)}
        >
          {hourlyDevs.map((dev) => (
            <option key={dev.id} value={dev.id}>
              {dev.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Data">
        <input
          className="form-input"
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
        />
      </FormField>

      <FormField label="Horas" hint="Use decimal (1.5) ou HH:MM">
        <input
          className="form-input"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Ex: 2:30"
        />
      </FormField>

      <FormField label="Atividade">
        <input className="form-input" value={task} onChange={(e) => setTask(e.target.value)} />
      </FormField>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}
