import { useEffect, useState } from 'react'
import { formatHours } from '../lib/format'
import { Login } from './components/Login'
import { MyEntriesList } from './components/MyEntriesList'
import { TimeEntryForm } from './components/TimeEntryForm'
import { clearSessionDeveloperId, getSessionDeveloperId } from './lib/auth'
import { useTimesheetData } from './hooks/useTimesheetData'

export default function App() {
  const [developerId, setDeveloperId] = useState('')

  useEffect(() => {
    setDeveloperId(getSessionDeveloperId())
  }, [])

  const {
    developers,
    projects,
    entries,
    weekHours,
    todayHours,
    loading,
    error,
    refresh,
  } = useTimesheetData(developerId)

  const selectedDev = developers.find((d) => d.id === developerId)

  const handleLogin = (id) => {
    setDeveloperId(id)
  }

  const handleLogout = () => {
    clearSessionDeveloperId()
    setDeveloperId('')
  }

  if (!developerId) {
    return <Login onSuccess={handleLogin} />
  }

  return (
    <div className="horas-app">
      <header className="horas-header">
        <div className="horas-header__inner">
          <div className="horas-brand">
            <span className="horas-brand__dot" />
            i2u · Horas
            {selectedDev && (
              <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>· {selectedDev.name}</span>
            )}
          </div>
          <button type="button" className="btn btn--ghost" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="horas-main">
        <h1 className="horas-title">Bater ponto</h1>

        {loading && <p className="loading">Carregando...</p>}
        {error && <div className="error-banner">{error}</div>}

        {!loading && !error && (
          <>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-card__label">Hoje</div>
                <div className="summary-card__value">{formatHours(todayHours)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-card__label">Esta semana</div>
                <div className="summary-card__value">{formatHours(weekHours)}</div>
              </div>
            </div>

            <TimeEntryForm
              developerId={developerId}
              projects={projects}
              onSaved={refresh}
            />

            <MyEntriesList entries={entries} />
          </>
        )}
      </main>
    </div>
  )
}
