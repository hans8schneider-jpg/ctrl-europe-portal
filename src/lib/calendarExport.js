const EVENT_TYPE_LABELS = {
  event: 'Akce',
  deadline: 'Deadline',
  meeting: 'Schůzka',
}

export function getEventTypeLabel(type) {
  return EVENT_TYPE_LABELS[type] || 'Akce'
}

/** Parses portal event date (YYYY-MM-DD) and optional time (HH:mm). */
export function parseEventDateTime(date, time) {
  if (!date) return null
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return null

  if (!time) {
    const start = new Date(y, m - 1, d)
    const end = new Date(y, m - 1, d + 1)
    return { start, end, allDay: true }
  }

  const [h, mi] = time.split(':').map(Number)
  const start = new Date(y, m - 1, d, h || 0, mi || 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return { start, end, allDay: false }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatGoogleDate(date, allDay) {
  const y = date.getFullYear()
  const mo = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  if (allDay) return `${y}${mo}${d}`
  return `${y}${mo}${d}T${pad2(date.getHours())}${pad2(date.getMinutes())}00`
}

function formatIcsDate(date, allDay) {
  const y = date.getFullYear()
  const mo = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  if (allDay) return `${y}${mo}${d}`
  return `${y}${mo}${d}T${pad2(date.getHours())}${pad2(date.getMinutes())}00`
}

function escapeIcs(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function formatEventDateTimeLabel(date, time) {
  if (!date) return '—'
  const [y, mo, d] = date.split('-')
  const base = `${Number(d)}. ${Number(mo)}. ${y}`
  return time ? `${base} · ${time}` : base
}

export function getGoogleCalendarUrl(event) {
  const dt = parseEventDateTime(event.date, event.time)
  if (!dt) return null

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'Akce',
    details: [event.description, `Typ: ${getEventTypeLabel(event.type)}`].filter(Boolean).join('\n\n'),
  })

  if (dt.allDay) {
    params.set('dates', `${formatGoogleDate(dt.start, true)}/${formatGoogleDate(dt.end, true)}`)
  } else {
    params.set('dates', `${formatGoogleDate(dt.start, false)}/${formatGoogleDate(dt.end, false)}`)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function downloadEventIcs(event) {
  const dt = parseEventDateTime(event.date, event.time)
  if (!dt) return

  const uid = `ctrl-event-${event.id || event.title}-${event.date}@ctrl-europe`
  const now = formatIcsDate(new Date(), false)
  const dtStart = dt.allDay
    ? `DTSTART;VALUE=DATE:${formatIcsDate(dt.start, true)}`
    : `DTSTART:${formatIcsDate(dt.start, false)}`
  const dtEnd = dt.allDay
    ? `DTEND;VALUE=DATE:${formatIcsDate(dt.end, true)}`
    : `DTEND:${formatIcsDate(dt.end, false)}`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CTRL Europe Portal//CS',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStart,
    dtEnd,
    `SUMMARY:${escapeIcs(event.title || 'Akce')}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(event.title || 'akce').replace(/[^\w\d-]+/gi, '-').slice(0, 40)}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
