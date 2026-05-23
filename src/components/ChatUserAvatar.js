import { cn } from '../lib/utils'
import { StatusBadge } from './StatusBadge'

export function ChatUserAvatar({ initials, isOwn, status = 'active', isOnline = true, onClick }) {
  return (
    <div className="relative w-[30px] h-[30px] shrink-0">
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e) } } : undefined}
        className={cn(
          'w-full h-full flex items-center justify-center text-[11px] font-bold font-mono border',
          isOwn
            ? 'bg-ctrl-accent text-white border-ctrl-accent'
            : 'bg-ctrl-panel3 text-ctrl-text2 border-ctrl-border',
          onClick && 'cursor-pointer transition-opacity hover:opacity-80'
        )}
      >
        {initials}
      </div>
      <StatusBadge
        status={status}
        isOnline={isOnline}
        className="absolute -bottom-px -right-px"
      />
    </div>
  )
}
