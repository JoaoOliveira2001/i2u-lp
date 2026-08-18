import { formatHours } from '../../lib/format'

export function HoursProgress({ hours, monthLabel }) {
  const { includedMonthly, usedThisMonth, usagePercent, remainingThisMonth } = hours
  const overBudget = remainingThisMonth < 0
  const pct = Math.min(usagePercent, 100)

  return (
    <section className="cliente-panel cliente-progress">
      <div className="cliente-panel__header">
        <div>
          <h2>Uso da franquia</h2>
          <p className="cliente-panel__hint">{monthLabel}</p>
        </div>
        <span className={`cliente-progress__pct ${overBudget ? 'is-warning' : ''}`}>
          {usagePercent}%
        </span>
      </div>
      <div className="cliente-progress__bar" aria-hidden="true">
        <div
          className={`cliente-progress__fill ${overBudget ? 'is-warning' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="cliente-progress__legend">
        <span>
          {formatHours(usedThisMonth)} usadas de {formatHours(includedMonthly)}
        </span>
        <span className={overBudget ? 'is-warning-text' : 'is-positive-text'}>
          {overBudget
            ? `${formatHours(Math.abs(remainingThisMonth))} acima da franquia`
            : `${formatHours(remainingThisMonth)} restantes`}
        </span>
      </div>
    </section>
  )
}
