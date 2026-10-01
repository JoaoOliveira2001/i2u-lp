/**
 * Mirror of the Linear Longlife workspace projects used when logging hours.
 *
 * `/horas` and the dashboard project list both read `public.projects`.
 * A project shows up in the hours selector when it is not finalized and not
 * archived in Linear. Existing rows keep their ids, so past time entries stay
 * attached.
 *
 * How a new Linear project gets into the selector:
 * 1. Preferred: set LINEAR_API_KEY to a Longlife workspace key and run
 *    `npm run linear:sync` (or POST /api/linear/sync, or the Project webhook).
 *    That upserts every current Linear project into `public.projects`.
 * 2. If that key is not available: add the project to LONGLIFE_HOURS_PROJECTS
 *    (stable slug, Linear name, Linear URL) and run
 *    `npm run linear:ensure-hours-projects`. Opening `/horas` or the dashboard
 *    also upserts any catalog row that is still missing.
 *
 * Never reuse a slug that already has time entries.
 */

export const LONGLIFE_HOURS_PROJECTS = [
  {
    slug: 'longlife',
    name: 'Longlife',
    linearUrl: 'https://linear.app/longlife/project/longlife-8fdb5a8d09aa',
    linearKey: 'P-LON-1',
    linearStatus: 'Backlog',
  },
  {
    slug: 'sm2-integracoes',
    name: 'SM2 — Integrações',
    linearUrl: 'https://linear.app/longlife/project/sm2-integracoes-af25d4453cd5',
    linearKey: 'P-LON-2',
    linearStatus: 'In Progress',
  },
]

function normalizeUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/$/, '')
    .toLowerCase()
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function mirrorNote(item) {
  return `Projeto Linear Longlife (${item.linearKey}, ${item.linearStatus}).`
}

export function planLonglifeProjectWrites(existingProjects, catalog = LONGLIFE_HOURS_PROJECTS) {
  const inserts = []
  const updates = []

  for (const item of catalog) {
    const byUrl = (existingProjects || []).find(
      (project) => normalizeUrl(project.linear_url) === normalizeUrl(item.linearUrl),
    )
    const bySlug = (existingProjects || []).find((project) => project.slug === item.slug)
    const byName = (existingProjects || []).find(
      (project) => normalizeName(project.name) === normalizeName(item.name),
    )

    let existing = byUrl || bySlug || null
    if (
      !existing &&
      byName &&
      (!byName.linear_url || normalizeUrl(byName.linear_url) === normalizeUrl(item.linearUrl))
    ) {
      existing = byName
    }

    if (!existing) {
      inserts.push({
        slug: item.slug,
        name: item.name,
        status: 'active',
        linear_url: item.linearUrl,
        notes: mirrorNote(item),
      })
      continue
    }

    if (!existing.linear_url) {
      updates.push({
        id: existing.id,
        patch: { linear_url: item.linearUrl },
      })
    }
  }

  return { inserts, updates }
}

export function isSelectableHoursProject(project) {
  if (!project || project.status === 'finalized') return false
  if (project.linear_archived_at) return false
  return true
}

export function withEntryProject(projects, entry) {
  if (!entry?.project_id) return projects
  if ((projects || []).some((project) => project.id === entry.project_id)) return projects
  return [
    ...(projects || []),
    {
      id: entry.project_id,
      name: entry.projects?.name || 'Projeto anterior',
    },
  ]
}

export async function ensureLonglifeHoursProjects(supabase, catalog = LONGLIFE_HOURS_PROJECTS) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, slug, name, linear_url, status, linear_project_id')

  if (error) throw new Error(error.message || 'Falha ao ler projetos')

  const { inserts, updates } = planLonglifeProjectWrites(data || [], catalog)

  for (const row of inserts) {
    const { error: insertError } = await supabase.from('projects').insert(row)
    if (insertError && insertError.code !== '23505') {
      throw new Error(insertError.message || 'Falha ao inserir projeto Linear')
    }
  }

  for (const row of updates) {
    const { error: updateError } = await supabase
      .from('projects')
      .update(row.patch)
      .eq('id', row.id)
    if (updateError) throw new Error(updateError.message || 'Falha ao atualizar projeto Linear')
  }

  return { inserted: inserts.length, updated: updates.length }
}
