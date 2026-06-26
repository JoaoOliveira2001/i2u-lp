import { useState } from 'react'
import { createTimeEntry } from '../../lib/mutations'

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

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function TimeEntryForm({ developerId, projects, onSaved }) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [workDate, setWorkDate] = useState(todayIso())
  const [hours, setHours] = useState('')
  const [task, setTask] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    setSuccess('')

    try {
      await createTimeEntry({
        projectId,
        developerId,
        workDate,
        hoursDecimal,
        taskDescription: task.trim(),
      })
      setHours('')
      setTask('')
      setSuccess('Horas registradas!')
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (!projects.length) {
    return <p className="loading">Nenhum projeto ativo disponível.</p>
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2 className="panel__title">Registrar horas</h2>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="field">
        <label htmlFor="project">Projeto</label>
        <select
          id="project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="workDate">Data</label>
        <input
          id="workDate"
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="hours">Horas</label>
        <input
          id="hours"
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
        <span className="field__hint">Use decimal (1.5) ou HH:MM</span>
      </div>

      <div className="field">
        <label htmlFor="task">O que você fez</label>
        <textarea
          id="task"
          placeholder="Ex: Ajuste no fluxo de WhatsApp, correção de bug no login..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={3}
        />
      </div>

      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? 'Salvando...' : 'Registrar horas'}
      </button>
    </form>
  )
}
