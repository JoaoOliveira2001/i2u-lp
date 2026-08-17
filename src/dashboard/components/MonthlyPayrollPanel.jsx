import { useMemo, useState } from 'react'
import { formatBrl, formatHours } from '../../lib/format'
import { formatMonthLabel } from '../lib/monthlyStats'
import {
  buildMonthlyPayroll,
  listAvailableMonths,
  previousMonthKey,
} from '../lib/monthlyPayroll'

export function MonthlyPayrollPanel({ timeEntries, developers }) {
  const months = useMemo(() => listAvailableMonths(timeEntries), [timeEntries])
  const [monthKey, setMonthKey] = useState(() => previousMonthKey())

  const payroll = useMemo(
    () => buildMonthlyPayroll(timeEntries, developers, monthKey),
    [timeEntries, developers, monthKey],
  )

  return (
    <section className="panel">
      <div className="payroll-head">
        <div>
          <h2 className="panel__title">Pagamento da equipe</h2>
          <p className="panel__hint">
            Horas arredondadas para cima no mês — valor a pagar por colaborador.
          </p>
        </div>
        <label className="hours-filter">
          <span>Mês</span>
          <select value={monthKey} onChange={(e) => setMonthKey(e.target.value)}>
            {months.map((key) => (
              <option key={key} value={key}>
                {formatMonthLabel(key)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table className="data-table payroll-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Taxa</th>
              <th>Horas lançadas</th>
              <th>Horas ↑</th>
              <th>Custo exato</th>
              <th>A pagar</th>
            </tr>
          </thead>
          <tbody>
            {payroll.rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.name}
                  {row.type === 'fixed' && (
                    <span className="payroll-tag">fixo</span>
                  )}
                </td>
                <td>{row.type === 'hourly' ? `${formatBrl(row.rate)}/h` : '—'}</td>
                <td>{row.type === 'hourly' ? formatHours(row.hoursExact) : '—'}</td>
                <td className="is-accent">
                  {row.type === 'hourly' ? formatHours(row.hoursRoundedUp) : '—'}
                </td>
                <td>{formatBrl(row.payExact)}</td>
                <td className="is-pay">{formatBrl(row.payRoundedUp)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="payroll-total">
              <td colSpan={2}>Total — {payroll.monthLabel}</td>
              <td>{formatHours(payroll.totals.hoursExact)}</td>
              <td className="is-accent">{formatHours(payroll.totals.hoursRoundedUp)}</td>
              <td>{formatBrl(payroll.totals.payExact)}</td>
              <td className="is-pay">{formatBrl(payroll.totals.payRoundedUp)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
