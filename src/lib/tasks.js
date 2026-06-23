import { DEVELOPERS_BUCKET, canAddTasks, getEffectiveLayer, isAdmin } from './permissions'

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

/** Přijímá profil nebo string layer (zpětná kompatibilita). */
export const canManageTasks = (profileOrLayer, bucket = null) =>
  canAddTasks(profileOrLayer, bucket)

/** Je member vedoucí dané buňky? Kontroluje přes memberships. */
const isBucketLeader = (member, bucket) =>
  (member.memberships ?? []).some(m => m.bucket === bucket && m.layer === 'vedouci')

export function getBucketMembers(members, bucket) {
  if (!bucket || bucket === 'all') return members || []
  if (bucket === DEVELOPERS_BUCKET) {
    return (members || []).filter(m => {
      const layer = getEffectiveLayer(m)
      if (layer === 'developer') return true
      return (m.memberships ?? []).some(mm => mm.bucket === bucket)
    })
  }
  return (members || []).filter(
    m => (m.memberships ?? []).some(mm => mm.bucket === bucket)
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

/** Je profil vedoucí dané buňky? Kontroluje přes memberships. */
export function isVedouciOfBucket(profile, bucket) {
  if (!profile || !bucket || bucket === 'all') return false
  if (isAdmin(getEffectiveLayer(profile))) return false
  return (profile.memberships ?? []).some(
    m => m.bucket === bucket && m.layer === 'vedouci'
  )
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
  if (isAdmin(getEffectiveLayer(viewer))) return true
  if (isTaskAssignee(task, viewer)) return true
  if (isVedouciOfBucket(viewer, task.bucket_target)) return true
  if (getEffectiveLayer(viewer) === 'developer' && task.bucket_target === DEVELOPERS_BUCKET) return true
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

/** Volný štítek — prázdný / „other" se neukazuje. */
export function normalizeTaskTag(tag) {
  if (tag == null) return null
  const t = String(tag).trim()
  if (!t || t === 'other') return null
  return t
}

export function filterTasksForViewer(tasks, viewer, options = {}) {
  const { bucket, includeAll = true } = options
  const scoped = bucket ? filterTasksInBucket(tasks, bucket, { includeAll }) : tasks || []
  return scoped.filter(t => canViewerSeeTask(t, viewer))
}
