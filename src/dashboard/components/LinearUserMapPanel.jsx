import { useEffect, useState } from 'react'
import { fetchLinearUserMap, upsertLinearUserMap } from '../../lib/mutations'

export function LinearUserMapPanel({ developers }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchLinearUserMap()
      setRows(data)
    } catch (err) {
      setError(err.message || 'Erro ao carregar mapeamento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = async (row, developerId) => {
    setSavingId(row.linear_user_id)
    setError('')
    try {
      await upsertLinearUserMap({
        linearUserId: row.linear_user_id,
        linearUserName: row.linear_user_name,
        developerId: developerId || null,
      })
      await load()
    } catch (err) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Linear ↔ Equipe</h2>
      <p className="panel__hint">
        Mapeie usuários do Linear para devs i2u. O lead do projeto no Linear vira responsável
        no dashboard.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="loading">Carregando...</p>}

      {!loading && !rows.length && (
        <p className="loading">
          Nenhum usuário Linear mapeado ainda. Rode o script seed-linear-users ou crie um
          projeto no Linear.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário Linear</th>
                <th>Dev i2u</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.linear_user_id}>
                  <td>{row.linear_user_name}</td>
                  <td>
                    <select
                      className="form-input"
                      value={row.developer_id || ''}
                      disabled={savingId === row.linear_user_id}
                      onChange={(e) =>
                        handleChange(row, e.target.value ? e.target.value : null)
                      }
                    >
                      <option value="">— Não mapeado —</option>
                      {developers.map((dev) => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
