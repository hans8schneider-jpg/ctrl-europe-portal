import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabase'
import { formatTime } from '../lib/format'
import { cn, getInitials, isUserOnline } from '../lib/utils'
import { StatusBadge } from './StatusBadge'
import { bucketAvCls, bucketOrganBadgeCls } from '../constants/buckets'
import { ROLE_LABELS, roleBadgeCls } from '../constants/roles'
import { getStatusMeta } from '../constants/status'
import {
  canEditMemberBucketRole,
  canSeeMemberBucketRole,
  getEffectiveLayer,
  getMemberBucketsForDisplay,
  getTeamBucketBadgeDisplay,
} from '../lib/permissions'
import { useAppData } from '../context/AppDataContext'

const roleInputCls =
  'w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-2 px-2.5 text-[13px] font-sans rounded outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]'

export function MemberModal({ member, tasks, onClose }) {
  const { profile, members, patchMember } = useAppData()
  const liveMember = member
    ? members.find(m => String(m.id) === String(member.id)) || member
    : null
  const [editingRole, setEditingRole] = useState(false)
  const [roleDraft, setRoleDraft] = useState('')
  const [roleSaving, setRoleSaving] = useState(false)
  const [roleError, setRoleError] = useState(null)
  const [, setPresenceTick] = useState(0)

  useEffect(() => {
    if (!liveMember) return
    setEditingRole(false)
    setRoleDraft(liveMember.role || '')
    setRoleError(null)
  }, [liveMember?.id, liveMember?.role])

  useEffect(() => {
    const tick = setInterval(() => setPresenceTick(t => t + 1), 60000)
    return () => clearInterval(tick)
  }, [])

  if (!member || !liveMember) return null

  const memberEffectiveLayer = getEffectiveLayer(liveMember)
  const viewerEffectiveLayer = getEffectiveLayer(profile)
  const canSeeRole =
    profile && canSeeMemberBucketRole(viewerEffectiveLayer, memberEffectiveLayer)
  const canEditRole =
    canSeeRole && profile && canEditMemberBucketRole(profile, liveMember)

  const saveBucketRole = async () => {
    const next = roleDraft.trim()
    setRoleSaving(true)
    setRoleError(null)
    const { error } = await supabase
      .from('profiles')
      .update({ role: next || null })
      .eq('id', liveMember.id)
    setRoleSaving(false)
    if (error) {
      setRoleError(
        error.code === '42501' || error.message?.includes('policy')
          ? 'Úpravu zablokovalo oprávnění v databázi — spusť supabase/profiles-role-edit-rls.sql.'
          : error.message || 'Uložení se nepovedlo.'
      )
      return
    }
    patchMember(liveMember.id, { role: next || null })
    setEditingRole(false)
  }
  const memberTasks = tasks.filter(t => t.created_by === liveMember.id || t.completed_by === liveMember.id)
  const openTasks = memberTasks.filter(t => !t.done)
  const doneTasks = memberTasks.filter(t => t.done)

  const isOnline = isUserOnline(liveMember.last_seen)
  const activityLabel = (() => {
    if (isOnline) return 'Aktivní'
    const t = formatTime(liveMember.last_seen)
    if (t === 'Nikdy') return 'Neaktivní'
    const suffix =
      t === 'Právě teď' ? 'právě teď' : t.charAt(0).toLowerCase() + t.slice(1)
    return `Aktivní ${suffix}`
  })()

  const roleLabel = ROLE_LABELS[memberEffectiveLayer] || memberEffectiveLayer
  const memberStatus = liveMember.status || 'active'
  const statusMeta = getStatusMeta(memberStatus)
  const { teamBuckets, organBuckets, avatarBucket } =
    getMemberBucketsForDisplay(liveMember, viewerEffectiveLayer)

  const primaryTeam = teamBuckets[0]
  const extraTeamBuckets = teamBuckets.slice(1)
  const mergeRoleWithTeam =
    primaryTeam && ['vedouci', 'clen'].includes(memberEffectiveLayer)
  const primaryOrgan = organBuckets[0]
  const extraOrganBuckets = organBuckets.slice(1)
  const mergeOrganWithRole = Boolean(primaryOrgan && !mergeRoleWithTeam)

  const topBadgeLabel = mergeRoleWithTeam
    ? `${roleLabel} · ${primaryTeam}`
    : mergeOrganWithRole
      ? `${roleLabel} · ${primaryOrgan}`
      : roleLabel

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
                {getInitials(liveMember.name)}
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
                {liveMember.name}
              </h2>
              <div className="flex flex-col gap-1 items-start">
                <span className={cn(badgeCls, roleBadgeCls(liveMember.layer))}>
                  {topBadgeLabel}
                </span>
                {!mergeRoleWithTeam &&
                  teamBuckets.map(b => {
                    const teamBadge = getTeamBucketBadgeDisplay(memberEffectiveLayer, b)
                    return (
                      <span key={b} className={cn(badgeCls, teamBadge.className)}>
                        {teamBadge.label}
                      </span>
                    )
                  })}
                {mergeRoleWithTeam &&
                  extraTeamBuckets.map(b => {
                    const teamBadge = getTeamBucketBadgeDisplay(memberEffectiveLayer, b)
                    return (
                      <span key={b} className={cn(badgeCls, teamBadge.className)}>
                        {teamBadge.label}
                      </span>
                    )
                  })}
                {extraOrganBuckets.map(b => (
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
              {canSeeRole && (liveMember.role || canEditRole) && (
                <div className="mt-2.5 min-w-0">
                  {editingRole ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        className={roleInputCls}
                        value={roleDraft}
                        onChange={e => setRoleDraft(e.target.value)}
                        placeholder="Role v buňce…"
                        disabled={roleSaving}
                        autoFocus
                      />
                      {roleError && (
                        <p className="text-[10px] font-mono text-ctrl-danger leading-snug">{roleError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="font-mono text-[9px] tracking-[1.5px] uppercase py-1.5 px-2.5 bg-ctrl-accent text-white border border-ctrl-accent rounded transition-opacity hover:opacity-90 disabled:opacity-50"
                          onClick={saveBucketRole}
                          disabled={roleSaving}
                        >
                          {roleSaving ? '…' : 'Uložit'}
                        </button>
                        <button
                          type="button"
                          className="font-mono text-[9px] tracking-[1.5px] uppercase py-1.5 px-2.5 text-ctrl-text2 border border-ctrl-border rounded transition-colors hover:border-ctrl-text2 hover:text-ctrl-text disabled:opacity-50"
                          onClick={() => {
                            setEditingRole(false)
                            setRoleDraft(liveMember.role || '')
                            setRoleError(null)
                          }}
                          disabled={roleSaving}
                        >
                          Zrušit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 min-w-0">
                      <p className="flex-1 min-w-0 text-[13px] text-ctrl-text2 leading-relaxed">
                        {liveMember.role || (
                          <span className="text-ctrl-text3 italic">Bez role v buňce</span>
                        )}
                      </p>
                      {canEditRole && (
                        <button
                          type="button"
                          className="shrink-0 font-mono text-[9px] tracking-[1.5px] uppercase py-1 px-2 text-ctrl-text2 border border-ctrl-border rounded transition-colors hover:border-ctrl-accent hover:text-ctrl-accent"
                          onClick={() => {
                            setRoleDraft(liveMember.role || '')
                            setRoleError(null)
                            setEditingRole(true)
                          }}
                        >
                          Upravit
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
            {isOnline && (
              <>
                <div className="flex items-center gap-3">
                  <StatusBadge status={memberStatus} isOnline size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase">
                      Stav
                    </div>
                    <div className={cn('text-[13px] font-medium mt-0.5', statusMeta.textCls)}>
                      {statusMeta.label}
                    </div>
                  </div>
                </div>
                <div className="h-px bg-ctrl-border" />
              </>
            )}
            <div>
              <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase">
                Aktivita
              </div>
              <div
                className={cn(
                  'text-[13px] font-medium mt-0.5',
                  isOnline ? 'text-ctrl-success' : 'text-ctrl-text3'
                )}
              >
                {activityLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-ctrl-border bg-ctrl-bg2/30">
          <p className="font-mono text-[9px] text-ctrl-text3 tracking-wide">
            Člen od{' '}
            {liveMember.created_at
              ? new Date(liveMember.created_at).toLocaleDateString('cs-CZ')
              : 'neznámo'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
