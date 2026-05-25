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

function MemberTile({ member, bucket, online, leader, onClick, compact }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={member.name}
      className={cn(
        'group flex flex-col shrink-0 cursor-pointer',
        'hover:bg-[rgba(42,107,255,0.06)] transition-colors duration-200',
        !online && 'opacity-40 hover:opacity-55',
        compact ? 'w-[2.75rem]' : 'w-[4.5rem]'
      )}
    >
      <div
        className={cn(
          'relative flex items-center justify-center',
          compact ? 'p-1.5 pb-1' : 'p-2.5 pb-2'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center font-bold font-mono border',
            compact ? 'w-7 h-7 text-[9px]' : 'w-9 h-9 text-[10px]',
            bucketMemberAvCls(bucket),
            leader && cn('border-[3px] border-solid', bucketLeaderRingCls(bucket))
          )}
        >
          {getInitials(member.name)}
        </div>
        <StatusBadge
          status={member.status}
          isOnline={online}
          className={compact ? 'absolute bottom-0.5 right-0.5' : 'absolute bottom-1.5 right-1.5'}
        />
      </div>
      {!compact && (
        <div className="px-1 py-1.5 border-t border-ctrl-border/70 bg-ctrl-bg2/50">
          <span className="block font-mono text-[8px] text-center truncate uppercase tracking-[1px] text-ctrl-text2 group-hover:text-ctrl-text">
            {firstName(member.name)}
          </span>
        </div>
      )}
    </button>
  )
}

export function BucketMemberStrip({ members, bucket, onMemberClick, max = 8 }) {
  const sorted = sortMembers(members, bucket)
  const visible = sorted.slice(0, max)
  const extra = Math.max(0, sorted.length - max)
  const onlineCount = sorted.filter(m => isUserOnline(m.last_seen)).length

  if (sorted.length === 0) return null

  const tiles = visible.map(m => {
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
  })

  const compactTiles = visible.map(m => {
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
        compact
      />
    )
  })

  const onlineLabel = (
    <span className="font-mono text-[8px] tracking-[1.5px] uppercase tabular-nums whitespace-nowrap">
      <span className={onlineCount > 0 ? 'text-ctrl-success' : 'text-ctrl-text3'}>
        {onlineCount} online
      </span>
    </span>
  )

  return (
    <>
      {/* Mobil — kompaktní pruh v řádku s názvem buňky */}
      <div className="min-[901px]:hidden shrink-0 flex flex-col items-end gap-1 max-w-[min(52vw,13.5rem)]">
        {onlineLabel}
        <div className="flex border border-ctrl-border bg-ctrl-bg2/30 overflow-x-auto scrollbar-none">
          <div className="flex divide-x divide-ctrl-border">
            {compactTiles}
            {extra > 0 && (
              <div
                className="flex items-center justify-center shrink-0 w-8 font-mono text-[9px] text-ctrl-text3 tabular-nums"
                title={`${extra} dalších členů`}
              >
                +{extra}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PC — plný roster panel */}
      <div className="hidden min-[901px]:block ml-auto shrink-0 min-w-0">
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
            {tiles}
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
      </div>
    </>
  )
}
