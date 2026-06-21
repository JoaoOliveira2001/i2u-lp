import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBrl, formatHours } from '../../lib/format'
import { StatusBadge } from './KpiCards'

function MonthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey}>
          {item.name}: {formatBrl(item.value)}
        </div>
      ))}
    </div>
  )
}

export function MonthlyChart({ months }) {
  const data = [...months]
    .reverse()
    .map((m) => ({
      name: m.label,
      Receita: m.revenue,
      Custo: m.totalCost,
    }))

  if (!data.length) return <p className="loading">Sem dados mensais ainda.</p>

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9b9ba6', fontSize: 11 }}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: '#9b9ba6', fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
          <Tooltip content={<MonthTooltip />} />
          <Legend />
          <Bar dataKey="Receita" fill="#00ff88" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Custo" fill="#ff5c7a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function IncomingCountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey}>
          {item.name}: {item.dataKey === 'Projetos' ? item.value : formatBrl(item.value)}
        </div>
      ))}
    </div>
  )
}

export function IncomingProjectsChart({ months }) {
  const data = [...months]
    .filter((m) => m.incomingCount > 0)
    .reverse()
    .map((m) => ({
      name: m.label,
      Projetos: m.incomingCount,
      Valor: m.incomingTotal,
    }))

  if (!data.length) return <p className="loading">Nenhum pagamento registrado por mês ainda.</p>

  return (
    <div className="chart-wrap chart-wrap--compact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9b9ba6', fontSize: 11 }}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis yAxisId="left" tick={{ fill: '#9b9ba6', fontSize: 11 }} allowDecimals={false} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#9b9ba6', fontSize: 11 }}
            tickFormatter={(v) => `R$${v / 1000}k`}
          />
          <Tooltip content={<IncomingCountTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="Projetos" fill="#7dd3fc" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="Valor" fill="#00ff88" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function IncomingMonthRow({ month, onSelectProject }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <tr className="is-clickable" onClick={() => setOpen((v) => !v)}>
        <td style={{ textTransform: 'capitalize' }}>
          <span className="expand-icon">{open ? '▾' : '▸'}</span> {month.label}
        </td>
        <td>
          <span className="badge badge--neutral">{month.incomingCount}</span>
        </td>
        <td>{formatBrl(month.incomingTotal)}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={3} className="incoming-detail-cell">
            <ul className="incoming-list">
              {month.incomingProjects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className="incoming-list__item"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectProject?.({
                        project_id: project.id,
                        name: project.name,
                        revenue_brl: project.value,
                        payment_date: project.paymentDate,
                      })
                    }}
                  >
                    <span>{project.name}</span>
                    <span>{formatBrl(project.value)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}

export function IncomingProjectsPanel({ months, onSelectProject }) {
  const withPayments = months.filter((m) => m.incomingCount > 0)
  const totalProjects = withPayments.reduce((sum, m) => sum + m.incomingCount, 0)
  const totalValue = withPayments.reduce((sum, m) => sum + m.incomingTotal, 0)

  if (!withPayments.length) {
    return <p className="loading">Cadastre a data de pagamento nos projetos para ver entradas por mês.</p>
  }

  return (
    <>
      <div className="kpi-grid incoming-kpis">
        <div className="kpi-card">
          <div className="kpi-card__label">Projetos pagos (total)</div>
          <div className="kpi-card__value">{totalProjects}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Valor total recebido</div>
          <div className="kpi-card__value is-positive">{formatBrl(totalValue)}</div>
        </div>
      </div>

      <IncomingProjectsChart months={months} />

      <div className="table-wrap" style={{ marginTop: '1.25rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Projetos</th>
              <th>Valor total</th>
            </tr>
          </thead>
          <tbody>
            {withPayments.map((month) => (
              <IncomingMonthRow
                key={month.month}
                month={month}
                onSelectProject={onSelectProject}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function MonthResultBadge({ result, margin }) {
  if (result === 'lucro') {
    return <span className="badge badge--profit">Lucro {formatBrl(margin)}</span>
  }
  if (result === 'prejuizo') {
    return <span className="badge badge--loss">Prejuízo {formatBrl(Math.abs(margin))}</span>
  }
  return <span className="badge badge--neutral">—</span>
}

export function MonthlyTable({ months }) {
  if (!months.length) {
    return <p className="loading">Nenhum mês com horas ou pagamentos registrados.</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Mês</th>
            <th>Projetos</th>
            <th>Horas</th>
            <th>Custo horas</th>
            <th>Custos fixos</th>
            <th>Custo total</th>
            <th>Entradas (R$)</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {months.map((row) => (
            <tr key={row.month} className={row.result === 'prejuizo' ? 'row-loss' : ''}>
              <td style={{ textTransform: 'capitalize' }}>{row.label}</td>
              <td>{row.incomingCount || '—'}</td>
              <td>{formatHours(row.hours)}</td>
              <td>{formatBrl(row.hourlyCost)}</td>
              <td>{formatBrl(row.fixedCost)}</td>
              <td>{formatBrl(row.totalCost)}</td>
              <td>{formatBrl(row.incomingTotal)}</td>
              <td>
                <MonthResultBadge result={row.result} margin={row.margin} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ProjectProfitTable({ projects, onSelect }) {
  const sorted = [...projects].sort((a, b) => {
    const marginA = a.margin_closing_brl == null ? -Infinity : Number(a.margin_closing_brl)
    const marginB = b.margin_closing_brl == null ? -Infinity : Number(b.margin_closing_brl)
    return marginB - marginA
  })

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Projeto</th>
            <th>Valor</th>
            <th>Horas</th>
            <th>Custo</th>
            <th>Lucro</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((project) => (
            <tr
              key={project.project_id}
              className="is-clickable"
              onClick={() => onSelect?.(project)}
            >
              <td>{project.name}</td>
              <td>{formatBrl(project.revenue_brl)}</td>
              <td>{formatHours(project.total_hours)}</td>
              <td>{formatBrl(project.labor_cost_closing_brl)}</td>
              <td>{formatBrl(project.margin_closing_brl)}</td>
              <td>
                <StatusBadge status={project.status_closing} marginPct={project.margin_closing_pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
