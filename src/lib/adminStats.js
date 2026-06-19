import { parseTimestamp } from './format'
import { getLastSeenKind, isUserOnline } from './utils'

export const MS_7D = 7 * 86400000
export const MS_30D = 30 * 86400000

export function isWithinWindow(ts, windowMs) {
  const ms = parseTimestamp(ts)
  if (ms == null) return false
  const elapsed = Date.now() - ms
  return elapsed >= 0 && elapsed < windowMs
}

export function computePresenceSummary(members) {
  let online = 0
  let activeWeek = 0
  let inactive7d = 0
  let neverLoggedIn = 0

  for (const m of members) {
    if (isUserOnline(m.last_seen)) online++
    if (isWithinWindow(m.last_seen, MS_7D)) activeWeek++
    if (!m.last_seen) neverLoggedIn++
    else if (!isWithinWindow(m.last_seen, MS_7D)) inactive7d++
  }

  return {
    total: members.length,
    online,
    activeWeek,
    inactive7d,
    neverLoggedIn,
  }
}

export function computeMemberWorkStats(members, tasks) {
  const byMember = new Map()

  for (const m of members) {
    byMember.set(String(m.id), {
      member: m,
      completed7d: 0,
      completed30d: 0,
      completedTotal: 0,
      created7d: 0,
      created30d: 0,
      openAssigned: 0,
    })
  }

  for (const t of tasks) {
    if (t.done && t.completed_by) {
      const stats = byMember.get(String(t.completed_by))
      if (stats) {
        stats.completedTotal++
        if (isWithinWindow(t.completed_at, MS_7D)) stats.completed7d++
        if (isWithinWindow(t.completed_at, MS_30D)) stats.completed30d++
      }
    }
    if (t.created_by) {
      const stats = byMember.get(String(t.created_by))
      if (stats) {
        if (isWithinWindow(t.created_at, MS_7D)) stats.created7d++
        if (isWithinWindow(t.created_at, MS_30D)) stats.created30d++
      }
    }
    if (!t.done && t.assignee_id) {
      const stats = byMember.get(String(t.assignee_id))
      if (stats) stats.openAssigned++
    }
  }

  return Array.from(byMember.values())
}

export function sortByLoginAsc(rows) {
  return [...rows].sort((a, b) => {
    const aMs = parseTimestamp(a.member.last_seen)
    const bMs = parseTimestamp(b.member.last_seen)
    if (aMs == null && bMs == null) return (a.member.name || '').localeCompare(b.member.name || '', 'cs')
    if (aMs == null) return -1
    if (bMs == null) return 1
    return aMs - bMs
  })
}

export function sortByProductivityDesc(rows) {
  return [...rows].sort((a, b) => {
    if (b.completed7d !== a.completed7d) return b.completed7d - a.completed7d
    if (b.completed30d !== a.completed30d) return b.completed30d - a.completed30d
    if (b.created7d !== a.created7d) return b.created7d - a.created7d
    return (a.member.name || '').localeCompare(b.member.name || '', 'cs')
  })
}

export function getWarningMembers(members) {
  return members.filter(m => {
    const kind = getLastSeenKind(m.last_seen)
    return kind === 'never' || kind === 'bad'
  })
}

export function computeTaskSummary(tasks) {
  let completed7d = 0
  let completed30d = 0
  let created7d = 0
  let openTotal = 0

  for (const t of tasks) {
    if (!t.done) openTotal++
    if (t.done && isWithinWindow(t.completed_at, MS_7D)) completed7d++
    if (t.done && isWithinWindow(t.completed_at, MS_30D)) completed30d++
    if (isWithinWindow(t.created_at, MS_7D)) created7d++
  }

  return { completed7d, completed30d, created7d, openTotal }
}
