export const EXCLUDED_LABOR_COST_DEVELOPERS = new Set(['João', 'Pedro'])

function entryLaborCost(entry) {
  const devName = entry.developers?.name
  if (EXCLUDED_LABOR_COST_DEVELOPERS.has(devName)) return 0
  const hours = Number(entry.hours_decimal) || 0
  const rate = Number(entry.developers?.hourly_rate_brl) || 0
  return hours * rate
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function buildMonthlyStats(timeEntries, projects, fixedMonthlyCost = 0) {
  const months = new Map()

  const ensure = (key) => {
    if (!months.has(key)) {
      months.set(key, {
        month: key,
        label: formatMonthLabel(key),
        hours: 0,
        hourlyCost: 0,
        revenue: 0,
        projectCount: 0,
        incomingProjects: [],
      })
    }
    return months.get(key)
  }

  for (const entry of timeEntries) {
    const key = entry.work_date?.slice(0, 7)
    if (!key) continue
    const row = ensure(key)
    const hours = Number(entry.hours_decimal) || 0
    row.hours += hours
    row.hourlyCost += entryLaborCost(entry)
  }

  for (const project of projects) {
    if (!project.payment_date || project.revenue_brl == null) continue
    const key = project.payment_date.slice(0, 7)
    const row = ensure(key)
    const value = Number(project.revenue_brl) || 0
    row.revenue += value
    row.projectCount += 1
    row.incomingProjects.push({
      id: project.project_id,
      name: project.name,
      value,
      paymentDate: project.payment_date,
      status: project.project_status,
    })
  }

  return Array.from(months.values())
    .map((row) => {
      const hasActivity = row.hours > 0 || row.revenue > 0
      const fixedCost = hasActivity ? fixedMonthlyCost : 0
      const totalCost = row.hourlyCost + fixedCost
      const margin = row.revenue - totalCost

      row.incomingProjects.sort((a, b) => b.value - a.value)

      return {
        ...row,
        incomingCount: row.projectCount,
        incomingTotal: row.revenue,
        fixedCost,
        totalCost,
        margin,
        result:
          !hasActivity ? 'neutro' : row.revenue === 0 ? 'prejuizo' : margin >= 0 ? 'lucro' : 'prejuizo',
      }
    })
    .filter((row) => row.hours > 0 || row.revenue > 0)
    .sort((a, b) => b.month.localeCompare(a.month))
}

export function buildIncomingSummary(months) {
  return months
    .filter((m) => m.projectCount > 0)
    .map((m) => ({
      month: m.month,
      label: m.label,
      projectCount: m.projectCount,
      totalValue: m.revenue,
      projects: m.incomingProjects,
    }))
}

export function filterActiveProjects(projects) {
  return projects.filter((p) => p.project_status !== 'finalized')
}

export function filterFinalizedProjects(projects) {
  return projects.filter((p) => p.project_status === 'finalized')
}
