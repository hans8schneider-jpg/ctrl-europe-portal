export const cn = (...parts) => parts.filter(Boolean).join(' ')

export const getInitials = (n) =>
  n ? n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() : '??'

/** Stejný práh jako MemberModal — aktivní na webu ≈ last_seen do 5 min */
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

export function isUserOnline(lastSeen) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS
}
