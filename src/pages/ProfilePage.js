import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { cn, getInitials, isUserOnline } from '../lib/utils'
import { formatTime } from '../lib/format'
import {
  bucketAvCls,
  bucketDotCls,
  bucketOrganBadgeCls,
  SPECIAL_BUCKETS,
} from '../constants/buckets'
import { ROLE_LABELS, roleBadgeCls } from '../constants/roles'
import {
  canAccessAdminPanel,
  canAddTasks,
  canManageNews,
  isAdmin,
  isDeveloper,
} from '../lib/permissions'
import { Sec } from '../components/ui/Sec'
import { StatusPicker } from '../components/ui/StatusPicker'
import { StatusBadge } from '../components/StatusBadge'
import { PasswordChange } from '../components/PasswordChange'
import { useAppData } from '../context/AppDataContext'

const panelCls =
  'bg-ctrl-panel border border-ctrl-border transition-all duration-[250ms] hover:border-ctrl-border2'

function BucketRow({ label, bucket, isOrgan }) {
  if (!bucket) return null
  return (
    <div className="flex items-center gap-2.5 py-2 px-2.5 -mx-2.5 bg-ctrl-bg2/40 border border-transparent hover:border-ctrl-border transition-colors">
      <span className={cn('w-2 h-2 rounded-full shrink-0', bucketDotCls(bucket))} />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-0.5">{label}</div>
        <div className="text-[13px] font-medium truncate">{bucket}</div>
      </div>
      {isOrgan && (
        <span
          className={cn(
            'font-mono text-[8px] py-0.5 px-1.5 tracking-[1.5px] uppercase shrink-0 border border-current/25',
            bucketOrganBadgeCls(bucket)
          )}
        >
          ORG
        </span>
      )}
    </div>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { profile, setProfile, patchMember } = useAppData()
  const [status, setStatus] = useState(profile.status || 'active')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setStatus(profile.status || 'active')
  }, [profile.status])

  const online = isUserOnline(profile.last_seen)
  const [statusSaving, setStatusSaving] = useState(false)

  const permissions = useMemo(
    () =>
      [
        'Dashboard',
        canManageNews(profile.layer) && 'Správa oznámení',
        profile.layer !== 'pozorovatel' && 'Chat v buňce',
        profile.layer !== 'pozorovatel' && 'Označování úkolů',
        canAddTasks(profile.layer) && 'Přidávání úkolů',
        isDeveloper(profile.layer) && 'Přidávání úkolů v buňce Developeři',
        isAdmin(profile.layer) && 'Admin panel',
        canAccessAdminPanel(profile.layer) &&
          !isAdmin(profile.layer) &&
          'Admin panel — reporty a členové',
        isAdmin(profile.layer) && 'Správa všech buněk',
        profile.layer === 'pozorovatel' && 'Čtení všech buněk',
      ].filter(Boolean),
    [profile.layer]
  )

  const updateStatus = async newStatus => {
    const prev = status
    setStatus(newStatus)
    setProfile(p => (p ? { ...p, status: newStatus } : p))
    patchMember(profile.id, { status: newStatus })
    setStatusSaving(true)
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', profile.id)
    setStatusSaving(false)
    if (error) {
      setStatus(prev)
      setProfile(p => (p ? { ...p, status: prev } : p))
      patchMember(profile.id, { status: prev })
    }
  }

  const activityLabel = online
    ? 'Právě na portálu'
    : formatTime(profile.last_seen) === 'Nikdy'
      ? 'Ještě neaktivní'
      : `Naposledy ${formatTime(profile.last_seen).toLowerCase()}`

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="text-[22px] font-extrabold mb-1">{profile.name}</div>
        <div className="font-mono text-[11px] text-ctrl-accent tracking-[2px] max-[900px]:text-[10px]">
          Tvůj účet v CTRL Europe Team
        </div>
      </div>

      <div className="grid gap-4 grid-cols-[280px_1fr] max-[900px]:grid-cols-1">
        <div className={cn(panelCls, 'min-w-0')}>
          <div className="relative px-6 pt-6 pb-5 border-b border-ctrl-border bg-gradient-to-b from-ctrl-panel2/50 to-transparent overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div
                  className={cn(
                    'w-[80px] h-[80px] rounded-full flex items-center justify-center text-[28px] font-bold font-mono shadow-[0_8px_32px_rgba(0,0,0,0.25)]',
                    bucketAvCls(profile.bucket)
                  )}
                >
                  {getInitials(profile.name)}
                </div>
                <StatusBadge
                  status={status}
                  isOnline={online}
                  size="lg"
                  className="absolute bottom-0.5 right-0.5"
                />
              </div>
              <div className="text-lg font-extrabold mb-2 leading-tight">{profile.name}</div>
              <span
                className={cn(
                  'inline-block font-mono text-[9px] py-1 px-2.5 tracking-[2px] uppercase',
                  roleBadgeCls(profile.layer)
                )}
              >
                {ROLE_LABELS[profile.layer] || profile.layer}
              </span>
              {profile.role && (
                <div className="mt-2 font-mono text-[10px] text-ctrl-text2 tracking-wide">
                  {profile.role}
                </div>
              )}
              <div
                className={cn(
                  'mt-3 font-mono text-[10px] tracking-wide',
                  online ? 'text-ctrl-success' : 'text-ctrl-text2'
                )}
              >
                {activityLabel}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-1">
            <BucketRow label="Buňka" bucket={profile.bucket} isOrgan={SPECIAL_BUCKETS.includes(profile.bucket)} />
            {profile.secondary_bucket && (
              <BucketRow
                label="Sekundární buňka"
                bucket={profile.secondary_bucket}
                isOrgan={SPECIAL_BUCKETS.includes(profile.secondary_bucket)}
              />
            )}

            <div className="h-px bg-ctrl-border my-4" />

            <div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-2">Stav</div>
              <StatusPicker
                value={status}
                onChange={updateStatus}
                disabled={statusSaving}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className={cn(panelCls, 'p-5 border-b-2 border-b-ctrl-accent')}>
            <Sec>PŘÍSTUPOVÁ PRÁVA</Sec>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-[600px]:grid-cols-1">
              {permissions.map(p => (
                <div
                  key={p}
                  className="flex items-start gap-2 py-1.5 px-2 -mx-2 rounded-sm hover:bg-ctrl-bg2/30 transition-colors"
                >
                  <span className="text-ctrl-success font-mono text-[11px] mt-0.5 shrink-0">✓</span>
                  <span className="text-[13px] text-ctrl-text2 leading-snug">{p}</span>
                </div>
              ))}
            </div>
          </div>

          <PasswordChange />

          <div className={cn(panelCls, 'p-5')}>
            <Sec>DOKUMENTY SPOLKU</Sec>
            <p className="text-xs text-ctrl-text2 mb-4 leading-relaxed">
              Oficiální dokumenty CTRL Europe Team, z. s. Kliknutím stáhneš dokument.
            </p>
            <div className="space-y-0">
              {[
                { name: 'Stanovy spolku', desc: 'Kompletní stanovy CTRL Europe Team, z. s.', icon: '📋' },
                { name: 'Zakládací listina', desc: 'Zakládací listina spolku', icon: '📄' },
                { name: 'GDPR — Zásady zpracování osobních údajů', desc: 'Jak zpracováváme tvé osobní údaje', icon: '🔒' },
                { name: 'Členský závazek', desc: 'Vzor členského závazku spolku', icon: '✍️' },
              ].map((doc, i, arr) => (
                <div
                  key={doc.name}
                  className={cn(
                    'flex items-center gap-3 py-3.5 cursor-default transition-colors hover:bg-ctrl-bg2/25 -mx-2 px-2',
                    i < arr.length - 1 && 'border-b border-ctrl-border'
                  )}
                >
                  <span className="w-10 h-10 flex items-center justify-center text-lg bg-ctrl-bg2 border border-ctrl-border shrink-0">
                    {doc.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold mb-0.5">{doc.name}</div>
                    <div className="font-mono text-[10px] text-ctrl-text2 tracking-wide leading-snug">
                      {doc.desc}
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-ctrl-text3 tracking-wide shrink-0 py-1 px-2 border border-ctrl-border bg-ctrl-bg2/50">
                    BRZY
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 pt-3 border-t border-ctrl-border font-mono text-[10px] text-ctrl-text2 tracking-wide leading-relaxed">
              Dokumenty budou k dispozici po finálním podpisu a zápisu spolku.
            </p>
          </div>

          <div className={cn(panelCls, 'p-5')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Sec className="!mb-0">ODHLÁŠENÍ</Sec>
                <p className="text-xs text-ctrl-text2 mt-2 leading-relaxed">
                  Ukončíš relaci na portálu. Pro další přístup se znovu přihlásíš.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="shrink-0 border border-ctrl-border bg-transparent text-ctrl-text2 py-1.5 px-3 text-[10px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 hover:border-ctrl-danger hover:text-ctrl-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? 'ODHLAŠUJI...' : 'ODHLÁSIT SE'}
              </button>
            </div>
          </div>

          <div
            className={cn(
              panelCls,
              'p-5 border-l-2 border-l-ctrl-accent bg-gradient-to-r from-[rgba(42,107,255,0.06)] to-transparent'
            )}
          >
            <Sec>CTRL EUROPE TEAM</Sec>
            <p className="text-[13px] text-ctrl-text2 leading-relaxed">
              CEE Youth Platform zaměřená na digitální hrozby naší generace. AI, deepfakes, dezinformace
              — a proč nás školy nepřipravují.
            </p>
            <blockquote className="mt-4 pt-3 border-t border-ctrl-border font-mono text-[11px] text-ctrl-accent tracking-wide italic">
              "Take control before someone else does."
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  )
}
