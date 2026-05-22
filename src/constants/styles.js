import { cn } from '../lib/utils'

export const tagCls = {
  podcast: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-[rgba(180,79,255,0.12)] text-[#b44fff]'),
  research: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-[rgba(0,229,160,0.1)] text-ctrl-success'),
  social: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-[rgba(255,184,0,0.1)] text-ctrl-warning'),
  event: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-[rgba(255,51,102,0.1)] text-ctrl-danger'),
  other: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-ctrl-panel2 text-ctrl-text2'),
}

export const eventTypeCls = {
  event: cn('font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase shrink-0', 'bg-[rgba(42,107,255,0.12)] text-ctrl-accent'),
  deadline: cn('font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase shrink-0', 'bg-[rgba(255,51,102,0.1)] text-ctrl-danger'),
  meeting: cn('font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase shrink-0', 'bg-[rgba(0,229,160,0.1)] text-ctrl-success'),
}

export const lastSeenCls = (kind) => ({
  good: 'text-ctrl-success',
  ok: 'text-ctrl-warning',
  bad: 'text-ctrl-danger',
  never: 'text-ctrl-text3',
}[kind] || 'text-ctrl-text3')

export const newsDotCls = (type) => ({
  warn: 'bg-ctrl-warning',
  ok: 'bg-ctrl-success',
  accent: 'bg-ctrl-accent',
}[type] || 'bg-ctrl-accent')

export const STATUS_OPT_CLS = {
  active: 'text-ctrl-success border-ctrl-success',
  away: 'text-ctrl-warning border-ctrl-warning',
  needs_help: 'text-ctrl-danger border-ctrl-danger',
}
