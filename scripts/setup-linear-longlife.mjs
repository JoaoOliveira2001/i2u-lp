#!/usr/bin/env node
/**
 * Creates/links the Longlife project in Linear and syncs open issues.
 * Requires LINEAR_API_KEY (personal API key) in .env.local
 */
import { config } from 'dotenv'
import { fetchAllProjects, linearQuery } from '../server/lib/linear-client.mjs'
import { getSupabaseAdmin } from '../server/lib/supabase-admin.mjs'
import { syncProjectIssues, upsertProjectFromLinear } from '../server/lib/linear-sync.mjs'

config({ path: '.env.local' })
config()

const LONGlife_SLUG = 'longlife'

async function findTeamId() {
  const data = await linearQuery(
    `
    query TeamsAndProjects {
      teams(first: 20) {
        nodes { id name }
      }
      projects(first: 1) {
        nodes {
          teams {
            nodes { id name }
          }
        }
      }
    }
  `,
  )

  const teams = data.teams?.nodes || []
  const preferred = teams.find((t) => /longlife/i.test(t.name || ''))
  if (preferred?.id) return preferred.id
  if (teams[0]?.id) return teams[0].id

  const projectTeamId = data.projects?.nodes?.[0]?.teams?.nodes?.[0]?.id
  if (projectTeamId) return projectTeamId

  throw new Error('Não foi possível detectar team id no Linear')
}

async function createLinearProject(teamId) {
  const data = await linearQuery(
    `
    mutation CreateLonglife($teamIds: [String!]!, $name: String!) {
      projectCreate(input: { name: $name, teamIds: $teamIds }) {
        success
        project { id name url }
      }
    }
  `,
    { teamIds: [teamId], name: 'Longlife' },
  )

  const result = data.projectCreate
  if (!result?.success || !result.project) {
    throw new Error('Falha ao criar projeto Longlife no Linear')
  }
  return result.project
}


async function linkTeamIssuesWithoutProject(teamId, linearProjectId) {
  let after = null
  const orphans = []

  while (true) {
    const data = await linearQuery(
      `
      query TeamIssues($teamId: String!, $after: String) {
        team(id: $teamId) {
          issues(first: 50, after: $after) {
            nodes { id identifier project { id } }
            pageInfo { hasNextPage endCursor }
          }
        }
      }
    `,
      { teamId, after },
    )

    for (const issue of data.team?.issues?.nodes || []) {
      if (!issue.project?.id) orphans.push(issue)
    }

    if (!data.team?.issues?.pageInfo?.hasNextPage) break
    after = data.team.issues.pageInfo.endCursor
  }

  for (const issue of orphans) {
    await linearQuery(
      `
      mutation LinkIssue($id: String!, $projectId: String!) {
        issueUpdate(id: $id, input: { projectId: $projectId }) {
          success
        }
      }
    `,
      { id: issue.id, projectId: linearProjectId },
    )
  }

  if (orphans.length) {
    console.log(
      `Issues vinculados ao projeto Linear: ${orphans.map((i) => i.identifier).join(', ')}`,
    )
  }

  return orphans.length
}

async function main() {
  const supabase = getSupabaseAdmin()
  const { data: localProject, error } = await supabase
    .from('projects')
    .select('id, slug, name, linear_project_id')
    .eq('slug', LONGlife_SLUG)
    .single()

  if (error || !localProject) {
    throw new Error(`Projeto ${LONGlife_SLUG} não encontrado no Supabase`)
  }

  const linearProjects = await fetchAllProjects()
  let linearProject = linearProjects.find(
    (p) => !p.archivedAt && p.name?.trim().toLowerCase() === 'longlife',
  )

  if (!linearProject) {
    const teamId = await findTeamId()
    linearProject = await createLinearProject(teamId)
    console.log('Projeto criado no Linear:', linearProject.url)
  } else {
    console.log('Projeto já existe no Linear:', linearProject.url)
  }

  await upsertProjectFromLinear(supabase, linearProject)

  const { data: linked } = await supabase
    .from('projects')
    .select('id, linear_project_id, linear_url')
    .eq('slug', LONGlife_SLUG)
    .single()

  if (!linked?.linear_project_id) {
    await supabase
      .from('projects')
      .update({
        linear_project_id: linearProject.id,
        linear_url: linearProject.url,
        linear_synced_at: new Date().toISOString(),
      })
      .eq('id', localProject.id)
  }

  const teamId = await findTeamId()
  await linkTeamIssuesWithoutProject(teamId, linearProject.id)

  const synced = await syncProjectIssues(supabase, linearProject.id)
  console.log(
    JSON.stringify(
      {
        ok: true,
        linearProjectId: linearProject.id,
        linearUrl: linearProject.url,
        issuesSynced: synced.count,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
