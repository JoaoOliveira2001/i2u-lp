import { formatBrl, formatHours, formatPct } from '../../lib/format'

export function KpiCards({ totals }) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-card__label">Receita contratada</div>
        <div className="kpi-card__value">{formatBrl(totals.revenue)}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Custo de horas</div>
        <div className="kpi-card__value">{formatBrl(totals.hourlyCost)}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Custos fixos</div>
        <div className="kpi-card__value">{formatBrl(totals.fixedCost)}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Custo total</div>
        <div className="kpi-card__value">{formatBrl(totals.cost)}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Lucro líquido</div>
        <div
          className={`kpi-card__value ${totals.margin >= 0 ? 'is-positive' : 'is-negative'}`}
        >
          {formatBrl(totals.margin)}
        </div>
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Projetos no vermelho</div>
        <div className={`kpi-card__value ${totals.lossProjects > 0 ? 'is-negative' : 'is-positive'}`}>
          {totals.lossProjects}
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status, marginPct }) {
  if (status === 'lucro') {
    return <span className="badge badge--profit">Lucro {formatPct(marginPct)}</span>
  }
  if (status === 'prejuizo') {
    return <span className="badge badge--loss">Prejuízo {formatPct(marginPct)}</span>
  }
  return <span className="badge badge--neutral">Sem valor</span>
}

export function ConsumptionBar({ revenue, cost }) {
  if (!revenue) return null
  const pct = Math.min((cost / revenue) * 100, 100)
  const isOver = cost > revenue

  return (
    <div>
      <div className="project-card__row">
        <span>Consumo do contrato</span>
        <strong>{pct.toFixed(0)}%</strong>
      </div>
      <div className="progress">
        <div
          className={`progress__bar ${isOver ? 'is-over' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function formatProjectHours(hours) {
  return formatHours(hours)
}
