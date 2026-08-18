import { useState } from 'react'
import { updateTimeEntry } from '../../lib/mutations'

const QUICK_HOURS = ['0:30', '1', '1:30', '2', '4', '8']

function parseHoursInput(value) {
  const str = String(value).trim()
  if (!str) return 0
  if (str.includes(':')) {
    const [h, m] = str.split(':').map(Number)
    return h + (m || 0) / 60
  }
  return Number(str)
}

function hoursToInput(value) {
  const hours = Number(value)
  if (!hours) return ''
  const whole = Math.floor(hours)
  const minutes = Math.round((hours - whole) * 60)
  if (minutes === 0) return String(whole)
  return `${whole}:${String(minutes).padStart(2, '0')}`
}

export function EditTimeEntryForm({ entry, projects, onSaved, onCancel }) {
  const [projectId, setProjectId] = useState(entry.project_id || '')
  const [workDate, setWorkDate] = useState(entry.work_date || '')
  const [hours, setHours] = useState(hoursToInput(entry.hours_decimal))
  const [task, setTask] = useState(entry.task_description || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const hoursDecimal = parseHoursInput(hours)

    if (!projectId || !workDate || !hoursDecimal || hoursDecimal <= 0) {
      setError('Preencha projeto, data e horas válidas')
      return
    }

    if (!task.trim()) {
      setError('Descreva o que você fez')
      return
    }

    setSaving(true)
    setError('')

    try {
      await updateTimeEntry(entry.id, {
        projectId,
        workDate,
        hoursDecimal,
        taskDescription: task.trim(),
      })
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="entry-edit" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label>Projeto</label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Data</label>
        <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
      </div>

      <div className="field">
        <label>Horas</label>
        <input
          inputMode="decimal"
          placeholder="Ex: 2:30 ou 1.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
        <div className="chip-row">
          {QUICK_HOURS.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${hours === value ? 'is-active' : ''}`}
              onClick={() => setHours(value)}
            >
              {value.includes(':') ? value : `${value}h`}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>O que você fez</label>
        <textarea value={task} onChange={(e) => setTask(e.target.value)} rows={2} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
