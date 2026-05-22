import { cn } from '../../lib/utils'

export function Sec({ children, className = '' }) {
  return (
    <div className={cn('font-mono text-[9px] tracking-[3px] uppercase text-ctrl-text2 mb-3.5 flex items-center gap-2.5', className)}>
      <span className="shrink-0">{children}</span>
      <div className="flex-1 h-px bg-ctrl-border" />
    </div>
  )
}
