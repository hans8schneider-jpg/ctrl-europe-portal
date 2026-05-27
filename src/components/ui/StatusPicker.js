import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { STATUS_CONFIG } from '../../constants/status'

function StatusDot({ status, className }) {
  return (
    <span
      className={cn(
        'w-[7px] h-[7px] rounded-full shrink-0',
        status === 'active' && 'bg-ctrl-success shadow-[0_0_6px_#00e5a0]',
        status === 'away' && 'bg-ctrl-warning',
        status === 'needs_help' && 'bg-ctrl-danger animate-pulse',
        className
      )}
      aria-hidden
    />
  )
}

export function StatusPicker({ value, onChange, disabled = false, className }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const listId = useId()
  const current = STATUS_CONFIG[value] || STATUS_CONFIG.active

  useEffect(() => {
    if (!open) return
    const onPointerDown = e => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = e => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const pick = key => {
    if (key === value) {
      setOpen(false)
      return
    }
    onChange(key)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          'w-full flex items-center gap-2.5 py-2.5 px-3 bg-ctrl-bg2 border border-ctrl-border text-ctrl-text text-left transition-all duration-200',
          'hover:border-ctrl-border2 disabled:opacity-50 disabled:cursor-not-allowed',
          open && 'border-ctrl-accent shadow-[0_0_0_2px_rgba(42,107,255,0.1)]'
        )}
        onClick={() => !disabled && setOpen(o => !o)}
      >
        <StatusDot status={value} />
        <span className={cn('flex-1 min-w-0 text-[13px] font-medium truncate', current.textCls)}>
          {current.label}
        </span>
        <span
          className={cn(
            'font-mono text-[10px] text-ctrl-text2 transition-transform duration-200 shrink-0',
            open && 'rotate-180'
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Stav"
          className="absolute z-30 left-0 right-0 top-[calc(100%+4px)] bg-ctrl-panel border border-ctrl-border shadow-[0_12px_40px_rgba(0,0,0,0.45)] animate-fade-in overflow-hidden"
        >
          {Object.entries(STATUS_CONFIG).map(([key, opt]) => {
            const selected = key === value
            return (
              <li key={key} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-start gap-2.5 py-2.5 px-3 text-left border-0 bg-transparent cursor-pointer transition-colors duration-150',
                    'hover:bg-[rgba(42,107,255,0.06)]',
                    selected && 'bg-[rgba(42,107,255,0.08)]'
                  )}
                  onClick={() => pick(key)}
                >
                  <StatusDot status={key} className="mt-1.5" />
                  <span className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'block text-[13px] font-medium',
                        selected ? opt.textCls : 'text-ctrl-text'
                      )}
                    >
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span className="block font-mono text-[9px] text-ctrl-text2 tracking-wide mt-0.5 leading-snug">
                        {opt.hint}
                      </span>
                    )}
                  </span>
                  {selected && (
                    <span className={cn('font-mono text-[10px] shrink-0 mt-0.5', opt.textCls)} aria-hidden>
                      ✓
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
