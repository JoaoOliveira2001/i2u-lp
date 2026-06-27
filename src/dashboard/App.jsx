import { useEffect, useState } from 'react'
import { fetchProjectById } from '../lib/mutations'
import { AppShell } from './components/AppShell'
import { useProfitability } from './hooks/useProfitability'
import { Overview } from './pages/Overview'
import { ProjectDetail } from './pages/ProjectDetail'
import { Projects } from './pages/Projects'
import { MonthlyProfit } from './pages/MonthlyProfit'
import { Team } from './pages/Team'
import { RecentHours } from './pages/RecentHours'

const AUTH_KEY = 'i2u_dashboard_auth'

function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const expected = import.meta.env.VITE_DASHBOARD_PASSWORD || 'i2u2026'

    if (password === expected) {
      sessionStorage.setItem(AUTH_KEY, '1')
      onSuccess()
      return
    }

    setError('Senha incorreta')
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <h1>Lucratividade i2u</h1>
        <p>Dashboard interno — digite a senha para continuar.</p>
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <div className="error-banner">{error}</div>}
        <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
          Entrar
        </button>
      </form>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [page, setPage] = useState('overview')
  const [selectedProject, setSelectedProject] = useState(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const {
    projects,
    activeProjects,
    finalizedProjects,
    developers,
    timeEntries,
    monthlyStats,
    totals,
    loading,
    error,
    refresh,
  } = useProfitability()

  useEffect(() => {
    setAuthed(sessionStorage.getItem(AUTH_KEY) === '1')
  }, [])

  const handleRefresh = async () => {
    await refresh()
    if (selectedProject?.project_id) {
      try {
        const updated = await fetchProjectById(selectedProject.project_id)
        setSelectedProject(updated)
      } catch {
        const fallback = projects.find((p) => p.project_id === selectedProject.project_id)
        if (fallback) setSelectedProject(fallback)
      }
    }
  }

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />
  }

  const handleSelectProject = (project) => {
    setSelectedProject(project)
    setPage('detail')
  }

  const handleBack = () => {
    setSelectedProject(null)
    setPage('projects')
  }

  let content

  if (loading) {
    content = <p className="loading">Carregando dados...</p>
  } else if (error) {
    content = <div className="error-banner">{error}</div>
  } else if (page === 'detail' && selectedProject) {
    content = (
      <ProjectDetail
        project={selectedProject}
        timeEntries={timeEntries}
        developers={developers}
        onBack={handleBack}
        onRefresh={handleRefresh}
      />
    )
  } else if (page === 'projects') {
    content = (
      <Projects
        projects={projects}
        activeProjects={activeProjects}
        finalizedProjects={finalizedProjects}
        onSelectProject={handleSelectProject}
        onRefresh={handleRefresh}
      />
    )
  } else if (page === 'monthly') {
    content = (
      <MonthlyProfit
        activeProjects={activeProjects}
        months={monthlyStats}
        totals={totals}
        onSelectProject={handleSelectProject}
      />
    )
  } else if (page === 'team') {
    content = <Team developers={developers} onRefresh={handleRefresh} />
  } else if (page === 'hours') {
    content = (
      <RecentHours
        timeEntries={timeEntries}
        developers={developers}
        onSelectProject={(partial) => {
          const full = projects.find((p) => p.project_id === partial.project_id) || partial
          handleSelectProject(full)
        }}
      />
    )
  } else {
    content = (
      <Overview
        projects={activeProjects}
        totals={totals}
        onSelectProject={handleSelectProject}
      />
    )
  }

  return (
    <AppShell
      page={page === 'detail' ? 'projects' : page}
      onNavigate={(next) => {
        setSelectedProject(null)
        setPage(next)
      }}
      assistantOpen={assistantOpen}
      onAssistantOpen={setAssistantOpen}
      onAssistantClose={() => setAssistantOpen(false)}
      onDataChanged={handleRefresh}
    >
      {content}
    </AppShell>
  )
}
