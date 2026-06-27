import { formatMonthLabel } from './monthlyStats'

export function buildDeveloperHoursSeries(timeEntries, developers) {
  const hourlyDevs = developers.filter(
    (d) => d.active !== false && d.cost_model !== 'fixed_monthly',
  )
  const series = hourlyDevs.map((d) => d.name)

  const months = new Map()

  for (const entry of timeEntries) {
    const key = entry.work_date?.slice(0, 7)
    const devName = entry.developers?.name
    if (!key || !devName) continue

    if (!months.has(key)) {
      months.set(key, {
        month: key,
        label: formatMonthLabel(key),
      })
    }

    const row = months.get(key)
    row[devName] = (row[devName] || 0) + (Number(entry.hours_decimal) || 0)
  }

  const data = Array.from(months.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => {
      for (const name of series) {
        if (row[name] == null) row[name] = 0
        else row[name] = Math.round(row[name] * 100) / 100
      }
      return row
    })

  const activeSeries = series.filter((name) =>
    data.some((row) => (row[name] || 0) > 0),
  )

  return { data, series: activeSeries.length ? activeSeries : series }
}
