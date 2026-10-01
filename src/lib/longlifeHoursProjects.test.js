import assert from 'node:assert/strict'
import test from 'node:test'
import {
  LONGLIFE_HOURS_PROJECTS,
  isSelectableHoursProject,
  planLonglifeProjectWrites,
  withEntryProject,
} from './longlifeHoursProjects.js'

const LONGLIFE_ID = 'c78b8eb7-17fd-4517-bb38-ece3a7a1deb8'
const KRINGE_ID = '27f8dce7-815d-49ef-b9d3-66d7b38e3133'

test('catalog includes Linear Longlife projects and the requested hours projects', () => {
  const names = LONGLIFE_HOURS_PROJECTS.map((project) => project.name)
  assert.deepEqual(names, [
    'Longlife',
    'SM2 — Integrações',
    'California',
    'Pedacinho do Céu',
    'HFIT',
  ])
  assert.equal(
    LONGLIFE_HOURS_PROJECTS.find((project) => project.slug === 'california').linearUrl,
    'https://linear.app/sm2/project/california-55fe6d028a04',
  )
  assert.equal(
    LONGLIFE_HOURS_PROJECTS.find((project) => project.slug === 'pedacinho-do-ceu').linearUrl,
    null,
  )
  assert.equal(LONGLIFE_HOURS_PROJECTS.find((project) => project.slug === 'hfit').linearUrl, null)
})

test('plans an insert for SM2 and leaves the existing Longlife row untouched', () => {
  const existing = [
    {
      id: LONGLIFE_ID,
      slug: 'longlife',
      name: 'Longlife',
      status: 'active',
      linear_url: 'https://linear.app/longlife/project/longlife-8fdb5a8d09aa',
      linear_project_id: 'a79ddaac-186e-47a7-ba1d-34c3884e6c1b',
      contract_value_brl: '1500.00',
    },
    {
      id: KRINGE_ID,
      slug: 'kringe',
      name: 'Kringe',
      status: 'active',
      linear_url: 'https://linear.app/sm2/project/kringe-7712150be355',
    },
  ]

  const plan = planLonglifeProjectWrites(existing)
  const sm2 = plan.inserts.find((row) => row.slug === 'sm2-integracoes')

  assert.equal(
    plan.updates.some((row) => row.id === LONGLIFE_ID),
    false,
  )
  assert.equal(sm2.name, 'SM2 — Integrações')
  assert.equal(sm2.status, 'active')
  assert.equal(sm2.id, undefined)
  assert.equal(
    existing.find((project) => project.slug === 'longlife').id,
    LONGLIFE_ID,
  )
  assert.equal(existing.find((project) => project.slug === 'kringe').id, KRINGE_ID)
})

test('fills a missing Linear URL and reopens a catalog project for hour logging', () => {
  const plan = planLonglifeProjectWrites([
    {
      id: LONGLIFE_ID,
      slug: 'longlife',
      name: 'Longlife',
      status: 'finalized',
      linear_url: null,
    },
  ])

  assert.equal(
    plan.updates.find((row) => row.id === LONGLIFE_ID).patch.name,
    undefined,
  )
  assert.deepEqual(plan.updates.find((row) => row.id === LONGLIFE_ID).patch, {
    linear_url: 'https://linear.app/longlife/project/longlife-8fdb5a8d09aa',
    status: 'active',
  })
})

test('does not duplicate a project that already matches by name', () => {
  const plan = planLonglifeProjectWrites([
    {
      id: 'sm2-row',
      slug: 'integracoes-sm2',
      name: 'SM2 — Integrações',
      status: 'active',
      linear_url: null,
    },
  ])

  assert.equal(plan.inserts.some((row) => row.slug === 'sm2-integracoes'), false)
  assert.deepEqual(plan.updates, [
    {
      id: 'sm2-row',
      patch: {
        linear_url: 'https://linear.app/longlife/project/sm2-integracoes-af25d4453cd5',
      },
    },
  ])
})

