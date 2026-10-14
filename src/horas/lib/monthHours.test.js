import assert from 'node:assert/strict'
import test from 'node:test'
import {
  currentMonthKey,
  formatMonthLabel,
  monthRange,
  shiftMonth,
  summarizeMonthHours,
} from './monthHours.js'

test('currentMonthKey uses the local calendar month', () => {
  assert.equal(currentMonthKey(new Date(2026, 9, 13)), '2026-10')
  assert.equal(currentMonthKey(new Date(2026, 0, 1)), '2026-01')
})

test('monthRange is inclusive of the first day and exclusive of the next month', () => {
  assert.deepEqual(monthRange('2026-02'), { start: '2026-02-01', end: '2026-03-01' })
  assert.deepEqual(monthRange('2026-12'), { start: '2026-12-01', end: '2027-01-01' })
})

test('shiftMonth crosses year boundaries', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12')
  assert.equal(shiftMonth('2026-12', 1), '2027-01')
  assert.equal(shiftMonth('2026-10', 0), '2026-10')
})

test('formatMonthLabel is a Portuguese month and year', () => {
  assert.equal(formatMonthLabel('2026-10'), 'Outubro de 2026')
})

test('summarizeMonthHours totals the selected month by project and day', () => {
  const summary = summarizeMonthHours(
    [
      {
        project_id: 'a',
        work_date: '2026-10-02',
        hours_decimal: '1.5',
        projects: { name: 'Longlife' },
      },
      {
        project_id: 'a',
        work_date: '2026-10-02',
        hours_decimal: 2,
        projects: { name: 'Longlife' },
      },
      {
        project_id: 'b',
        work_date: '2026-10-15',
        hours_decimal: 8,
        projects: { name: 'California' },
      },
      {
        project_id: 'c',
        work_date: '2026-10-03',
        hours_decimal: 1,
        projects: null,
      },
      {
        project_id: 'a',
        work_date: '2026-09-30',
        hours_decimal: 5,
        projects: { name: 'Longlife' },
      },
      {
        project_id: 'b',
        work_date: '2026-11-01',
        hours_decimal: 4,
        projects: { name: 'California' },
      },
    ],
    '2026-10',
  )

  assert.equal(summary.total, 12.5)
  assert.equal(summary.daysInMonth, 31)
  assert.equal(summary.byDay.length, 31)
  assert.equal(summary.byDay[0].hours, 0)
  assert.equal(summary.byDay[1].date, '2026-10-02')
  assert.equal(summary.byDay[1].hours, 3.5)
  assert.equal(summary.byDay[14].hours, 8)
  assert.equal(summary.daysWorked, 3)
  assert.deepEqual(
    summary.byProject.map((project) => [project.name, project.hours]),
    [
      ['California', 8],
      ['Longlife', 3.5],
      ['Projeto', 1],
    ],
  )
})

test('summarizeMonthHours includes the 29th of a leap-year February', () => {
  const summary = summarizeMonthHours(
    [
      {
        project_id: 'a',
        work_date: '2024-02-29T00:00:00.000Z',
        hours_decimal: 3,
        projects: { name: 'HFIT' },
      },
    ],
    '2024-02',
  )

  assert.equal(summary.daysInMonth, 29)
  assert.equal(summary.byDay[28].date, '2024-02-29')
  assert.equal(summary.byDay[28].hours, 3)
  assert.equal(summary.total, 3)
})

test('summarizeMonthHours returns an empty month without throwing', () => {
  const summary = summarizeMonthHours([], '2026-10')
  assert.equal(summary.total, 0)
  assert.equal(summary.daysWorked, 0)
  assert.deepEqual(summary.byProject, [])
  assert.equal(summary.byDay.length, 31)
})
