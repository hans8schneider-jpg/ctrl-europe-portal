import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import { STATUS_CONFIG } from '../../constants/status'

const MENU_GAP = 4
const VIEWPORT_PAD = 8

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
  const [menuStyle, setMenuStyle] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const listId = useId()
  const current = STATUS_CONFIG[value] || STATUS_CONFIG.active

  const updateMenuPosition = () => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return

    const rect = trigger.getBoundingClientRect()
    const menuHeight = menu.offsetHeight
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PAD
    const spaceAbove = rect.top - VIEWPORT_PAD
    const openUp = spaceBelow < menuHeight + MENU_GAP && spaceAbove >= spaceBelow

    let top
    if (openUp) {
      top = Math.max(VIEWPORT_PAD, rect.top - menuHeight - MENU_GAP)
    } else {
      top = Math.min(
        window.innerHeight - menuHeight - VIEWPORT_PAD,
        rect.bottom + MENU_GAP
      )
    }

    setMenuStyle({
      top,
      left: rect.left,
      width: rect.width,
    })
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null)
      return
    }
    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const onPointerDown = e => {
      const t = triggerRef.current
      const m = menuRef.current
      if (t?.contains(e.target) || m?.contains(e.target)) return
      setOpen(false)
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

  const menu = open && (
    <ul
      ref={menuRef}
      id={listId}
      role="listbox"
      aria-label="Stav"
      style={
        menuStyle
          ? {
              position: 'fixed',
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: 350,
            }
          : { position: 'fixed', left: -9999, top: -9999, visibility: 'hidden', zIndex: 350 }
      }
      className="bg-ctrl-panel border border-ctrl-border shadow-[0_12px_40px_rgba(0,0,0,0.45)] animate-fade-in"
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
  )

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
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

      {menu && createPortal(menu, document.body)}
    </div>
  )
}
