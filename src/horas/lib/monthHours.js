export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function currentMonthKey(date = new Date()) {
  return localDateKey(date).slice(0, 7)
}

export function shiftMonth(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number)
  return currentMonthKey(new Date(year, month - 1 + delta, 1))
}

export function monthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const next = new Date(year, month, 1)
  const endMonth = String(next.getMonth() + 1).padStart(2, '0')
  return {
    start: `${monthKey}-01`,
    end: `${next.getFullYear()}-${endMonth}-01`,
  }
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function addHours(sum, value) {
  return Math.round((sum + (Number(value) || 0)) * 10000) / 10000
}

export function summarizeMonthHours(entries, monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const byDay = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    return {
      day,
      date: `${monthKey}-${String(day).padStart(2, '0')}`,
      hours: 0,
    }
  })

  const projects = new Map()
  let total = 0

  for (const entry of entries) {
    const date = String(entry.work_date || '').slice(0, 10)
    if (!date.startsWith(`${monthKey}-`)) continue

    const hours = Number(entry.hours_decimal) || 0
    const day = Number(date.slice(8, 10))
    if (!byDay[day - 1]) continue

    total = addHours(total, hours)
    byDay[day - 1].hours = addHours(byDay[day - 1].hours, hours)

    const projectId = entry.project_id || 'unknown'
    const name = entry.projects?.name || 'Projeto'
    const current = projects.get(projectId) || { projectId, name, hours: 0 }
    current.hours = addHours(current.hours, hours)
    projects.set(projectId, current)
  }

  const byProject = Array.from(projects.values()).sort((a, b) => {
    if (b.hours !== a.hours) return b.hours - a.hours
    return a.name.localeCompare(b.name, 'pt-BR')
  })

  return {
    total,
    daysInMonth,
    daysWorked: byDay.filter((day) => day.hours > 0).length,
    byProject,
    byDay,
  }
}
