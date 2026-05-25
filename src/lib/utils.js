import { parseTimestamp } from './format'

export const cn = (...parts) => parts.filter(Boolean).join(' ')

export const getInitials = (n) =>
  n ? n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() : '??'

/** Aktivní na portálu ≈ last_seen do 5 min (stejný práh všude v UI) */
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

export function getLastSeenElapsedMs(lastSeen) {
  const ms = parseTimestamp(lastSeen)
  if (ms == null) return null
  return Date.now() - ms
}

export function isUserOnline(lastSeen) {
  const elapsed = getLastSeenElapsedMs(lastSeen)
  return elapsed != null && elapsed >= 0 && elapsed < ONLINE_THRESHOLD_MS
}

/** Barva „naposledy aktivní“ v adminu — zelená jen při online na portálu */
export function getLastSeenKind(lastSeen) {
  if (!lastSeen) return 'never'
  const elapsed = getLastSeenElapsedMs(lastSeen)
  if (elapsed == null || elapsed < 0) return 'never'
  if (elapsed < ONLINE_THRESHOLD_MS) return 'good'
  if (elapsed < 86400000 * 3) return 'ok'
  if (elapsed < 86400000 * 7) return 'bad'
  return 'never'
}
