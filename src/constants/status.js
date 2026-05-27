export const STATUS_CONFIG = {
  active: { label: 'K dispozici', hint: 'Jsem k dispozici pro tým', textCls: 'text-ctrl-success' },
  away: { label: 'Zaneprázdněn', hint: 'Odpovím, až budu moct', textCls: 'text-ctrl-warning' },
  needs_help: { label: 'Potřebuji pomoc', hint: 'Ostatní uvidí výzvu k pomoci', textCls: 'text-ctrl-danger' },
}

export function getStatusMeta(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.active
}
