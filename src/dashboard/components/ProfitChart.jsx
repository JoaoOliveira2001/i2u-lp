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
import { formatBrl } from '../../lib/format'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div
      style={{
        background: '#101015',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '10px 12px',
        fontSize: 13,
      }}
    >
      <div style={{ marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {formatBrl(item.value)}
        </div>
      ))}
    </div>
  )
}

export function ProfitChart({ projects }) {
  const data = projects
    .filter((p) => Number(p.total_hours) > 0 || p.revenue_brl != null)
    .map((p) => ({
      name: p.name,
      Receita: Number(p.revenue_brl) || 0,
      Custo: Number(p.labor_cost_brl) || 0,
    }))
    .sort((a, b) => b.Custo - a.Custo)

  if (!data.length) {
    return <p className="loading">Sem dados para o gráfico.</p>
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9b9ba6', fontSize: 11 }}
            angle={-28}
            textAnchor="end"
            height={70}
            interval={0}
          />
          <YAxis tick={{ fill: '#9b9ba6', fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          <Bar dataKey="Receita" fill="#00ff88" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Custo" fill="#ff5c7a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
