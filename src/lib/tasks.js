import { canAddTasks, isAdmin } from './permissions'

export const PRIORITY_LABELS = {
  low: 'Nízká',
  normal: 'Normální',
  high: 'Vysoká',
  urgent: 'Naléhavá',
}

export const PRIORITY_OPTIONS = ['low', 'normal', 'high', 'urgent']

const PRIORITY_SORT = { urgent: 0, high: 1, normal: 2, low: 3 }

export function getMyAssignedOpenTasks(tasks, profile) {
  if (!profile) return []
  return (tasks || [])
    .filter(t => !t.done && isTaskAssignee(t, profile) && canViewerSeeTask(t, profile))
    .sort((a, b) => {
      const pa = PRIORITY_SORT[a.priority] ?? 2
      const pb = PRIORITY_SORT[b.priority] ?? 2
      if (pa !== pb) return pa - pb
      return String(a.due || '').localeCompare(String(b.due || ''), 'cs')
    })
}

export const canManageTasks = (layer) => canAddTasks(layer)

const isBucketLeader = (member, bucket) =>
  member.layer === 'vedouci' && member.bucket === bucket

export function getBucketMembers(members, bucket) {
  if (!bucket || bucket === 'all') return members || []
  return (members || []).filter(
    m => m.bucket === bucket || m.secondary_bucket === bucket
  )
}

export function sortBucketMembers(list, bucket) {
  return [...list].sort((a, b) => {
    const aLead = isBucketLeader(a, bucket)
    const bLead = isBucketLeader(b, bucket)
    if (aLead !== bLead) return Number(bLead) - Number(aLead)
    return (a.name || '').localeCompare(b.name || '', 'cs')
  })
}

export function resolveAssigneeName(task, members) {
  if (!task) return null
  if (task.assignee_id) {
    const m = members?.find(mem => String(mem.id) === String(task.assignee_id))
    if (m?.name) return m.name
  }
  return task.assignee || null
}

export function assigneePayload(assigneeId, members) {
  if (!assigneeId) {
    return { assignee_id: null, assignee: null }
  }
  const m = members?.find(mem => String(mem.id) === String(assigneeId))
  return { assignee_id: assigneeId, assignee: m?.name || null }
}

export function isVedouciOfBucket(profile, bucket) {
  if (!profile || !bucket || bucket === 'all') return false
  if (profile.layer !== 'vedouci') return false
  return profile.bucket === bucket || profile.secondary_bucket === bucket
}

export function isTaskAssignee(task, profile) {
  return Boolean(
    task?.assignee_id &&
      profile?.id &&
      String(task.assignee_id) === String(profile.id)
  )
}

/** Splněné úkoly vidí všichni v buňce; otevřené přiřazené jen přiřazený + vedoucí (+ admin). */
export function canViewerSeeTask(task, viewer) {
  if (!task || !viewer) return false
  if (task.done) return true
  if (!task.assignee_id) return true
  if (isAdmin(viewer.layer)) return true
  if (isTaskAssignee(task, viewer)) return true
  if (isVedouciOfBucket(viewer, task.bucket_target)) return true
  return false
}

export function filterTasksInBucket(tasks, bucket, { includeAll = true } = {}) {
  if (!bucket || bucket === 'all') return tasks || []
  return (tasks || []).filter(
    t => t.bucket_target === bucket || (includeAll && t.bucket_target === 'all')
  )
}

export function getTaskBucket(task, fallbackBucket) {
  if (task?.bucket_target && task.bucket_target !== 'all') return task.bucket_target
  return fallbackBucket || null
}

export function filterTasksForViewer(tasks, viewer, options = {}) {
  const { bucket, includeAll = true } = options
  const scoped = bucket ? filterTasksInBucket(tasks, bucket, { includeAll }) : tasks || []
  return scoped.filter(t => canViewerSeeTask(t, viewer))
}
