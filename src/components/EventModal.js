import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import { eventTypeCls } from '../constants/styles'
import { TextWithLinks } from './TextWithLinks'
import {
  downloadEventIcs,
  formatEventDateTimeLabel,
  getEventTypeLabel,
  getGoogleCalendarUrl,
} from '../lib/calendarExport'

export function EventModal({ event, onClose }) {
  if (!event) return null

  const typeLabel = getEventTypeLabel(event.type)
  const dateLabel = formatEventDateTimeLabel(event.date, event.time)
  const googleUrl = getGoogleCalendarUrl(event)
  const canAddToCalendar = Boolean(googleUrl)

  const openGoogleCalendar = () => {
    if (!googleUrl) return
    window.open(googleUrl, '_blank', 'noopener,noreferrer')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-[rgba(0,0,0,0.75)] backdrop-blur-sm max-[900px]:bottom-[70px]"
      onClick={onClose}
    >
      <div
        className="bg-ctrl-panel border border-ctrl-border rounded-lg w-full max-w-[480px] max-h-[85vh] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        <div className="relative px-6 pt-6 pb-5 border-b border-ctrl-border bg-gradient-to-b from-ctrl-panel2/40 to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded bg-transparent border border-ctrl-border text-ctrl-text2 text-lg leading-none cursor-pointer transition-colors hover:border-ctrl-text2 hover:text-ctrl-text"
            aria-label="Zavřít"
          >
            ×
          </button>

          <div className="pr-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={eventTypeCls[event.type] || eventTypeCls.event}>{typeLabel}</span>
            </div>
            <h2
              id="event-modal-title"
              className="font-sans text-xl font-bold leading-snug tracking-normal text-ctrl-text"
            >
              {event.title}
            </h2>
            <p className="mt-2 font-mono text-[13px] text-ctrl-accent tracking-wide">{dateLabel}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          {event.description ? (
            <div>
              <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase mb-2">
                Popis
              </div>
              <TextWithLinks
                text={event.description}
                className="text-[14px] text-ctrl-text leading-relaxed whitespace-pre-wrap"
              />
            </div>
          ) : (
            <p className="text-[13px] text-ctrl-text3 italic">Bez popisu</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-ctrl-border bg-ctrl-bg2/30 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
          {canAddToCalendar && (
            <>
              <button
                type="button"
                className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px"
                onClick={openGoogleCalendar}
              >
                Přidat do kalendáře
              </button>
              <button
                type="button"
                className={cn(
                  'border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200',
                  'bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text'
                )}
                onClick={() => downloadEventIcs(event)}
                title="Apple Calendar, Outlook a další"
              >
                Stáhnout .ics
              </button>
            </>
          )}
          <button
            type="button"
            className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text"
            onClick={onClose}
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
