import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  buildMonthlyStats,
  filterActiveProjects,
  filterFinalizedProjects,
} from '../lib/monthlyStats'

export function useProfitability() {
  const [projects, setProjects] = useState([])
  const [developers, setDevelopers] = useState([])
  const [timeEntries, setTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [projectsRes, devsRes, entriesRes] = await Promise.all([
      supabase.from('project_profitability').select('*').order('name'),
      supabase.from('developers').select('*').order('name'),
      supabase
        .from('time_entries')
        .select('*, projects(slug, name, status), developers(name, hourly_rate_brl)')
        .order('work_date', { ascending: false }),
    ])

    if (projectsRes.error || devsRes.error || entriesRes.error) {
      setError(
        projectsRes.error?.message ||
          devsRes.error?.message ||
          entriesRes.error?.message ||
          'Erro ao carregar dados',
      )
      setLoading(false)
      return
    }

    setProjects(projectsRes.data || [])
    setDevelopers(devsRes.data || [])
    setTimeEntries(entriesRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const activeProjects = filterActiveProjects(projects)
  const finalizedProjects = filterFinalizedProjects(projects)

  const activeTimeEntries = timeEntries.filter(
    (entry) => entry.projects?.status !== 'finalized',
  )

  const totals = activeProjects.reduce(
    (acc, project) => {
      const revenue = Number(project.revenue_brl) || 0
      const cost = Number(project.labor_cost_brl) || 0
      if (project.revenue_brl != null) acc.revenue += revenue
      acc.hourlyCost += cost
      if (project.status === 'prejuizo') acc.lossProjects += 1
      return acc
    },
    { revenue: 0, hourlyCost: 0, fixedCost: 0, cost: 0, lossProjects: 0 },
  )

  totals.fixedCost = (developers || [])
    .filter((dev) => dev.active !== false && dev.cost_model === 'fixed_monthly')
    .reduce((sum, dev) => sum + (Number(dev.fixed_monthly_cost_brl) || 0), 0)

  totals.cost = totals.hourlyCost + totals.fixedCost
  totals.margin = totals.revenue - totals.cost

  totals.fixedDevs = (developers || [])
    .filter((dev) => dev.active !== false && dev.cost_model === 'fixed_monthly')
    .map((dev) => ({
      name: dev.name,
      cost: Number(dev.fixed_monthly_cost_brl) || 0,
    }))

  const monthlyStats = buildMonthlyStats(timeEntries, projects, totals.fixedCost)

  return {
    projects,
    activeProjects,
    finalizedProjects,
    developers,
    timeEntries,
    activeTimeEntries,
    monthlyStats,
    totals,
    loading,
    error,
    refresh: load,
  }
}

export function getProjectEntries(timeEntries, projectId) {
  return timeEntries.filter((entry) => entry.project_id === projectId)
}

export function getDeveloperBreakdown(entries) {
  const map = new Map()

  for (const entry of entries) {
    const devName = entry.developers?.name || 'Desconhecido'
    const rate = Number(entry.developers?.hourly_rate_brl) || 0
    const hours = Number(entry.hours_decimal) || 0
    const current = map.get(devName) || { hours: 0, cost: 0, rate }
    current.hours += hours
    current.cost += hours * rate
    current.rate = rate
    map.set(devName, current)
  }

  return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }))
}
