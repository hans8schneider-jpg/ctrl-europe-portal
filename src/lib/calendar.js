const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
]

export const WEEKDAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function formatMonthYear(year, month) {
  return `${MONTH_NAMES[month]} ${year}`
}

export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  )
}

/** Builds a month grid (Mon–Sun), including leading/trailing days from adjacent months. */
export function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstOfMonth.getDay() + 6) % 7

  const days = []

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month, -i),
      inMonth: false,
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: new Date(year, month, d),
      inMonth: true,
    })
  }

  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date
    days.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    })
  }

  while (days.length < 42) {
    const last = days[days.length - 1].date
    days.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    })
  }

  return days
}

export function groupEventsByDate(events) {
  const map = {}
  for (const event of events) {
    const key = event?.date
    if (!key) continue
    if (!map[key]) map[key] = []
    map[key].push(event)
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
  }
  return map
}
