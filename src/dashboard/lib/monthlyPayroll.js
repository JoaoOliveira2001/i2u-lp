import { formatMonthLabel } from './monthlyStats'

export function monthKeyFromDate(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function previousMonthKey() {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - 1)
  return monthKeyFromDate(date)
}

export function listAvailableMonths(timeEntries) {
  const keys = new Set()
  for (const entry of timeEntries) {
    const key = entry.work_date?.slice(0, 7)
    if (key) keys.add(key)
  }
  keys.add(monthKeyFromDate())
  keys.add(previousMonthKey())
  return Array.from(keys).sort((a, b) => b.localeCompare(a))
}

export function buildMonthlyPayroll(timeEntries, developers, monthKey) {
  const hourlyDevs = developers.filter(
    (d) => d.active !== false && d.cost_model !== 'fixed_monthly',
  )
  const fixedDevs = developers.filter(
    (d) => d.active !== false && d.cost_model === 'fixed_monthly',
  )

  const rows = hourlyDevs.map((dev) => {
    const hoursExact = timeEntries
      .filter((e) => e.developer_id === dev.id && e.work_date?.startsWith(monthKey))
      .reduce((sum, e) => sum + (Number(e.hours_decimal) || 0), 0)

    const rate = Number(dev.hourly_rate_brl) || 0
    const hoursRoundedUp = hoursExact > 0 ? Math.ceil(hoursExact) : 0

    return {
      id: dev.id,
      name: dev.name,
      type: 'hourly',
      rate,
      hoursExact,
      hoursRoundedUp,
      payExact: hoursExact * rate,
      payRoundedUp: hoursRoundedUp * rate,
    }
  })

  for (const dev of fixedDevs) {
    const fixed = Number(dev.fixed_monthly_cost_brl) || 0
    rows.push({
      id: dev.id,
      name: dev.name,
      type: 'fixed',
      rate: null,
      hoursExact: null,
      hoursRoundedUp: null,
      payExact: fixed,
      payRoundedUp: fixed,
    })
  }

  rows.sort((a, b) => {
    if (b.payRoundedUp !== a.payRoundedUp) return b.payRoundedUp - a.payRoundedUp
    return a.name.localeCompare(b.name)
  })

  const totals = rows.reduce(
    (acc, row) => {
      acc.hoursExact += row.hoursExact || 0
      acc.hoursRoundedUp += row.hoursRoundedUp || 0
      acc.payExact += row.payExact
      acc.payRoundedUp += row.payRoundedUp
      return acc
    },
    { hoursExact: 0, hoursRoundedUp: 0, payExact: 0, payRoundedUp: 0 },
  )

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    rows,
    totals,
  }
}
