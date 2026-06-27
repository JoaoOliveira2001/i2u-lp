import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatHours } from '../../lib/format'
import { buildDeveloperHoursSeries } from '../lib/hoursChartData'

const SERIES_COLORS = ['#00ff88', '#6495ed', '#ffb347', '#ff5c7a', '#a78bfa', '#22d3ee', '#f472b6']

function HoursTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const items = payload.filter((item) => Number(item.value) > 0)
  if (!items.length) return null

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{label}</div>
      {items.map((item) => (
        <div key={item.dataKey} className="chart-tooltip__row" style={{ color: item.color }}>
          {item.name}: {formatHours(item.value)}
        </div>
      ))}
      <div className="chart-tooltip__total">
        Total: {formatHours(items.reduce((sum, item) => sum + Number(item.value), 0))}
      </div>
    </div>
  )
}

export function HoursEvolutionChart({ timeEntries, developers }) {
  const { data, series } = buildDeveloperHoursSeries(timeEntries, developers)

  if (!data.length) {
    return <p className="loading">Sem horas registradas para montar o gráfico.</p>
  }

  return (
    <div className="chart-wrap chart-wrap--hours">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9b9ba6', fontSize: 11 }}
            tickFormatter={(value) => {
              const month = String(value).split(' de ')[0]
              return month.slice(0, 3)
            }}
          />
          <YAxis
            tick={{ fill: '#9b9ba6', fontSize: 11 }}
            tickFormatter={(v) => `${v}h`}
            width={42}
          />
          <Tooltip content={<HoursTooltip />} />
          <Legend />
          {series.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              name={name}
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
