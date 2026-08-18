import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { checkDeveloperPassword, setSessionDeveloperId } from '../lib/auth'

export function Login({ onSuccess }) {
  const [developers, setDevelopers] = useState([])
  const [loadingDevs, setLoadingDevs] = useState(true)
  const [developerId, setDeveloperId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoadingDevs(true)
      const { data, error: devError } = await supabase
        .from('developers')
        .select('id, name, cost_model, active')
        .eq('active', true)
        .order('name')

      if (devError) {
        setError(devError.message)
        setLoadingDevs(false)
        return
      }

      const hourly = (data || []).filter((d) => d.cost_model !== 'fixed_monthly')
      setDevelopers(hourly)
      if (hourly.length) setDeveloperId(hourly[0].id)
      setLoadingDevs(false)
    }

    load()
  }, [])

  const selectedDev = developers.find((d) => d.id === developerId)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!selectedDev) {
      setError('Nenhum colaborador disponível')
      return
    }

    if (!checkDeveloperPassword(selectedDev.name, password)) {
      setError('Senha incorreta')
      return
    }

    setSessionDeveloperId(selectedDev.id)
    onSuccess(selectedDev.id)
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <h1>Registrar horas</h1>
        <p>Entre com seu nome e senha para registrar horas no projeto.</p>

        {loadingDevs ? (
          <p className="loading">Carregando equipe...</p>
        ) : (
          <>
            <div className="field">
              <label htmlFor="developer">Colaborador</label>
              <select
                id="developer"
                value={developerId}
                onChange={(e) => {
                  setDeveloperId(e.target.value)
                  setError('')
                }}
              >
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Senha"
                autoComplete="current-password"
                autoFocus
              />
            </div>
          </>
        )}

        {error && <div className="error-banner">{error}</div>}

        <button type="submit" className="btn btn--primary" disabled={loadingDevs || !developers.length}>
          Entrar
        </button>
      </form>
    </div>
  )
}
