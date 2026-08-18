import { AttentionPanel } from '../components/AttentionPanel'
import { KpiCards } from '../components/KpiCards'
import { ProfitChart } from '../components/ProfitChart'
import { ProjectGrid } from '../components/ProjectTable'
import { formatBrl } from '../../lib/format'

export function Overview({ projects, totals, onSelectProject }) {
  const activeProjects = projects.filter((p) => Number(p.total_hours) > 0)

  return (
    <>
      <h1 className="page-title">Visão Geral</h1>
      <p className="page-subtitle">
        Receita contratada vs custos da equipe (horas + fixos) — veja se cada projeto compensa.
      </p>

      <div className="info-banner">
        Custo de horas inclui todos os colaboradores (João e Pedro com valor real).
      </div>

      <KpiCards totals={totals} />

      <AttentionPanel projects={projects} onSelectProject={onSelectProject} />

      {totals.fixedDevs?.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">Custos fixos mensais</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Custo/mês</th>
                </tr>
              </thead>
              <tbody>
                {totals.fixedDevs.map((dev) => (
                  <tr key={dev.name}>
                    <td>{dev.name}</td>
                    <td>{formatBrl(dev.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel">
        <h2 className="panel__title">Receita vs Custo por projeto</h2>
        <ProfitChart projects={projects} />
      </section>

      <section className="panel">
        <h2 className="panel__title">Projetos com horas registradas</h2>
        <ProjectGrid projects={activeProjects} onSelect={onSelectProject} />
      </section>
    </>
  )
}
