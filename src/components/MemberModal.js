import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabase'
import { formatTime } from '../lib/format'
import { cn, getInitials, isUserOnline } from '../lib/utils'
import { StatusBadge } from './StatusBadge'
import { ALL_BUCKETS, SPECIAL_BUCKETS, bucketAvCls, bucketOrganBadgeCls } from '../constants/buckets'
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

const MEMBERSHIP_LAYER_OPTIONS = [
  { value: 'clen', label: 'Člen' },
  { value: 'vedouci', label: 'Vedoucí buňky' },
  { value: 'predsednictvo', label: 'Předsednictvo' },
  { value: 'zastupce_predsednictva', label: 'Zástupce předsednictva' },
]

/** Vrátí layer tak, jak se zobrazuje v odznácích — pro týmové buňky high-level členové jsou vždy "Člen". */
const HIGH_LAYERS = ['admin', 'developer', 'predsednictvo', 'zastupce_predsednictva']

function buildMembershipDrafts(member) {
  const effectiveLayer = getEffectiveLayer(member)
  return (member.memberships || []).map(m => ({
    ...m,
    layer: (!SPECIAL_BUCKETS.includes(m.bucket) && HIGH_LAYERS.includes(effectiveLayer))
      ? 'clen'
      : m.layer,
  }))
}

