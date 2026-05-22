import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { TEAM_BUCKETS, SPECIAL_BUCKETS } from '../constants/buckets'
import { bucketDotCls } from '../constants/buckets'
import { bucketPath } from '../lib/bucketSlug'
import { useAppData } from '../context/AppDataContext'
import { IconAdmin, IconCells, IconDashboard, IconMenu, IconProfile } from './icons/NavIcons'

export function MobileBottomNav({ accessibleBuckets, activeBucketSlug, tasks }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { myOpenCount, admin } = useAppData()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const path = location.pathname
  const isBucketRoute = Boolean(activeBucketSlug)

  const navItems = [
    { path: '/', label: 'Hlavní', Icon: IconDashboard, end: true },
    { path: '/bunky', label: 'Buňky', Icon: IconCells },
    { path: '/profil', label: 'Profil', Icon: IconProfile },
    ...(admin ? [{ path: '/admin', label: 'Admin', Icon: IconAdmin }] : []),
  ]

  const isNavActive = (itemPath, end) => {
    if (isBucketRoute) return false
    if (end) return path === itemPath
    return path.startsWith(itemPath)
  }

  const teamBuckets = accessibleBuckets.filter(b => TEAM_BUCKETS.includes(b))
  const specialBuckets = accessibleBuckets.filter(b => SPECIAL_BUCKETS.includes(b))

  return (
    <>
      <div className="hidden fixed bottom-0 left-0 right-0 h-[62px] bg-ctrl-panel border-t border-ctrl-border z-[300] px-1 items-center justify-around pb-[env(safe-area-inset-bottom)] max-[900px]:flex">
        {navItems.map(n => (
          <div
            key={n.path}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-2 px-2.5 cursor-pointer flex-1 text-ctrl-text2 transition-all duration-150 relative rounded-lg active:scale-90',
              isNavActive(n.path, n.end) && 'text-ctrl-accent bg-[rgba(42,107,255,0.1)]'
            )}
            onClick={() => { navigate(n.path); setDrawerOpen(false) }}
          >
            {n.path === '/' && myOpenCount > 0 && (
              <span className="absolute top-[5px] right-2 bg-ctrl-danger text-white text-[8px] min-w-[14px] h-3.5 flex items-center justify-center rounded-[7px]">{myOpenCount}</span>
            )}
            <n.Icon className="w-5 h-5" />
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
          <div className="font-mono text-[9px] tracking-[3px] text-ctrl-text3 uppercase py-3 px-3 pb-1">Týmové buňky</div>
          {teamBuckets.map(b => {
            const bucketTasks = tasks.filter(t => (t.bucket_target === b) && !t.done)
            return (
              <div key={b} className="flex items-center gap-3 py-3.5 px-3 cursor-pointer rounded-lg transition-colors duration-150 mb-0.5 active:bg-[rgba(42,107,255,0.1)]" onClick={() => { navigate(bucketPath(b)); setDrawerOpen(false) }}>
                <div className={cn('w-2.5 h-2.5 rounded-sm shrink-0', bucketDotCls(b))} />
                <span className="text-[15px] font-semibold">{b}</span>
                {bucketTasks.length > 0 && <span className="font-mono text-[10px] text-ctrl-text2 ml-auto">{bucketTasks.length} úkolů</span>}
              </div>
            )
          })}
          {specialBuckets.length > 0 && (
            <>
              <div className="font-mono text-[9px] tracking-[3px] text-ctrl-text3 uppercase py-3 px-3 pb-1">Orgány</div>
              {specialBuckets.map(b => (
                <div key={b} className="flex items-center gap-3 py-3.5 px-3 cursor-pointer rounded-lg transition-colors duration-150 mb-0.5 active:bg-[rgba(42,107,255,0.1)]" onClick={() => { navigate(bucketPath(b)); setDrawerOpen(false) }}>
                  <div className={cn('w-2.5 h-2.5 rounded-sm shrink-0', bucketDotCls(b))} />
                  <span className="text-[15px] font-semibold">{b}</span>
                </div>
              ))}
            </>
          )}
          <div className="pt-3">
            <div className="flex items-center gap-3 py-3.5 px-3 cursor-pointer rounded-lg transition-colors duration-150 mb-0.5 active:bg-[rgba(42,107,255,0.1)] opacity-50" onClick={() => setDrawerOpen(false)}>
              <span className="text-[13px] text-ctrl-text2">Zavřít</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
