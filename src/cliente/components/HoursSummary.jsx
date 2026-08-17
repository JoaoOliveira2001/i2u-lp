import { formatHours } from '../../lib/format'

export function HoursSummary({ hours, monthLabel }) {
  const { includedMonthly, usedThisMonth, remainingThisMonth } = hours
  const overBudget = remainingThisMonth < 0

  return (
    <section className="cliente-summary">
      <article className="cliente-card">
        <span className="cliente-card__label">Franquia mensal</span>
        <strong className="cliente-card__value">{formatHours(includedMonthly)}</strong>
      </article>
      <article className="cliente-card">
        <span className="cliente-card__label">Usadas em {monthLabel}</span>
        <strong className="cliente-card__value">{formatHours(usedThisMonth)}</strong>
      </article>
      <article className={`cliente-card ${overBudget ? 'is-warning' : 'is-highlight'}`}>
        <span className="cliente-card__label">
          {overBudget ? 'Acima da franquia' : 'Restantes este mês'}
        </span>
        <strong className="cliente-card__value">
          {overBudget ? `+${formatHours(Math.abs(remainingThisMonth))}` : formatHours(remainingThisMonth)}
        </strong>
      </article>
    </section>
  )
}
