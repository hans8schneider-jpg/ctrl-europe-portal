import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn, getInitials, isUserOnline } from '../lib/utils'
import { bucketLeaderRingCls, bucketMemberAvCls } from '../constants/buckets'
import { StatusBadge } from './StatusBadge'

const isBucketLeader = (member, bucket) =>
  member.layer === 'vedouci' && member.bucket === bucket

const firstName = (name) => name?.trim().split(/\s+/)[0] || '—'

const sortMembers = (list, bucket) =>
  [...list].sort((a, b) => {
    const aLead = isBucketLeader(a, bucket)
    const bLead = isBucketLeader(b, bucket)
    if (aLead !== bLead) return Number(bLead) - Number(aLead)
    return a.name.localeCompare(b.name, 'cs')
  })

function MembersSheet({ members, bucket, onlineCount, onMemberClick, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[rgba(0,0,0,0.75)] backdrop-blur-sm max-[900px]:bottom-[70px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-ctrl-panel border border-ctrl-border border-b-0 animate-slide-up max-h-[min(70vh,28rem)] flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Členové buňky"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ctrl-border bg-ctrl-bg2/30 shrink-0">
          <span className="font-mono text-[10px] tracking-[2px] uppercase text-ctrl-text3">
            Členové
            <span className="ml-1.5 text-ctrl-text2 tabular-nums">{members.length}</span>
            <span className="mx-1.5 text-ctrl-text3/40">·</span>
            <span className={onlineCount > 0 ? 'text-ctrl-success' : 'text-ctrl-text3'}>
              {onlineCount} online
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-ctrl-text3 hover:text-ctrl-text transition-colors"
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto py-1">
          {members.map(m => {
            const online = isUserOnline(m.last_seen)
            const leader = isBucketLeader(m, bucket)
            return (
              <button
                key={m.id}
                type="button"
                className="w-full flex items-center gap-3 text-left px-4 py-2.5 hover:bg-[rgba(42,107,255,0.08)] transition-colors min-w-0"
                onClick={() => {
                  onClose()
                  onMemberClick(m)
                }}
              >
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      'w-8 h-8 flex items-center justify-center font-bold font-mono text-[9px] border',
                      bucketMemberAvCls(bucket),
                      leader && cn('border-[2px] border-solid', bucketLeaderRingCls(bucket))
                    )}
                  >
                    {getInitials(m.name)}
                  </div>
                  <StatusBadge
                    status={m.status}
                    isOnline={online}
                    className="absolute bottom-0 right-0"
                  />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-ctrl-text truncate">{m.name}</span>
                  <span className="block font-mono text-[8px] tracking-wide uppercase text-ctrl-text3 mt-0.5">
                    {leader ? 'Vedoucí' : 'Člen'}
                    {!online && ' · offline'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}

function MemberTile({ member, bucket, online, leader, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={member.name}
      className={cn(
        'group flex flex-col shrink-0 w-[4.5rem] cursor-pointer',
        'hover:bg-[rgba(42,107,255,0.06)] transition-colors duration-200',
        !online && 'opacity-40 hover:opacity-55'
      )}
    >
      <div className="relative flex items-center justify-center p-2.5 pb-2">
        <div
          className={cn(
            'w-9 h-9 flex items-center justify-center font-bold font-mono text-[10px] border',
            bucketMemberAvCls(bucket),
            leader && cn('border-[3px] border-solid', bucketLeaderRingCls(bucket))
          )}
        >
          {getInitials(member.name)}
        </div>
        <StatusBadge
          status={member.status}
          isOnline={online}
          className="absolute bottom-1.5 right-1.5"
        />
      </div>
      <div className="px-1 py-1.5 border-t border-ctrl-border/70 bg-ctrl-bg2/50">
        <span className="block font-mono text-[8px] text-center truncate uppercase tracking-[1px] text-ctrl-text2 group-hover:text-ctrl-text">
          {firstName(member.name)}
        </span>
      </div>
    </button>
  )
}

function BucketMemberStripMobile({ members, bucket, onMemberClick }) {
  const [open, setOpen] = useState(false)
  const sorted = sortMembers(members, bucket)
  const onlineCount = sorted.filter(m => isUserOnline(m.last_seen)).length

  if (sorted.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 font-mono text-[9px] tracking-[1.5px] uppercase text-ctrl-accent hover:text-ctrl-text border border-ctrl-border px-2.5 py-1.5 bg-ctrl-bg2/40 hover:bg-[rgba(42,107,255,0.08)] hover:border-ctrl-border2 transition-colors duration-200"
      >
        Zobrazit členy
      </button>
      {open && (
        <MembersSheet
          members={sorted}
          bucket={bucket}
          onlineCount={onlineCount}
          onMemberClick={onMemberClick}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function BucketMemberStripDesktop({ members, bucket, onMemberClick, max = 8 }) {
  const sorted = sortMembers(members, bucket)
  const visible = sorted.slice(0, max)
  const extra = Math.max(0, sorted.length - max)
  const onlineCount = sorted.filter(m => isUserOnline(m.last_seen)).length

  if (sorted.length === 0) return null

  return (
    <div className="border border-ctrl-border bg-ctrl-bg2/30">
      <div className="flex items-center justify-between gap-4 px-2.5 py-1 border-b border-ctrl-border bg-ctrl-panel2/25">
        <span className="font-mono text-[8px] tracking-[2px] uppercase text-ctrl-text3">
          Členové
        </span>
        <span className="font-mono text-[8px] tracking-[1.5px] uppercase tabular-nums">
          <span className={onlineCount > 0 ? 'text-ctrl-success' : 'text-ctrl-text3'}>
            {onlineCount} online
          </span>
          <span className="text-ctrl-text3/50"> · {sorted.length}</span>
        </span>
      </div>
      <div className="flex divide-x divide-ctrl-border">
        {visible.map(m => {
          const online = isUserOnline(m.last_seen)
          const leader = isBucketLeader(m, bucket)
          return (
            <MemberTile
              key={m.id}
              member={m}
              bucket={bucket}
              online={online}
              leader={leader}
              onClick={() => onMemberClick(m)}
            />
          )
        })}
        {extra > 0 && (
          <div
            className="flex flex-col items-center justify-center shrink-0 w-10 font-mono text-[9px] text-ctrl-text3 tabular-nums"
            title={`${extra} dalších členů`}
          >
            +{extra}
          </div>
        )}
      </div>
    </div>
  )
}

export function BucketMemberStrip({ members, bucket, onMemberClick, variant = 'auto', max = 8 }) {
  if (variant === 'mobile') {
    return (
      <div className="min-[901px]:hidden shrink-0">
        <BucketMemberStripMobile members={members} bucket={bucket} onMemberClick={onMemberClick} />
      </div>
    )
  }

  if (variant === 'desktop') {
    return (
      <div className="hidden min-[901px]:block shrink-0 min-w-0">
        <BucketMemberStripDesktop members={members} bucket={bucket} onMemberClick={onMemberClick} max={max} />
      </div>
    )
  }

  return (
    <>
      <div className="min-[901px]:hidden">
        <BucketMemberStripMobile members={members} bucket={bucket} onMemberClick={onMemberClick} />
      </div>
      <div className="hidden min-[901px]:block shrink-0 min-w-0">
        <BucketMemberStripDesktop members={members} bucket={bucket} onMemberClick={onMemberClick} max={max} />
      </div>
    </>
  )
}
