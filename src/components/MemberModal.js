import { createPortal } from 'react-dom'
import { cn, getInitials } from '../lib/utils'
import { bucketAvCls } from '../constants/buckets'
import { ROLE_LABELS, roleBadgeCls } from '../constants/roles'

export function MemberModal({ member, tasks, onClose }) {
  if (!member) return null
  const memberTasks = tasks.filter(t => t.created_by === member.id || t.completed_by === member.id)
  const openTasks = memberTasks.filter(t => !t.done)
  const doneTasks = memberTasks.filter(t => t.done)

  const lastSeen = member.last_seen
    ? (() => {
        const d = new Date(member.last_seen)
        const diff = Math.floor((Date.now() - d) / 60000)
        if (diff < 2) return 'právě online'
        if (diff < 60) return `před ${diff} min`
        if (diff < 1440) return `před ${Math.floor(diff / 60)} hod`
        return `před ${Math.floor(diff / 1440)} dny`
      })()
    : 'neznámo'

  const roleLabel = ROLE_LABELS[member.layer] || member.layer
  const isOnline = member.last_seen && (Date.now() - new Date(member.last_seen)) < 300000
  const buckets = [member.bucket, member.secondary_bucket].filter(Boolean).join(' · ')

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-[rgba(0,0,0,0.75)] backdrop-blur-sm max-[900px]:bottom-[70px]"
      onClick={onClose}
    >
      <div
        className="bg-ctrl-panel border border-ctrl-border rounded-lg w-full max-w-[440px] max-h-[85vh] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-ctrl-border bg-gradient-to-b from-ctrl-panel2/40 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded bg-transparent border border-ctrl-border text-ctrl-text2 text-lg leading-none cursor-pointer transition-colors hover:border-ctrl-text2 hover:text-ctrl-text"
            aria-label="Zavřít"
          >
            ×
          </button>

          <div className="flex items-start gap-4 pr-8">
            <div className="relative shrink-0">
              <div
                className={cn(
                  'w-[72px] h-[72px] rounded-full flex items-center justify-center text-xl font-bold font-mono',
                  bucketAvCls(member.bucket)
                )}
              >
                {getInitials(member.name)}
              </div>
              {isOnline && (
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-ctrl-success border-2 border-ctrl-panel shadow-[0_0_8px_#00e5a0]" />
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h2 className="font-sans text-xl font-bold leading-snug tracking-normal text-ctrl-text mb-1.5">
                {member.name}
              </h2>
              <span
                className={cn(
                  'inline-block font-mono text-[9px] py-1 px-2.5 tracking-[1.5px] uppercase',
                  roleBadgeCls(member.layer)
                )}
              >
                {roleLabel}
              </span>
              {buckets && (
                <p className="mt-2.5 text-[13px] text-ctrl-text2 leading-relaxed">{buckets}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-4 border-b border-ctrl-border">
          {/* Task stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-ctrl-bg2 border border-ctrl-border rounded-md py-3.5 px-2 text-center">
              <div className="font-mono text-[28px] font-bold leading-none text-ctrl-accent mb-1.5">
                {openTasks.length}
              </div>
              <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase">
                otevřené úkoly
              </div>
            </div>
            <div className="bg-ctrl-bg2 border border-ctrl-border rounded-md py-3.5 px-2 text-center">
              <div className="font-mono text-[28px] font-bold leading-none text-ctrl-success mb-1.5">
                {doneTasks.length}
              </div>
              <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase">
                splněno
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="mt-3 py-3 px-4 bg-ctrl-bg2/60 border border-ctrl-border rounded-md flex items-center gap-3">
            <div
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                isOnline ? 'bg-ctrl-success shadow-[0_0_8px_#00e5a0]' : 'bg-ctrl-text3'
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase">
                Naposledy online
              </div>
              <div
                className={cn(
                  'text-[13px] font-medium mt-0.5',
                  isOnline ? 'text-ctrl-success' : 'text-ctrl-text'
                )}
              >
                {lastSeen}
              </div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {openTasks.length > 0 ? (
            <div className="px-6 py-4">
              <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase mb-3">
                Otevřené úkoly ({openTasks.length})
              </div>
              <div className="flex flex-col gap-2">
                {openTasks.slice(0, 5).map(t => (
                  <div
                    key={t.id}
                    className="text-[13px] py-2.5 px-3.5 bg-ctrl-bg2 border-l-2 border-l-ctrl-accent rounded-r-md leading-snug"
                  >
                    {t.text}
                    {t.due_date && (
                      <span className="font-mono text-[10px] text-ctrl-text2 ml-2">{t.due_date}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-[13px] text-ctrl-text2">Žádné otevřené úkoly</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-ctrl-border bg-ctrl-bg2/30">
          <p className="font-mono text-[9px] text-ctrl-text3 tracking-wide">
            Člen od{' '}
            {member.created_at
              ? new Date(member.created_at).toLocaleDateString('cs-CZ')
              : 'neznámo'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
