import { cn } from '../lib/utils'
import { STATUS_BADGE_CLS } from '../constants/styles'

const SIZE_CLS = {
  sm: 'w-[9px] h-[9px] border-2 border-ctrl-bg',
  lg: 'w-3 h-3 border-2 border-ctrl-panel',
}

export function StatusBadge({ status = 'active', isOnline = true, size = 'sm', className }) {
  const badgeCls = isOnline
    ? (STATUS_BADGE_CLS[status] || STATUS_BADGE_CLS.active)
    : 'bg-ctrl-text3'

  return (
    <span
      className={cn('shrink-0', SIZE_CLS[size], badgeCls, className)}
      aria-hidden
    />
  )
}
