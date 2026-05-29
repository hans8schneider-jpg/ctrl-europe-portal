import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { cn, getInitials } from '../lib/utils'
import { bucketBarCls, bucketLeaderRingCls, bucketMemberAvCls, bucketOrganBadgeCls, bucketStatTextCls, SPECIAL_BUCKETS } from '../constants/buckets'
import { bucketPath } from '../lib/bucketSlug'
import { getSidebarBucketSections } from '../lib/permissions'
import { canViewerSeeTask } from '../lib/tasks'
import { Sec } from '../components/ui/Sec'
import { MemberModal } from '../components/MemberModal'
import { useAppData } from '../context/AppDataContext'

const MENU_WIDTH = 168
const MENU_GAP = 4
const VIEWPORT_PAD = 8
const HEADER_OFFSET = 58

const isBucketLeader = (member, bucket) =>
  member.layer === 'vedouci' && member.bucket === bucket

const sortBucketMembers = (list, bucket) =>
  [...list].sort((a, b) => {
    const aLead = isBucketLeader(a, bucket)
    const bLead = isBucketLeader(b, bucket)
    if (aLead !== bLead) return Number(bLead) - Number(aLead)
    return a.name.localeCompare(b.name, 'cs')
  })

function computeMenuLayout(anchor) {
  const rect = anchor.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_PAD
  const spaceAbove = rect.top - MENU_GAP - VIEWPORT_PAD - HEADER_OFFSET
  const openBelow = spaceBelow >= spaceAbove
  const maxHeight = Math.min(280, Math.max(96, openBelow ? spaceBelow : spaceAbove))

  let left = rect.right - MENU_WIDTH
  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - MENU_WIDTH - VIEWPORT_PAD))

  if (openBelow) {
    return { openBelow: true, top: rect.bottom + MENU_GAP, left, maxHeight }
  }
  return {
    openBelow: false,
    bottom: window.innerHeight - rect.top + MENU_GAP,
    left,
    maxHeight,
  }
}

