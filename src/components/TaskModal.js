import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import { formatDate } from '../lib/format'
import { tagCls } from '../constants/styles'

const TAG_LABELS = {
  other: 'Obecné',
  podcast: 'Podcast',
  research: 'Research',
  social: 'Social',
  event: 'Event',
}

function DetailRow({ label, children }) {
  if (!children) return null
  return (
    <div>
      <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase">{label}</div>
      <div className="text-[13px] font-medium mt-0.5 text-ctrl-text leading-relaxed">{children}</div>
    </div>
  )
}

export function TaskModal({ task, members, profile, onClose, onToggle }) {
  if (!task) return null

  const creator = members?.find(m => m.id === task.created_by)
  const completor = members?.find(m => m.id === task.completed_by)
  const canToggle = profile?.layer !== 'pozorovatel'
  const tagLabel = TAG_LABELS[task.tag] || task.tag

  const createdLabel = task.created_at
    ? new Date(task.created_at).toLocaleString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-[rgba(0,0,0,0.75)] backdrop-blur-sm max-[900px]:bottom-[70px]"
      onClick={onClose}
    >
      <div
        className="bg-ctrl-panel border border-ctrl-border rounded-lg w-full max-w-[480px] max-h-[85vh] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-5 border-b border-ctrl-border bg-gradient-to-b from-ctrl-panel2/40 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded bg-transparent border border-ctrl-border text-ctrl-text2 text-lg leading-none cursor-pointer transition-colors hover:border-ctrl-text2 hover:text-ctrl-text"
            aria-label="Zavřít"
          >
            ×
          </button>

          <div className="pr-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={cn(
                  'font-mono text-[9px] py-1 px-2.5 tracking-[1.5px] uppercase',
                  task.done
                    ? 'bg-[rgba(0,229,160,0.12)] text-ctrl-success'
                    : 'bg-[rgba(42,107,255,0.12)] text-ctrl-accent'
                )}
              >
                {task.done ? 'Splněno' : 'Otevřený'}
              </span>
              <span className={tagCls[task.tag] || tagCls.other}>{tagLabel}</span>
            </div>
            <h2
              className={cn(
                'font-sans text-xl font-bold leading-snug tracking-normal text-ctrl-text',
                task.done && 'line-through text-ctrl-text2'
              )}
            >
              {task.name}
            </h2>
            {task.bucket_target && task.bucket_target !== 'all' && (
              <p className="mt-2 text-[13px] text-ctrl-text2">{task.bucket_target}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          {task.description ? (
            <div className="mb-5">
              <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase mb-2">
                Popis
              </div>
              <p className="text-[14px] text-ctrl-text leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-ctrl-text3 italic mb-5">Bez popisu</p>
          )}

          <div className="py-4 px-4 bg-ctrl-bg2/60 border border-ctrl-border rounded-md flex flex-col gap-3.5">
            <DetailRow label="Přiřazeno">{task.assignee || '—'}</DetailRow>
            <DetailRow label="Termín">{task.due || '—'}</DetailRow>
            <div className="h-px bg-ctrl-border" />
            <DetailRow label="Vytvořeno">{createdLabel || '—'}</DetailRow>
            <DetailRow label="Vytvořil">{creator?.name || '—'}</DetailRow>
            {task.done && task.completed_at && (
              <>
                <div className="h-px bg-ctrl-border" />
                <DetailRow label="Splněno">
                  {formatDate(task.completed_at)}
                  {completor?.name && ` · ${completor.name}`}
                </DetailRow>
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-ctrl-border bg-ctrl-bg2/30 flex gap-2.5 justify-end">
          {canToggle && (
            <button
              type="button"
              className={cn(
                'border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200',
                task.done
                  ? 'bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text'
                  : 'bg-ctrl-success text-black hover:opacity-90'
              )}
              onClick={() => onToggle?.(task)}
            >
              {task.done ? 'OZNAČIT JAKO OTEVŘENÝ' : 'OZNAČIT JAKO SPLNĚNÝ'}
            </button>
          )}
          <button
            type="button"
            className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text"
            onClick={onClose}
          >
            ZAVŘÍT
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
