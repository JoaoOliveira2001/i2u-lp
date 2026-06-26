import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10)
}

export function useTimesheetData(developerId) {
  const [developers, setDevelopers] = useState([])
  const [projects, setProjects] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadBase = useCallback(async () => {
    const [devsRes, projectsRes] = await Promise.all([
      supabase
        .from('developers')
        .select('id, name, cost_model, active')
        .eq('active', true)
        .order('name'),
      supabase
        .from('projects')
        .select('id, name, slug, status')
        .neq('status', 'finalized')
        .order('name'),
    ])

    if (devsRes.error || projectsRes.error) {
      throw new Error(devsRes.error?.message || projectsRes.error?.message)
    }

    setDevelopers(
      (devsRes.data || []).filter((d) => d.cost_model !== 'fixed_monthly'),
    )
    setProjects(projectsRes.data || [])
  }, [])

  const loadEntries = useCallback(async () => {
    if (!developerId) {
      setEntries([])
      return
    }

    const since = new Date()
    since.setDate(since.getDate() - 21)

    const { data, error: entriesError } = await supabase
      .from('time_entries')
      .select('id, work_date, hours_decimal, task_description, projects(name)')
      .eq('developer_id', developerId)
      .gte('work_date', formatDateKey(since))
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (entriesError) throw new Error(entriesError.message)
    setEntries(data || [])
  }, [developerId])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await loadBase()
      await loadEntries()
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [loadBase, loadEntries])

  useEffect(() => {
    load()
  }, [load])

  const weekStart = formatDateKey(startOfWeek(new Date()))
  const weekHours = entries
    .filter((e) => e.work_date >= weekStart)
    .reduce((sum, e) => sum + Number(e.hours_decimal), 0)

  const todayKey = formatDateKey(new Date())
  const todayHours = entries
    .filter((e) => e.work_date === todayKey)
    .reduce((sum, e) => sum + Number(e.hours_decimal), 0)

  return {
    developers,
    projects,
    entries,
    weekHours,
    todayHours,
    loading,
    error,
    refresh: load,
  }
}
