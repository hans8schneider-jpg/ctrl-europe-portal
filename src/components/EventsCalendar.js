import { useMemo, useState } from 'react'
import { cn } from '../lib/utils'
import {
  formatMonthYear,
  getMonthGrid,
  groupEventsByDate,
  isSameDay,
  toDateKey,
  WEEKDAY_LABELS,
} from '../lib/calendar'

const eventChipCls = {
  event: 'bg-[rgba(42,107,255,0.18)] text-ctrl-accent border-[rgba(42,107,255,0.35)]',
  deadline: 'bg-[rgba(255,51,102,0.15)] text-ctrl-danger border-[rgba(255,51,102,0.35)]',
  meeting: 'bg-[rgba(0,229,160,0.12)] text-ctrl-success border-[rgba(0,229,160,0.3)]',
}

const MAX_VISIBLE_EVENTS = 2

export function EventsCalendar({ events, onSelectEvent, className }) {
  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events])
  const monthDays = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

  const goToMonth = (year, month) => {
    setViewYear(year)
    setViewMonth(month)
  }

  const goPrevMonth = () => {
    if (viewMonth === 0) goToMonth(viewYear - 1, 11)
    else goToMonth(viewYear, viewMonth - 1)
  }

  const goNextMonth = () => {
    if (viewMonth === 11) goToMonth(viewYear + 1, 0)
    else goToMonth(viewYear, viewMonth + 1)
  }

  const goToday = () => {
    goToMonth(today.getFullYear(), today.getMonth())
  }

  return (
    <div className={cn('bg-ctrl-panel border border-ctrl-border', className)}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ctrl-border max-[900px]:px-3">
        <button
          type="button"
          onClick={goPrevMonth}
          className="w-8 h-8 shrink-0 border border-ctrl-border bg-ctrl-bg2 text-ctrl-text2 text-lg leading-none cursor-pointer transition-colors hover:border-ctrl-border2 hover:text-ctrl-text"
          aria-label="Předchozí měsíc"
        >
          ‹
        </button>

        <div className="min-w-0 text-center">
          <div className="font-sans text-[15px] font-bold text-ctrl-text max-[900px]:text-sm">
            {formatMonthYear(viewYear, viewMonth)}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={goToday}
            className="border-0 py-1.5 px-2.5 text-[9px] font-bold tracking-[1.5px] uppercase cursor-pointer font-mono transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text max-[900px]:hidden"
          >
            Dnes
          </button>
          <button
            type="button"
            onClick={goNextMonth}
            className="w-8 h-8 shrink-0 border border-ctrl-border bg-ctrl-bg2 text-ctrl-text2 text-lg leading-none cursor-pointer transition-colors hover:border-ctrl-border2 hover:text-ctrl-text"
            aria-label="Další měsíc"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-ctrl-border bg-ctrl-bg2/40">
        {WEEKDAY_LABELS.map(label => (
          <div
            key={label}
            className="py-2 text-center font-mono text-[9px] tracking-[1.5px] uppercase text-ctrl-text3 max-[900px]:py-1.5 max-[900px]:text-[8px]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthDays.map(({ date, inMonth }) => {
          const dateKey = toDateKey(date)
          const dayEvents = eventsByDate[dateKey] || []
          const isToday = isSameDay(date, today)
          const hiddenCount = Math.max(0, dayEvents.length - MAX_VISIBLE_EVENTS)
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS)

          return (
            <div
              key={dateKey}
              className={cn(
                'min-h-[88px] border-r border-b border-ctrl-border p-1.5 flex flex-col gap-1 transition-colors max-[900px]:min-h-[72px] max-[900px]:p-1',
                !inMonth && 'bg-ctrl-bg2/20',
                inMonth && 'bg-ctrl-panel',
                isToday && 'bg-[rgba(42,107,255,0.06)]'
              )}
            >
              <div className="flex justify-end">
                <span
                  className={cn(
                    'font-mono text-[11px] leading-none w-6 h-6 flex items-center justify-center max-[900px]:text-[10px] max-[900px]:w-5 max-[900px]:h-5',
                    !inMonth && 'text-ctrl-text3',
                    inMonth && !isToday && 'text-ctrl-text2',
                    isToday && 'bg-ctrl-accent text-white font-bold'
                  )}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 min-h-0 flex-1">
                {visibleEvents.map(event => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={cn(
                      'w-full text-left border rounded-sm px-1 py-0.5 truncate font-sans text-[10px] leading-tight cursor-pointer transition-opacity hover:opacity-80 max-[900px]:text-[9px]',
                      eventChipCls[event.type] || eventChipCls.event
                    )}
                    title={[event.title, event.time].filter(Boolean).join(' · ')}
                  >
                    {event.time && (
                      <span className="font-mono text-[8px] opacity-80 mr-0.5 max-[900px]:hidden">
                        {event.time.slice(0, 5)}
                      </span>
                    )}
                    {event.title}
                  </button>
                ))}
                {hiddenCount > 0 && (
                  <div className="font-mono text-[8px] text-ctrl-text3 px-0.5">
                    +{hiddenCount} další
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {events.length === 0 && (
        <div className="px-4 py-3 border-t border-ctrl-border text-ctrl-text2 text-xs">
          Žádné nadcházející akce.
        </div>
      )}
    </div>
  )
}
