import { useMemo } from 'react'
import { formatHours } from '../../lib/format'
import { currentMonthKey, formatMonthLabel, localDateKey, shiftMonth, summarizeMonthHours } from '../lib/monthHours'

function formatDayLabel(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

function showDayNumber(day, daysInMonth, isToday) {
  return isToday || day === 1 || day === daysInMonth || day % 5 === 0
}

export function MonthDashboard({ monthKey, onMonthChange, entries, loading, error }) {
  const summary = useMemo(
    () => summarizeMonthHours(entries, monthKey),
    [entries, monthKey],
  )
  const maxDayHours = summary.byDay.reduce((max, day) => Math.max(max, day.hours), 0)
  const today = localDateKey()
  const isCurrentMonth = monthKey === currentMonthKey()
  const workedDays = summary.byDay.filter((day) => day.hours > 0)

  return (
    <section className="panel month-dash" aria-labelledby="month-dash-title">
      <div className="month-dash__head">
        <h2 id="month-dash-title" className="panel__title">
          Suas horas no mês
        </h2>
        <div className="month-nav">
          <button
            type="button"
            className="btn btn--ghost btn--sm month-nav__step"
            onClick={() => onMonthChange(shiftMonth(monthKey, -1))}
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <div className="month-nav__field">
            <input
              type="month"
              value={monthKey}
              aria-label="Selecionar mês"
              onChange={(event) => {
                if (event.target.value) onMonthChange(event.target.value)
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm month-nav__step"
            onClick={() => onMonthChange(shiftMonth(monthKey, 1))}
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>
        <p className="month-dash__label">{formatMonthLabel(monthKey)}</p>
        {!isCurrentMonth && (
          <button
            type="button"
            className="btn btn--ghost btn--sm month-dash__today"
            onClick={() => onMonthChange(currentMonthKey())}
          >
            Mês atual
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="summary-card month-dash__total">
        <div className="summary-card__label">Total do mês</div>
        <div className="summary-card__value">{loading ? '…' : formatHours(summary.total)}</div>
        {!loading && summary.daysWorked > 0 && (
          <div className="month-dash__meta">
            {summary.daysWorked} {summary.daysWorked === 1 ? 'dia' : 'dias'} com registro
          </div>
        )}
      </div>

      {loading && <p className="loading">Carregando mês...</p>}

      {!loading && !error && !summary.total && (
        <p className="loading">Nenhuma hora registrada neste mês.</p>
      )}

      {!loading && summary.total > 0 && (
        <>
          <h3 className="month-dash__section">Por projeto</h3>
          <ul className="share-list">
            {summary.byProject.map((project) => {
              const share = (project.hours / summary.total) * 100
              return (
                <li key={project.projectId} className="share-row">
                  <span className="share-row__name">{project.name}</span>
                  <span className="share-row__hours">{formatHours(project.hours)}</span>
                  <div className="share-row__track" aria-hidden="true">
                    <div className="share-row__fill" style={{ width: `${Math.max(share, 2)}%` }} />
                  </div>
                  <span className="sr-only">{Math.max(1, Math.round(share))}% do mês</span>
                </li>
              )
            })}
          </ul>

          <h3 className="month-dash__section">Por dia</h3>
          <div className="day-chart" role="img" aria-label="Horas por dia do mês">
            {summary.byDay.map((day) => {
              const isToday = day.date === today
              const height = day.hours > 0 ? Math.max(8, (day.hours / maxDayHours) * 100) : 0
              return (
                <div
                  key={day.date}
                  className={`day-chart__col ${isToday ? 'is-today' : ''}`}
                  title={`${formatDayLabel(day.date)}: ${formatHours(day.hours)}`}
                >
                  <div className="day-chart__plot">
                    <div
                      className={`day-chart__bar ${day.hours > 0 ? 'has-hours' : ''} ${isToday ? 'is-today' : ''}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={`day-chart__label ${showDayNumber(day.day, summary.daysInMonth, isToday) ? '' : 'is-hidden'}`}>
                    {day.day}
                  </span>
                </div>
              )
            })}
          </div>

          <ul className="day-list">
            {workedDays.map((day) => (
              <li key={day.date} className="day-list__item">
                <span>{formatDayLabel(day.date)}</span>
                <span className="day-list__hours">{formatHours(day.hours)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
