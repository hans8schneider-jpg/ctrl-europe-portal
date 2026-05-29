import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { bucketDotCls } from '../constants/buckets'
import { bucketPath } from '../lib/bucketSlug'
import { getSidebarBucketSections } from '../lib/permissions'
import { getMyAssignedOpenTasks } from '../lib/tasks'
import { useAppData } from '../context/AppDataContext'
import { ReportModal } from './ReportModal'
import { MyTasksNav } from './MyTasksNav'
import { IconAdmin, IconCells, IconDashboard, IconMenu, IconProfile, IconReport, IconTasks } from './icons/NavIcons'

export function MobileBottomNav({ activeBucketSlug }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, tasks, openCountByBucket, adminPanelAccess } = useAppData()
  const myTasksCount = getMyAssignedOpenTasks(tasks, profile).length
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const path = location.pathname
  const isBucketRoute = Boolean(activeBucketSlug)

  const navItems = [
    { path: '/', label: 'Hlavní', Icon: IconDashboard, end: true },
    { path: '/moje-ukoly', label: 'Úkoly', Icon: IconTasks, badge: myTasksCount },
    { path: '/bunky', label: 'Buňky', Icon: IconCells },
    { path: '/profil', label: 'Profil', Icon: IconProfile },
    ...(adminPanelAccess ? [{ path: '/admin', label: 'Admin', Icon: IconAdmin }] : []),
  ]

  const isNavActive = (itemPath, end) => {
    if (isBucketRoute) return false
    if (end) return path === itemPath
    return path.startsWith(itemPath)
  }

  const { team: teamBuckets, organs: specialBuckets, others: otherBuckets } =
    getSidebarBucketSections(profile)

  const renderBucketDrawerItem = (b) => {
    const bucketOpenCount = openCountByBucket[b] || 0
    return (
      <div
        key={b}
        className="relative flex items-center gap-3 py-3.5 px-3 cursor-pointer rounded-lg transition-colors duration-150 mb-0.5 active:bg-[rgba(42,107,255,0.1)]"
        onClick={() => { navigate(bucketPath(b)); setDrawerOpen(false) }}
      >
        <div className={cn('w-2.5 h-2.5 rounded-sm shrink-0', bucketDotCls(b))} />
        <span className="text-[15px] font-semibold">{b}</span>
        {bucketOpenCount > 0 && (
          <span className="ml-auto bg-ctrl-danger text-white text-[9px] min-w-4 h-4 flex items-center justify-center rounded-lg font-mono animate-badge-pop">
            {bucketOpenCount > 9 ? '9+' : bucketOpenCount}
          </span>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="hidden fixed bottom-0 left-0 right-0 h-[62px] bg-ctrl-panel border-t border-ctrl-border z-[300] px-1 items-center justify-around pb-[env(safe-area-inset-bottom)] max-[900px]:flex">
        {navItems.map(n => (
          <div
            key={n.path}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 py-2 px-2.5 cursor-pointer flex-1 text-ctrl-text2 transition-all duration-150 rounded-lg active:scale-90',
              isNavActive(n.path, n.end) && 'text-ctrl-accent bg-[rgba(42,107,255,0.1)]',
              n.path === '/moje-ukoly' && isNavActive(n.path, n.end) && 'text-ctrl-warning bg-[rgba(255,184,0,0.1)]'
            )}
            onClick={() => { navigate(n.path); setDrawerOpen(false) }}
          >
            <n.Icon className="w-5 h-5" />
            {n.badge > 0 && (
              <span className="absolute top-1 right-1/4 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full bg-ctrl-warning text-white text-[8px] font-mono tabular-nums">
                {n.badge > 9 ? '9+' : n.badge}
              </span>
            )}
            <span className="font-mono text-[8px] tracking-wide uppercase">{n.label}</span>
          </div>
        ))}
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 py-2 px-2.5 cursor-pointer flex-1 text-ctrl-text2 transition-all duration-150 relative rounded-lg active:scale-90',
            (drawerOpen || isBucketRoute) && 'text-ctrl-accent bg-[rgba(42,107,255,0.1)]'
          )}
          onClick={() => setDrawerOpen(v => !v)}
        >
          <IconMenu />
          <span className="font-mono text-[8px] tracking-wide uppercase">Menu</span>
        </div>
      </div>

      <div className={cn('fixed inset-0 z-[400] backdrop-blur-sm bg-[rgba(0,0,0,0.75)]', drawerOpen ? 'flex items-end animate-fade-in' : 'hidden')} onClick={() => setDrawerOpen(false)}>
        <div className="bg-ctrl-panel border-t border-ctrl-border w-full max-h-[78vh] overflow-y-auto px-4 pt-4 pb-8 rounded-t-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="w-9 h-1 bg-ctrl-border2 rounded-sm mx-auto mb-4" />
          {teamBuckets.length > 0 && (
            <>
              <div className="font-mono text-[9px] tracking-[3px] text-ctrl-text3 uppercase py-3 px-3 pb-1">Týmové buňky</div>
              {teamBuckets.map(renderBucketDrawerItem)}
            </>
          )}
          {specialBuckets.length > 0 && (
            <>
              <div className="font-mono text-[9px] tracking-[3px] text-ctrl-text3 uppercase py-3 px-3 pb-1">Orgány</div>
              {specialBuckets.map(renderBucketDrawerItem)}
            </>
          )}
          {otherBuckets.length > 0 && (
            <>
              <div className="font-mono text-[9px] tracking-[3px] text-ctrl-text3 uppercase py-3 px-3 pb-1">Ostatní</div>
              {otherBuckets.map(renderBucketDrawerItem)}
            </>
          )}
          <div className="font-mono text-[9px] tracking-[3px] text-ctrl-text3 uppercase py-3 px-3 pb-1 mt-1 border-t border-ctrl-border">Portál</div>
          <div
            className="flex items-center gap-3 py-3.5 px-3 cursor-pointer rounded-lg transition-colors duration-150 mb-0.5 active:bg-[rgba(255,184,0,0.08)]"
            onClick={() => {
              setDrawerOpen(false)
              setReportModalOpen(true)
            }}
          >
            <IconReport className="w-5 h-5 shrink-0 text-ctrl-warning" />
            <div className="flex-1 min-w-0">
              <span className="text-[15px] font-semibold">Report</span>
              <div className="font-mono text-[10px] text-ctrl-text2 mt-0.5">Chyba nebo nápad na portál</div>
            </div>
          </div>
          <div className="pt-3">
            <div className="flex items-center gap-3 py-3.5 px-3 cursor-pointer rounded-lg transition-colors duration-150 mb-0.5 active:bg-[rgba(42,107,255,0.1)] text-ctrl-text2" onClick={() => setDrawerOpen(false)}>
              <span className="text-[13px] text-ctrl-text2">Zavřít</span>
            </div>
          </div>
        </div>
      </div>

      {reportModalOpen && profile && (
        <ReportModal profile={profile} onClose={() => setReportModalOpen(false)} />
      )}
    </>
  )
}