export function MemberModal({ member, tasks, onClose }) {
  const { profile, members, patchMember } = useAppData()
  const liveMember = member
    ? members.find(m => String(m.id) === String(member.id)) || member
    : null
  const [editingRole, setEditingRole] = useState(false)
  const [roleDraft, setRoleDraft] = useState('')
  const [roleSaving, setRoleSaving] = useState(false)
  const [roleError, setRoleError] = useState(null)
  const [editingMembership, setEditingMembership] = useState(false)
  const [membershipDrafts, setMembershipDrafts] = useState([])
  const [addBucket, setAddBucket] = useState('')
  const [addLayer, setAddLayer] = useState('clen')
  const [showAddRow, setShowAddRow] = useState(false)
  const [membershipSaving, setMembershipSaving] = useState(false)
  const [membershipError, setMembershipError] = useState(null)
  const [, setPresenceTick] = useState(0)

  useEffect(() => {
    if (!liveMember) return
    setEditingRole(false)
    setRoleDraft(liveMember.role || '')
    setRoleError(null)
  }, [liveMember?.id, liveMember?.role])

  useEffect(() => {
    if (!liveMember) return
    setMembershipDrafts(buildMembershipDrafts(liveMember))
    setEditingMembership(false)
    setMembershipError(null)
    setShowAddRow(false)
    setAddBucket('')
    setAddLayer('clen')
  }, [liveMember?.id])

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
  const canEditMembership =
    profile &&
    ['admin', 'developer'].includes(viewerEffectiveLayer) &&
    String(liveMember.id) !== String(profile.id)

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
  const saveMembership = async () => {
    setMembershipSaving(true)
    setMembershipError(null)
    let error = null

    const originals = liveMember.memberships || []
    const draftBuckets = new Set(membershipDrafts.map(m => m.bucket))

    // Delete removed memberships
    for (const orig of originals) {
      if (!draftBuckets.has(orig.bucket)) {
        const res = await supabase
          .from('profile_memberships')
          .delete()
          .eq('profile_id', liveMember.id)
          .eq('bucket', orig.bucket)
        if (res.error) { error = res.error; break }
      }
    }

    // Update changed layers
    if (!error) {
      for (const draft of membershipDrafts) {
        const orig = originals.find(m => m.bucket === draft.bucket)
        if (orig && orig.layer !== draft.layer) {
          const res = await supabase
            .from('profile_memberships')
            .update({ layer: draft.layer })
            .eq('profile_id', liveMember.id)
            .eq('bucket', draft.bucket)
          if (res.error) { error = res.error; break }
        }
      }
    }

    // Insert new memberships
    if (!error && addBucket && showAddRow) {
      const isPrimary = membershipDrafts.length === 0
      const res = await supabase
        .from('profile_memberships')
        .upsert(
          { profile_id: liveMember.id, bucket: addBucket, layer: addLayer, is_primary: isPrimary },
          { onConflict: 'profile_id,bucket' }
        )
      if (res.error) error = res.error
    }

    // Fix is_primary if the primary was removed
    if (!error) {
      const remainingBuckets = membershipDrafts.map(m => m.bucket)
      if (addBucket && showAddRow) remainingBuckets.push(addBucket)
      const primaryStillExists = originals
        .filter(m => m.is_primary)
        .some(m => remainingBuckets.includes(m.bucket))
      if (!primaryStillExists && remainingBuckets.length > 0) {
        const res = await supabase
          .from('profile_memberships')
          .update({ is_primary: true })
          .eq('profile_id', liveMember.id)
          .eq('bucket', remainingBuckets[0])
        if (res.error) error = res.error
      }
    }

    setMembershipSaving(false)
    if (error) {
      setMembershipError(
        error.code === '42501' || error.message?.includes('policy')
          ? 'Úpravu zablokovalo oprávnění v databázi.'
          : error.message || 'Uložení se nepovedlo.'
      )
      return
    }

    // Optimistic local update
    let finalMemberships = membershipDrafts.map(d => {
      const orig = originals.find(m => m.bucket === d.bucket)
      return { ...(orig || {}), ...d }
    })
    if (addBucket && showAddRow) {
      const isPrimary = finalMemberships.length === 0
      finalMemberships.push({ profile_id: liveMember.id, bucket: addBucket, layer: addLayer, is_primary: isPrimary })
    }
    if (!finalMemberships.some(m => m.is_primary) && finalMemberships.length > 0) {
      finalMemberships = finalMemberships.map((m, i) => ({ ...m, is_primary: i === 0 }))
    }
    const newPrimary = finalMemberships.find(m => m.is_primary) || finalMemberships[0]
    patchMember(liveMember.id, { memberships: finalMemberships, bucket: newPrimary?.bucket || null })
    setEditingMembership(false)
    setShowAddRow(false)
    setAddBucket('')
    setAddLayer('clen')
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

        {canEditMembership && (
          <div className="px-6 pt-4 pb-4 border-b border-ctrl-border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[9px] text-ctrl-text3 tracking-[2px] uppercase">
                Členství
              </span>
              {!editingMembership && (
                <button
                  type="button"
                  className="font-mono text-[9px] tracking-[1.5px] uppercase py-1 px-2 text-ctrl-text2 border border-ctrl-border rounded transition-colors hover:border-ctrl-accent hover:text-ctrl-accent"
                  onClick={() => {
                    setMembershipDrafts(buildMembershipDrafts(liveMember))
                    setShowAddRow(false)
                    setAddBucket('')
                    setAddLayer('clen')
                    setMembershipError(null)
                    setEditingMembership(true)
                  }}
                >
                  Upravit
                </button>
              )}
            </div>

            {editingMembership ? (
              <div className="space-y-1.5">
                {/* Header row */}
                <div className="grid grid-cols-[1fr_1fr_24px] gap-2 mb-0.5">
                  <span className="font-mono text-[9px] text-ctrl-text3 tracking-[1.5px] uppercase">Buňka</span>
                  <span className="font-mono text-[9px] text-ctrl-text3 tracking-[1.5px] uppercase">Postavení</span>
                  <span />
                </div>

                {/* Existing membership rows */}
                {membershipDrafts.map(draft => {
                  const isSpecialBucket = SPECIAL_BUCKETS.includes(draft.bucket)
                  return (
                    <div key={draft.bucket} className="grid grid-cols-[1fr_1fr_24px] gap-2 items-center">
                      <div className="text-[13px] text-ctrl-text truncate pr-1" title={draft.bucket}>
                        {draft.bucket}
                      </div>
                      {isSpecialBucket ? (
                        <div className="text-[13px] text-ctrl-text2 py-2 px-2.5 bg-ctrl-bg2/40 border border-ctrl-border/50 rounded truncate" title={ROLE_LABELS[draft.layer] || draft.layer}>
                          {ROLE_LABELS[draft.layer] || draft.layer}
                        </div>
                      ) : (
                        <select
                          className={cn(roleInputCls, 'cursor-pointer')}
                          value={draft.layer}
                          onChange={e =>
                            setMembershipDrafts(prev =>
                              prev.map(d => d.bucket === draft.bucket ? { ...d, layer: e.target.value } : d)
                            )
                          }
                          disabled={membershipSaving}
                        >
                          {MEMBERSHIP_LAYER_OPTIONS
                            .filter(o => ['clen', 'vedouci'].includes(o.value))
                            .map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                      )}
                      <button
                        type="button"
                        className="w-6 h-6 flex items-center justify-center text-ctrl-text3 border border-ctrl-border rounded text-sm leading-none transition-colors hover:border-ctrl-danger hover:text-ctrl-danger disabled:opacity-40"
                        title="Odebrat z buňky"
                        disabled={membershipSaving}
                        onClick={() =>
                          setMembershipDrafts(prev => prev.filter(d => d.bucket !== draft.bucket))
                        }
                      >
                        ×
                      </button>
                    </div>
                  )
                })}

                {/* Add new membership row */}
                {showAddRow && (
                  <div className="grid grid-cols-[1fr_1fr_24px] gap-2 items-center">
                    <select
                      className={cn(roleInputCls, 'cursor-pointer')}
                      value={addBucket}
                      onChange={e => setAddBucket(e.target.value)}
                      disabled={membershipSaving}
                      autoFocus
                    >
                      <option value="">— buňka —</option>
                      {ALL_BUCKETS
                        .filter(b => !membershipDrafts.some(d => d.bucket === b))
                        .map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                    <select
                      className={cn(roleInputCls, 'cursor-pointer')}
                      value={addLayer}
                      onChange={e => setAddLayer(e.target.value)}
                      disabled={membershipSaving}
                    >
                      {(SPECIAL_BUCKETS.includes(addBucket)
                        ? MEMBERSHIP_LAYER_OPTIONS
                        : MEMBERSHIP_LAYER_OPTIONS.filter(o => ['clen', 'vedouci'].includes(o.value))
                      ).map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="w-6 h-6 flex items-center justify-center text-ctrl-text3 border border-ctrl-border rounded text-sm leading-none transition-colors hover:border-ctrl-danger hover:text-ctrl-danger"
                      title="Zrušit přidání"
                      onClick={() => { setShowAddRow(false); setAddBucket(''); setAddLayer('clen') }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Add button */}
                {!showAddRow && (
                  <button
                    type="button"
                    className="mt-1 font-mono text-[9px] tracking-[1.5px] uppercase py-1 px-2 text-ctrl-text3 border border-dashed border-ctrl-border rounded transition-colors hover:border-ctrl-accent hover:text-ctrl-accent disabled:opacity-40"
                    disabled={membershipSaving}
                    onClick={() => setShowAddRow(true)}
                  >
                    + Přidat buňku
                  </button>
                )}

                {membershipError && (
                  <p className="text-[10px] font-mono text-ctrl-danger leading-snug pt-1">
                    {membershipError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    className="font-mono text-[9px] tracking-[1.5px] uppercase py-1.5 px-2.5 bg-ctrl-accent text-white border border-ctrl-accent rounded transition-opacity hover:opacity-90 disabled:opacity-50"
                    onClick={saveMembership}
                    disabled={membershipSaving || (showAddRow && !addBucket)}
                  >
                    {membershipSaving ? '…' : 'Uložit'}
                  </button>
                  <button
                    type="button"
                    className="font-mono text-[9px] tracking-[1.5px] uppercase py-1.5 px-2.5 text-ctrl-text2 border border-ctrl-border rounded transition-colors hover:border-ctrl-text2 hover:text-ctrl-text disabled:opacity-50"
                    onClick={() => {
                      setEditingMembership(false)
                      setMembershipDrafts(buildMembershipDrafts(liveMember))
                      setShowAddRow(false)
                      setAddBucket('')
                      setAddLayer('clen')
                      setMembershipError(null)
                    }}
                    disabled={membershipSaving}
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {(liveMember.memberships || []).length === 0 ? (
                  <span className="text-[13px] text-ctrl-text3 italic">Žádné členství</span>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-x-2 mb-0.5">
                      <span className="font-mono text-[9px] text-ctrl-text3 tracking-[1.5px] uppercase">Buňka</span>
                      <span className="font-mono text-[9px] text-ctrl-text3 tracking-[1.5px] uppercase">Postavení</span>
                    </div>
                    {buildMembershipDrafts(liveMember).map(m => (
                      <div key={m.bucket} className="grid grid-cols-2 gap-x-2">
                        <div className="text-[13px] text-ctrl-text truncate" title={m.bucket}>{m.bucket}</div>
                        <div className="text-[13px] text-ctrl-text2">
                          {ROLE_LABELS[m.layer] || m.layer || <span className="text-ctrl-text3 italic">—</span>}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

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
