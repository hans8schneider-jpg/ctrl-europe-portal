export const formatTime = (ts) => {
  if (!ts) return 'Nikdy'
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Právě teď'
  if (diff < 3600000) return `Před ${Math.floor(diff / 60000)} min`
  if (diff < 86400000) return `Před ${Math.floor(diff / 3600000)} hod`
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

export const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getDate()}. ${d.getMonth() + 1}. · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
