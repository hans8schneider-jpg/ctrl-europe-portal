import { createPortal } from 'react-dom'
import { cn, getInitials } from '../lib/utils'
import { bucketAvCls } from '../constants/buckets'
import { ROLE_LABELS } from '../constants/roles'

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
        if (diff < 1440) return `před ${Math.floor(diff/60)} hod`
        return `před ${Math.floor(diff/1440)} dny`
      })()
    : 'neznámo'

  const roleLabel = ROLE_LABELS[member.layer] || member.layer

  const isOnline = member.last_seen && (Date.now() - new Date(member.last_seen)) < 300000

  return createPortal(
    <div
      className="fixed top-[54px] left-[230px] right-0 bottom-0 z-[90] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.7)] backdrop-blur-sm max-[900px]:left-0 max-[900px]:top-[50px] max-[900px]:bottom-[70px]"
      onClick={onClose}
    >
      <div className="bg-ctrl-panel border border-ctrl-border rounded w-full max-w-[480px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="py-7 px-7 pb-5 border-b border-ctrl-border">
          <div className="flex items-center gap-4">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-extrabold font-mono shrink-0', bucketAvCls(member.bucket))}>
              {getInitials(member.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-extrabold mb-0.5">{member.name}</div>
              <div className="font-mono text-[10px] text-ctrl-accent tracking-[2px] uppercase mb-1">
                {roleLabel}
              </div>
              <div className="font-mono text-[10px] text-ctrl-text2 tracking-wide">
                {member.bucket}{member.secondary_bucket ? ` · ${member.secondary_bucket}` : ''}
              </div>
            </div>
            <button onClick={onClose} className="bg-transparent border-0 text-ctrl-text2 text-xl cursor-pointer p-1 hover:text-ctrl-text">×</button>
          </div>
        </div>

        <div className="py-4 px-7 border-b border-ctrl-border grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-[22px] font-extrabold text-ctrl-accent">{openTasks.length}</div>
            <div className="font-mono text-[9px] text-ctrl-text2 tracking-wide uppercase mt-0.5">otevřené úkoly</div>
          </div>
          <div className="text-center">
            <div className="text-[22px] font-extrabold">{doneTasks.length}</div>
            <div className="font-mono text-[9px] text-ctrl-text2 tracking-wide uppercase mt-0.5">splněno</div>
          </div>
          <div className="text-center">
            <div className={cn('text-[11px] font-semibold mt-1', isOnline ? 'text-[#4ade80]' : 'text-ctrl-text2')}>
              {lastSeen}
            </div>
            <div className="font-mono text-[9px] text-ctrl-text2 tracking-wide uppercase mt-0.5">naposledy online</div>
          </div>
        </div>

        {openTasks.length > 0 && (
          <div className="py-4 px-7 border-b border-ctrl-border">
            <div className="font-mono text-[10px] text-ctrl-text2 tracking-[2px] uppercase mb-2.5">
              Otevřené úkoly ({openTasks.length})
            </div>
            <div className="flex flex-col gap-1.5">
              {openTasks.slice(0, 5).map(t => (
                <div key={t.id} className="text-[13px] py-2 px-3 bg-ctrl-bg2 border-l-2 border-l-ctrl-accent rounded-sm">
                  {t.text}
                  {t.due_date && <span className="font-mono text-[10px] text-ctrl-text2 ml-2">{t.due_date}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {openTasks.length === 0 && (
          <div className="py-4 px-7 border-b border-ctrl-border">
            <div className="font-mono text-[10px] text-ctrl-text2 tracking-wide text-center">
              Žádné otevřené úkoly
            </div>
          </div>
        )}

        <div className="py-3 px-7">
          <div className="font-mono text-[9px] text-ctrl-text2 tracking-wide">
            Člen od: {member.created_at ? new Date(member.created_at).toLocaleDateString('cs-CZ') : 'neznámo'}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