test('hours selector keeps active projects and drops finalized or Linear-archived ones', () => {
  assert.equal(isSelectableHoursProject({ status: 'active', linear_archived_at: null }), true)
  assert.equal(isSelectableHoursProject({ status: 'active', linear_archived_at: null, slug: 'igr' }), true)
  assert.equal(isSelectableHoursProject({ status: 'finalized', linear_archived_at: null }), false)
  assert.equal(
    isSelectableHoursProject({ status: 'active', linear_archived_at: '2026-08-01T00:00:00Z' }),
    false,
  )
})

const CALIFORNIA_ID = 'b5fd716a-f39b-4d5f-a0e0-8c369039bc6f'

test('reopens finalized California on the same row and adds Pedacinho and HFIT', () => {
  const plan = planLonglifeProjectWrites([
    {
      id: CALIFORNIA_ID,
      slug: 'california',
      name: 'California',
      status: 'finalized',
      linear_url: 'https://linear.app/sm2/project/california-55fe6d028a04',
      linear_project_id: '513e62cf-7543-455f-b07a-fe4be8685522',
      linear_archived_at: null,
    },
  ])

  assert.deepEqual(plan.updates.find((row) => row.id === CALIFORNIA_ID).patch, {
    status: 'active',
  })
  assert.equal(plan.inserts.some((row) => row.slug === 'california'), false)
  assert.equal(plan.inserts.find((row) => row.slug === 'pedacinho-do-ceu').name, 'Pedacinho do Céu')
  assert.equal(plan.inserts.find((row) => row.slug === 'pedacinho-do-ceu').linear_url, undefined)
  assert.equal(plan.inserts.find((row) => row.slug === 'hfit').name, 'HFIT')
  assert.equal(plan.inserts.find((row) => row.slug === 'hfit').linear_url, undefined)
})

test('uses the Linear SM2 name California when the stored label is accented', () => {
  const plan = planLonglifeProjectWrites([
    {
      id: CALIFORNIA_ID,
      slug: 'california',
      name: 'Califórnia',
      status: 'active',
      linear_url: 'https://linear.app/sm2/project/california-55fe6d028a04',
      linear_project_id: '513e62cf-7543-455f-b07a-fe4be8685522',
    },
  ])

  assert.equal(plan.inserts.some((row) => row.slug === 'california'), false)
  assert.deepEqual(plan.updates.find((row) => row.id === CALIFORNIA_ID).patch, {
    name: 'California',
  })
})

test('matches accent-insensitive and lowercase names without creating a second row', () => {
  const plan = planLonglifeProjectWrites([
    {
      id: 'pedacinho-row',
      slug: 'pedacinho',
      name: 'PEDACINHO DO CEU',
      status: 'finalized',
      linear_url: null,
    },
    {
      id: 'hfit-row',
      slug: 'h-fit',
      name: 'hfit',
      status: 'active',
      linear_url: null,
    },
  ])

  assert.equal(plan.inserts.some((row) => row.slug === 'pedacinho-do-ceu'), false)
  assert.equal(plan.inserts.some((row) => row.slug === 'hfit'), false)
  assert.deepEqual(plan.updates.find((row) => row.id === 'pedacinho-row').patch, {
    name: 'Pedacinho do Céu',
    status: 'active',
  })
  assert.deepEqual(plan.updates.find((row) => row.id === 'hfit-row').patch, {
    name: 'HFIT',
  })
})

test('editing an old entry keeps its project even when it is not in the selector', () => {
  const projects = [{ id: 'longlife', name: 'Longlife' }]
  const entry = { project_id: KRINGE_ID, projects: { name: 'Kringe' } }
  const options = withEntryProject(projects, entry)

  assert.deepEqual(
    options.map((project) => project.name),
    ['Longlife', 'Kringe'],
  )
  assert.equal(withEntryProject(options, entry).length, 2)
})
