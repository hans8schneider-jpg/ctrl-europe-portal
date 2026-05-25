const PG_TIMESTAMP_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?/

/** All plausible interpretations of a Supabase/Postgres timestamp (ms). */
export function parseTimestampCandidates(ts) {
  if (ts == null || ts === '') return []
  if (ts instanceof Date) {
    const t = ts.getTime()
    return Number.isNaN(t) ? [] : [t]
  }
  if (typeof ts === 'number' && !Number.isNaN(ts)) {
    return [ts < 1e12 ? ts * 1000 : ts]
  }

  const s = String(ts).trim()
  const out = []
  const m = s.match(PG_TIMESTAMP_RE)
  if (m) {
    const frac = m[7] ? parseInt(m[7].slice(0, 3).padEnd(3, '0'), 10) : 0
    if (!m[8]) {
      const y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], se = +m[6]
      const localMs = new Date(y, mo - 1, d, h, mi, se, frac).getTime()
      const fracStr = String(frac).padStart(3, '0')
      const utcMs = new Date(
        `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.${fracStr}Z`
      ).getTime()
      if (!Number.isNaN(localMs)) out.push(localMs)
      if (!Number.isNaN(utcMs)) out.push(utcMs)
    } else {
      let iso = s.includes(' ') ? s.replace(' ', 'T') : s
      iso = iso.replace(/(\.\d{3})\d+/, '$1')
      const t = new Date(iso).getTime()
      if (!Number.isNaN(t)) out.push(t)
    }
    return out
  }

  let iso = s.includes(' ') ? s.replace(' ', 'T') : s
  iso = iso.replace(/(\.\d{3})\d+/, '$1')
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? [] : [t]
}

/** Parses Supabase/Postgres timestamps reliably across browsers. */
export function parseTimestamp(ts) {
  const candidates = parseTimestampCandidates(ts)
  if (!candidates.length) return null

  const now = Date.now()
  const scored = candidates
    .map(t => ({ t, elapsed: now - t }))
    .filter(x => x.elapsed >= -60_000)
    .sort((a, b) => a.elapsed - b.elapsed)

  if (scored.length) return scored[0].t
  return candidates[0]
}

export const formatTime = (ts) => {
  if (!ts) return 'Nikdy'
  const ms = parseTimestamp(ts)
  const d = ms != null ? new Date(ms) : new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Právě teď'
  if (diff < 3600000) return `Před ${Math.floor(diff / 60000)} min`
  if (diff < 86400000) return `Před ${Math.floor(diff / 3600000)} hod`
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

export const formatDate = (ts) => {
  if (!ts) return ''
  const ms = parseTimestamp(ts)
  const d = ms != null ? new Date(ms) : new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()}. ${d.getMonth() + 1}. · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Čas u zprávy v chatu — po úpravě zobrazí „upraveno v …“. */
export function formatMessageTimestamp(message) {
  if (message?.updated_at) {
    const label = formatDate(message.updated_at)
    return label ? `upraveno v ${label}` : ''
  }
  return formatDate(message?.created_at)
}
