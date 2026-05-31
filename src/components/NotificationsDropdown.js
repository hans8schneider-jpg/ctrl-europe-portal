import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { formatTime } from '../lib/format'
import { TextWithLinks } from './TextWithLinks'
import { bucketPath } from '../lib/bucketSlug'
import { IconBell } from './icons/NavIcons'

function notificationPath(notification) {
  switch (notification.type) {
    case 'task':
    case 'mention':
      return notification.bucket_target ? bucketPath(notification.bucket_target) : '/'
    case 'news':
    case 'event':
    default:
      return '/'
  }
}

export function NotificationsDropdown({ notifications = [], onMarkAllRead }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const markedOnOpenRef = useRef(false)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!open) {
      markedOnOpenRef.current = false
      return
    }
    if (markedOnOpenRef.current) return
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (ids.length === 0) return
    markedOnOpenRef.current = true
    onMarkAllRead?.(ids)
  }, [open, notifications, onMarkAllRead])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleNotificationClick = (notification) => {
    setOpen(false)
    navigate(notificationPath(notification))
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={cn(
          'relative flex items-center justify-center w-9 h-9 bg-transparent border border-ctrl-border text-ctrl-text2 cursor-pointer transition-all duration-200 hover:text-ctrl-text hover:border-ctrl-text2 hover:bg-[rgba(42,107,255,0.05)]',
          open && 'text-ctrl-accent border-ctrl-accent bg-[rgba(42,107,255,0.1)]'
        )}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Oznámení"
      >
        <IconBell className="w-[17px] h-[17px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-ctrl-danger text-white text-[8px] min-w-[15px] h-[15px] flex items-center justify-center rounded-full font-mono animate-badge-pop">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] w-[min(320px,calc(100vw-2rem))] bg-ctrl-panel border border-ctrl-border shadow-[0_8px_32px_rgba(0,0,0,0.45)] z-[150] animate-fade-in"
          role="menu"
        >
          <div className="py-3 px-4 border-b border-ctrl-border flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] tracking-[3px] uppercase text-ctrl-text2">Oznámení</span>
            {unreadCount > 0 && (
              <span className="text-[9px] py-0.5 px-2 font-mono tracking-wide bg-ctrl-accent text-white">
                {unreadCount} nových
              </span>
            )}
          </div>

          <div className="max-h-[min(360px,50vh)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <IconBell className="w-8 h-8 mx-auto mb-2 text-ctrl-text3 opacity-50" />
                <p className="text-ctrl-text2 text-xs">Žádná oznámení</p>
                <p className="text-ctrl-text3 text-[10px] mt-1 font-mono">Nové úkoly a další upozornění se zobrazí zde.</p>
              </div>
            ) : (
              <ul className="py-1">
                {notifications.map(n => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full text-left py-3 px-4 border-0 bg-transparent cursor-pointer font-sans text-[13px] transition-colors duration-150 hover:bg-[rgba(42,107,255,0.05)]',
                        !n.read && 'bg-[rgba(42,107,255,0.06)]'
                      )}
                      onClick={() => handleNotificationClick(n)}
                    >
                      {n.title && <div className="font-semibold text-ctrl-text mb-0.5">{n.title}</div>}
                      {n.body && <TextWithLinks text={n.body} className="text-ctrl-text2 text-xs leading-relaxed line-clamp-2" />}
                      <div className="text-ctrl-text3 text-[10px] font-mono mt-1 tracking-wide">
                        {formatTime(n.created_at)}
                        {n.bucket_target && ` · ${n.bucket_target}`}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
