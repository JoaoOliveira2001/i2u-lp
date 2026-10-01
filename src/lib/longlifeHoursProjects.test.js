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

test('catalog includes the current Linear Longlife projects', () => {
  const names = LONGLIFE_HOURS_PROJECTS.map((project) => project.name)
  assert.deepEqual(names, ['Longlife', 'SM2 — Integrações'])
  assert.equal(
    LONGLIFE_HOURS_PROJECTS[0].linearUrl,
    'https://linear.app/longlife/project/longlife-8fdb5a8d09aa',
  )
  assert.equal(
    LONGLIFE_HOURS_PROJECTS[1].linearUrl,
    'https://linear.app/longlife/project/sm2-integracoes-af25d4453cd5',
  )
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

  assert.equal(plan.updates.length, 0)
  assert.equal(plan.inserts.length, 1)
  assert.equal(plan.inserts[0].slug, 'sm2-integracoes')
  assert.equal(plan.inserts[0].name, 'SM2 — Integrações')
  assert.equal(plan.inserts[0].status, 'active')
  assert.equal(plan.inserts[0].id, undefined)
  assert.equal(
    existing.find((project) => project.slug === 'longlife').id,
    LONGLIFE_ID,
  )
  assert.equal(existing.find((project) => project.slug === 'kringe').id, KRINGE_ID)
})

test('fills a missing Linear URL without renaming or reopening a project', () => {
  const plan = planLonglifeProjectWrites([
    {
      id: LONGLIFE_ID,
      slug: 'longlife',
      name: 'Longlife',
      status: 'finalized',
      linear_url: null,
    },
  ])

  assert.equal(plan.inserts.length, 1)
  assert.equal(plan.inserts[0].slug, 'sm2-integracoes')
  assert.deepEqual(plan.updates, [
    {
      id: LONGLIFE_ID,
      patch: { linear_url: 'https://linear.app/longlife/project/longlife-8fdb5a8d09aa' },
    },
  ])
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