export function BucketsPage() {
  const navigate = useNavigate()
  const { profile, tasks, members } = useAppData()
  const { team, organs, others } = getSidebarBucketSections(profile)
  const bucketSections = [
    { key: 'team', label: 'Týmové buňky', buckets: team },
    { key: 'organs', label: 'Orgány', buckets: organs },
    { key: 'others', label: 'Ostatní', buckets: others },
  ].filter(s => s.buckets.length > 0)
  const [selectedMember, setSelectedMember] = useState(null)
  const [openMenuBucket, setOpenMenuBucket] = useState(null)
  const [menuLayout, setMenuLayout] = useState(null)
  const menuAnchorRef = useRef(null)
  const onSelectBucket = (b) => navigate(bucketPath(b))

  const closeMenu = () => {
    setOpenMenuBucket(null)
    setMenuLayout(null)
    menuAnchorRef.current = null
  }

  const openMenu = (bucket, anchor) => {
    menuAnchorRef.current = anchor
    setOpenMenuBucket(bucket)
    setMenuLayout(computeMenuLayout(anchor))
  }

  const toggleMenu = (bucket, e) => {
    e.stopPropagation()
    if (openMenuBucket === bucket) {
      closeMenu()
      return
    }
    openMenu(bucket, e.currentTarget)
  }

  useEffect(() => {
    if (!openMenuBucket) return
    const onKey = (e) => { if (e.key === 'Escape') closeMenu() }
    const onClose = () => closeMenu()
    const updateLayout = () => {
      if (menuAnchorRef.current) setMenuLayout(computeMenuLayout(menuAnchorRef.current))
    }
    document.addEventListener('click', onClose)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', updateLayout)
    window.addEventListener('scroll', updateLayout, true)
    return () => {
      document.removeEventListener('click', onClose)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', updateLayout)
      window.removeEventListener('scroll', updateLayout, true)
    }
  }, [openMenuBucket])

  const copyBucketLink = async (bucket) => {
    const url = `${window.location.origin}${bucketPath(bucket)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* clipboard unavailable */
    }
    closeMenu()
  }

  const openMenuBucketMembers = openMenuBucket
    ? sortBucketMembers(
        members.filter(m => m.bucket === openMenuBucket || m.secondary_bucket === openMenuBucket),
        openMenuBucket
      )
    : []

  return (
    <div className="animate-fade-in">
      <Sec>BUŇKY PROJEKTU</Sec>
      {bucketSections.map(section => (
        <div key={section.key} className="mb-6 last:mb-5">
          {bucketSections.length > 1 && (
            <div className="font-mono text-[9px] tracking-[3px] text-ctrl-text3 uppercase mb-3">
              {section.label}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[900px]:gap-2">
        {section.buckets.map(bucket => {
          const bucketTasks = tasks.filter(
            t =>
              (t.bucket_target === bucket || t.bucket_target === 'all') &&
              !t.done &&
              canViewerSeeTask(t, profile)
          )
          const bucketMembers = members.filter(m => m.bucket === bucket || m.secondary_bucket === bucket)
          const isSpecial = SPECIAL_BUCKETS.includes(bucket)
          const menuOpen = openMenuBucket === bucket

          return (
            <div
              key={bucket}
              className="group p-5 cursor-pointer bg-ctrl-panel border border-ctrl-border relative overflow-visible transition-all duration-[250ms] hover:-translate-y-[3px] hover:border-ctrl-border2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] max-[900px]:p-4"
              onClick={() => onSelectBucket(bucket)}
            >
              <div className={cn('absolute top-0 left-0 right-0 h-[3px] pointer-events-none', bucketBarCls(bucket))} />

              <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className={cn(
                    'w-7 h-7 flex items-center justify-center text-[16px] leading-none cursor-pointer rounded-sm transition-all duration-200',
                    menuOpen
                      ? 'text-ctrl-text bg-[rgba(42,107,255,0.12)]'
                      : 'text-ctrl-text3 hover:text-ctrl-text2 hover:bg-[rgba(255,255,255,0.04)]'
                  )}
                  aria-label="Akce buňky"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={e => toggleMenu(bucket, e)}
                >
                  ⋮
                </button>
              </div>

              <div className="pr-8 mb-3">
                <div className="flex items-start gap-2 flex-wrap">
                  <div className="text-[18px] font-bold leading-tight">{bucket}</div>
                  {isSpecial && (
                    <span className={cn('font-mono text-[8px] py-0.5 px-1.5 tracking-wide uppercase shrink-0', bucketOrganBadgeCls(bucket))}>
                      ORGÁN
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="py-2.5 px-3 bg-ctrl-bg2/60 border border-ctrl-border/80">
                  <div className={cn('font-mono text-2xl font-bold leading-none tabular-nums max-[900px]:text-xl', bucketStatTextCls(bucket))}>
                    {bucketTasks.length}
                  </div>
                  <div className="font-mono text-[8px] tracking-[1.5px] uppercase text-ctrl-text3 mt-1">Úkoly</div>
                </div>
                <div className="py-2.5 px-3 bg-ctrl-bg2/60 border border-ctrl-border/80">
                  <div className="font-mono text-2xl font-bold leading-none tabular-nums text-ctrl-text max-[900px]:text-xl">
                    {bucketMembers.length}
                  </div>
                  <div className="font-mono text-[8px] tracking-[1.5px] uppercase text-ctrl-text3 mt-1">Členové</div>
                </div>
              </div>

              <div className="mt-3 font-mono text-[9px] tracking-[1.5px] uppercase text-ctrl-text3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Otevřít →
              </div>
            </div>
          )
        })}
          </div>
        </div>
      ))}

      {openMenuBucket && menuLayout && createPortal(
        <div
          className="fixed z-[200] bg-ctrl-panel2 border border-ctrl-border shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-y-auto overscroll-contain py-1"
          style={{
            left: menuLayout.left,
            width: MENU_WIDTH,
            maxHeight: menuLayout.maxHeight,
            ...(menuLayout.openBelow
              ? { top: menuLayout.top }
              : { bottom: menuLayout.bottom }),
          }}
          role="menu"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-1.5 pb-1">
            <button
              type="button"
              role="menuitem"
              className="w-full flex items-center gap-2 text-left py-2 px-2.5 text-[11px] font-semibold text-ctrl-text hover:bg-[rgba(42,107,255,0.12)] transition-colors duration-200"
              onClick={() => { closeMenu(); onSelectBucket(openMenuBucket) }}
            >
              <span className="w-5 shrink-0 text-center font-mono text-[10px] text-ctrl-accent">→</span>
              <span>Otevřít buňku</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full flex items-center gap-2 text-left py-2 px-2.5 text-[11px] font-mono text-ctrl-text2 hover:text-ctrl-text hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200"
              onClick={() => copyBucketLink(openMenuBucket)}
            >
              <span className="w-5 shrink-0 text-center font-mono text-[10px] text-ctrl-text3">⎘</span>
              <span>Kopírovat odkaz</span>
            </button>
          </div>

          {openMenuBucketMembers.length > 0 && (
            <div className="border-t border-ctrl-border mt-0.5">
              <div className="px-3 py-2 bg-[rgba(0,0,0,0.25)] border-b border-ctrl-border/60">
                <span className="font-mono text-[8px] tracking-[2px] uppercase text-ctrl-text3">Členové</span>
                <span className="ml-1.5 font-mono text-[9px] text-ctrl-accent tabular-nums">{openMenuBucketMembers.length}</span>
              </div>
              <div className="py-1 px-1">
                {openMenuBucketMembers.map(m => {
                  const leader = isBucketLeader(m, openMenuBucket)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2.5 text-left py-1.5 px-2.5 text-[11px] text-ctrl-text2 rounded-sm hover:text-ctrl-text hover:bg-[rgba(42,107,255,0.08)] transition-colors duration-200 min-w-0"
                      onClick={() => { closeMenu(); setSelectedMember(m) }}
                    >
                      <span
                        className={cn(
                          'w-8 h-8 shrink-0 box-border flex items-center justify-center text-[10px] font-bold font-mono',
                          bucketMemberAvCls(openMenuBucket),
                          leader && cn('!border-[3px] border-solid', bucketLeaderRingCls(openMenuBucket))
                        )}
                      >
                        {getInitials(m.name)}
                      </span>
                      <span className="truncate min-w-0">
                        {m.name}
                        {leader ? (
                          <span className="block font-mono text-[8px] tracking-wide uppercase text-ctrl-text3 mt-0.5">
                            Vedoucí
                          </span>
                        ) : (
                          <span className="block font-mono text-[8px] tracking-wide uppercase text-ctrl-text3 mt-0.5">
                            Člen
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {selectedMember && <MemberModal member={selectedMember} tasks={tasks} onClose={() => setSelectedMember(null)} />}
    </div>
  )
}
