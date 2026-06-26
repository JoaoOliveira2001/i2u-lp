import { createHmac, timingSafeEqual } from 'node:crypto'

const LINEAR_API = 'https://api.linear.app/graphql'

function getApiKey() {
  const key = process.env.LINEAR_API_KEY
  if (!key) throw new Error('LINEAR_API_KEY não configurada')
  return key
}

export async function linearQuery(query, variables = {}) {
  const response = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getApiKey(),
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json()
  if (!response.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message || response.statusText
    throw new Error(`Linear API: ${message}`)
  }

  return json.data
}

export async function fetchAllProjects() {
  const projects = []
  let after = null

  while (true) {
    const data = await linearQuery(
      `
      query Projects($after: String) {
        projects(first: 50, after: $after) {
          nodes {
            id
            name
            description
            url
            archivedAt
            lead {
              id
              name
              displayName
              email
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
      { after },
    )

    projects.push(...(data.projects?.nodes || []))
    if (!data.projects?.pageInfo?.hasNextPage) break
    after = data.projects.pageInfo.endCursor
  }

  return projects
}

export async function fetchProjectIssues(linearProjectId) {
  const issues = []
  let after = null

  while (true) {
    const data = await linearQuery(
      `
      query ProjectIssues($projectId: String!, $after: String) {
        project(id: $projectId) {
          issues(first: 50, after: $after) {
            nodes {
              id
              identifier
              title
              priority
              url
              completedAt
              updatedAt
              state {
                name
                type
              }
              assignee {
                id
                name
                displayName
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `,
      { projectId: linearProjectId, after },
    )

    const batch = data.project?.issues?.nodes || []
    issues.push(...batch)
    if (!data.project?.issues?.pageInfo?.hasNextPage) break
    after = data.project.issues.pageInfo.endCursor
  }

  return issues
}

export async function fetchWorkspaceUsers() {
  const users = []
  let after = null

  while (true) {
    const data = await linearQuery(
      `
      query Users($after: String) {
        users(first: 50, after: $after) {
          nodes {
            id
            name
            displayName
            email
            active
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
      { after },
    )

    users.push(...(data.users?.nodes || []))
    if (!data.users?.pageInfo?.hasNextPage) break
    after = data.users.pageInfo.endCursor
  }

  return users.filter((u) => u.active !== false)
}

export async function createLinearWebhook(url, secret) {
  const data = await linearQuery(
    `
    mutation CreateWebhook($url: String!, $secret: String!) {
      webhookCreate(
        input: {
          url: $url
          allPublicTeams: true
          resourceTypes: ["Issue", "Project"]
          secret: $secret
        }
      ) {
        success
        webhook {
          id
          enabled
        }
      }
    }
  `,
    { url, secret },
  )

  return data.webhookCreate
}

export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.LINEAR_WEBHOOK_SECRET
  if (!secret) return true
  if (!signatureHeader) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
  } catch {
    return expected === signatureHeader
  }
}
