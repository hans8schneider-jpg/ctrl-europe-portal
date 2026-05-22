export const STATUS_CONFIG = {
  active: { label: 'K dispozici', textCls: 'text-ctrl-success' },
  away: { label: 'Zaneprázdněn', textCls: 'text-ctrl-warning' },
  needs_help: { label: 'Potřebuji pomoc', textCls: 'text-ctrl-danger' },
}

export function getStatusMeta(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.active
}
