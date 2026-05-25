import { createPortal } from 'react-dom'
import { cn, getInitials, isUserOnline } from '../lib/utils'
import { StatusBadge } from './StatusBadge'
import { bucketAvCls, bucketOrganBadgeCls } from '../constants/buckets'
import { ROLE_LABELS, roleBadgeCls } from '../constants/roles'
import { getStatusMeta } from '../constants/status'
import { getMemberBucketsForDisplay } from '../lib/permissions'
import { useAppData } from '../context/AppDataContext'

export function MemberModal({ member, tasks, onClose }) {
  const { profile } = useAppData()
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
  const isOnline = isUserOnline(member.last_seen)
  const memberStatus = member.status || 'active'
  const statusMeta = getStatusMeta(memberStatus)
  const { teamBuckets, organBuckets, avatarBucket } =
    getMemberBucketsForDisplay(member, profile?.layer)

  const primaryTeam = teamBuckets[0]
  const extraTeamBuckets = teamBuckets.slice(1)
  const mergeRoleWithTeam =
    primaryTeam && ['vedouci', 'clen'].includes(member.layer)

  const badgeCls =
    'inline-block font-mono text-[9px] py-1 px-2.5 tracking-[1.5px] uppercase'

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
                  bucketAvCls(avatarBucket)
                )}
              >
                {getInitials(member.name)}
              </div>
              <StatusBadge
                status={memberStatus}
                isOnline={isOnline}
                size="lg"
                className="absolute bottom-0.5 right-0.5"
              />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h2 className="font-sans text-xl font-bold leading-snug tracking-normal text-ctrl-text mb-1.5">
                {member.name}
              </h2>
              <div className="flex flex-col gap-1 items-start">
                <span className={cn(badgeCls, roleBadgeCls(member.layer))}>
                  {mergeRoleWithTeam ? `${roleLabel} · ${primaryTeam}` : roleLabel}
                </span>
                {!mergeRoleWithTeam &&
                  teamBuckets.map(b => (
                    <span key={b} className={cn(badgeCls, bucketOrganBadgeCls(b))}>
                      {b}
                    </span>
                  ))}
                {mergeRoleWithTeam &&
                  extraTeamBuckets.map(b => (
                    <span key={b} className={cn(badgeCls, bucketOrganBadgeCls(b))}>
                      {b}
                    </span>
                  ))}
                {organBuckets.map(b => (
                  <span
                    key={b}
                    className={cn(
                      badgeCls,
                      'inline-flex items-center gap-1 border border-current/25',
                      bucketOrganBadgeCls(b)
                    )}
                    title="Organizace"
                  >
                    <span className="text-[7px] tracking-[2px] opacity-70">ORG</span>
                    {b}
                  </span>
                ))}
              </div>
              {member.role && (
                <p className="mt-2.5 text-[13px] text-ctrl-text2 leading-relaxed">{member.role}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-4 border-b border-ctrl-border">
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

          {/* Status & activity */}
          <div className="mt-3 py-3 px-4 bg-ctrl-bg2/60 border border-ctrl-border rounded-md flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={memberStatus} isOnline={isOnline} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase">
                  Stav
                </div>
                <div
                  className={cn(
                    'text-[13px] font-medium mt-0.5',
                    isOnline ? statusMeta.textCls : 'text-ctrl-text3'
                  )}
                >
                  {statusMeta.label}
                  {!isOnline && (
                    <span className="text-ctrl-text3 font-normal"> · offline</span>
                  )}
                </div>
              </div>
            </div>
            <div className="h-px bg-ctrl-border" />
            <div>
              <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase">
                Naposledy aktivní
              </div>
              <div className="text-[13px] font-medium mt-0.5 text-ctrl-text">
                {lastSeen}
              </div>
            </div>
          </div>
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
