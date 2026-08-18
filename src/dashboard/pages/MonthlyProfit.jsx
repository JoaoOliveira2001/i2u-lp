import {
  IncomingProjectsPanel,
  MonthlyChart,
  MonthlyTable,
  ProjectProfitTable,
} from '../components/MonthlyProfit'

export function MonthlyProfit({ activeProjects, months, totals, onSelectProject }) {
  const lossMonths = months.filter((m) => m.result === 'prejuizo').length
  const profitMonths = months.filter((m) => m.result === 'lucro').length

  return (
    <>
      <h1 className="page-title">Lucro Mensal</h1>
      <p className="page-subtitle">
        Horas gastas, custos e receita por mês — só projetos ativos na visão de lucro por projeto.
      </p>

      <div className="info-banner">
        No fechamento mensal, horas de João e Pedro não entram no custo — rachamos 50/50 no final.
        Aqui só contam Kel, Leandro e custos fixos.
      </div>

      <div className="kpi-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="kpi-card">
          <div className="kpi-card__label">Meses com lucro</div>
          <div className="kpi-card__value is-positive">{profitMonths}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Meses no prejuízo</div>
          <div className={`kpi-card__value ${lossMonths > 0 ? 'is-negative' : 'is-positive'}`}>
            {lossMonths}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Custo fixo/mês</div>
          <div className="kpi-card__value">{totals.fixedCost > 0 ? `R$ ${totals.fixedCost}` : '—'}</div>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel__title">Receita vs Custo por mês</h2>
        <p className="panel__hint">
          Receita = pagamentos registrados naquele mês. Custo = horas + fixos (Luiz).
        </p>
        <MonthlyChart months={months} />
      </section>

      <section className="panel">
        <h2 className="panel__title">Entradas por mês</h2>
        <p className="panel__hint">
          Projetos com data de pagamento registrada — clique no mês para ver a lista.
        </p>
        <IncomingProjectsPanel months={months} onSelectProject={onSelectProject} />
      </section>

      <section className="panel">
        <h2 className="panel__title">Resumo mensal</h2>
        <MonthlyTable months={months} />
      </section>

      <section className="panel">
        <h2 className="panel__title">Lucro por projeto (ativos)</h2>
        <ProjectProfitTable projects={activeProjects} onSelect={onSelectProject} />
      </section>
    </>
  )
}
