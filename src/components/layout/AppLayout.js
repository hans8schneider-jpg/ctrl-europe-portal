import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { cn, getInitials } from '../../lib/utils'
import { bucketDotCls, bucketMemberAvCls } from '../../constants/buckets'
import { bucketPath, bucketToSlug } from '../../lib/bucketSlug'
import { getBrowsableBuckets, getSidebarBucketSections, isAdmin } from '../../lib/permissions'
import { ROLE_LABELS, roleBadgeCls } from '../../constants/roles'
import { getStatusMeta } from '../../constants/status'
import { useAppData } from '../../context/AppDataContext'
import { MobileBottomNav } from '../MobileBottomNav'
import { MyTasksNav } from '../MyTasksNav'
import { NotificationsDropdown } from '../NotificationsDropdown'
import { ReportModal } from '../ReportModal'
import { IconAdmin, IconArrowLeft, IconCells, IconDashboard, IconProfile, IconReport } from '../icons/NavIcons'

const NAV_MAIN = [
  { path: '/', label: 'Dashboard', Icon: IconDashboard, end: true },
  { path: '/bunky', label: 'Buňky', Icon: IconCells },
  { path: '/profil', label: 'Profil', Icon: IconProfile },
  { path: '/admin', label: 'Admin', Icon: IconAdmin, adminOnly: true },
]

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/bunky': 'Buňky',
  '/moje-ukoly': 'Moje úkoly',
  '/profil': 'Profil',
  '/admin': 'Admin',
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    profile,
    openCountByBucket,
    mentionCountByBucket,
    notifications,
    markNotificationsAsRead,
    admin,
    adminPanelAccess,
    touchLastSeen,
  } = useAppData()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const isFirstPath = useRef(true)

  useEffect(() => {
    if (!profile) return
    if (isFirstPath.current) {
      isFirstPath.current = false
      return
    }
    touchLastSeen()
  }, [location.pathname, profile, touchLastSeen])

  useEffect(() => {
    if (!profileMenuOpen) return
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [profileMenuOpen])

  const browsableBuckets = getBrowsableBuckets(profile)
  const { team: teamBuckets, organs: specialBuckets, others: otherBuckets } =
    getSidebarBucketSections(profile)

  const bucketMatch = location.pathname.match(/^\/bunka\/([^/]+)/)
  const activeBucketSlug = bucketMatch?.[1] ?? null
  const activeBucket = activeBucketSlug
    ? browsableBuckets.find(b => bucketToSlug(b) === activeBucketSlug) ?? null
    : null

  const renderBucketNavItem = (b) => {
    const bucketOpenCount = openCountByBucket[b] || 0
    const bucketMentionCount = mentionCountByBucket[b] || 0
    const hasBoth = bucketOpenCount > 0 && bucketMentionCount > 0
    return (
      <div
        key={b}
        className={bucketLinkCls(bucketToSlug(b))}
        onClick={() => navigate(bucketPath(b))}
        role="link"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate(bucketPath(b))}
      >
        <div className={cn('w-1.5 h-1.5 shrink-0', bucketDotCls(b))} />
        <span className="text-[11px]">{b}</span>
        {bucketMentionCount > 0 && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-ctrl-accent text-white text-[9px] min-w-4 h-4 flex items-center justify-center rounded-lg font-mono animate-badge-pop">
            @
          </span>
        )}
        {bucketOpenCount > 0 && (
          <span className={cn(
            'absolute top-1/2 -translate-y-1/2 bg-ctrl-danger text-white text-[9px] min-w-4 h-4 flex items-center justify-center rounded-lg font-mono animate-badge-pop',
            hasBoth ? 'right-10' : 'right-3.5'
          )}>
            {bucketOpenCount > 9 ? '9+' : bucketOpenCount}
          </span>
        )}
      </div>
    )
  }

  const headerTitle = activeBucket || PAGE_TITLES[location.pathname] || ''

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const myStatus = getStatusMeta(profile.status || 'active')

  const navLinkCls = ({ isActive }) =>
    cn(
      'flex items-center gap-2.5 py-2.5 px-5 cursor-pointer text-ctrl-text2 text-xs font-semibold tracking-wide uppercase border-l-2 border-transparent transition-all duration-200 relative hover:text-ctrl-text hover:bg-[rgba(42,107,255,0.05)] hover:translate-x-0.5',
      isActive && 'text-ctrl-accent border-l-ctrl-accent bg-[rgba(42,107,255,0.1)]'
    )

  const bucketLinkCls = (slug) =>
    cn(
      'flex items-center gap-2.5 py-2.5 px-5 cursor-pointer text-ctrl-text2 text-xs font-semibold tracking-wide uppercase border-l-2 border-transparent transition-all duration-200 relative hover:text-ctrl-text hover:bg-[rgba(42,107,255,0.05)] hover:translate-x-0.5',
      activeBucketSlug === slug && 'text-ctrl-accent border-l-ctrl-accent bg-[rgba(42,107,255,0.1)]'
    )

  return (
    <div className="flex min-h-screen">
      <aside className="w-[230px] min-h-screen bg-ctrl-panel border-r border-ctrl-border flex flex-col fixed left-0 top-0 bottom-0 z-[200] max-[900px]:hidden">
        <div className="py-6 px-5 pb-4 border-b border-ctrl-border relative overflow-hidden">
          <div className="relative inline-block cursor-default">
            <img src="/ctrl_logo_bez_pozadi.png" alt="CTRL" className="h-9 w-auto" />
          </div>
          <div className="font-mono text-[9px] tracking-[2px] text-ctrl-text2 uppercase mt-0.5">Members Portal</div>
        </div>

        <nav className="flex-1 py-2.5 overflow-y-auto">
          <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">Navigace</div>
          {NAV_MAIN.filter(n => !n.adminOnly || adminPanelAccess).map(n => (
            <NavLink key={n.path} to={n.path} end={n.end} className={navLinkCls}>
              <n.Icon />
              <span>{n.label}</span>
            </NavLink>
          ))}

          <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">
            Úkoly
          </div>
          <MyTasksNav variant="sidebar" navLinkCls={navLinkCls} />

          {teamBuckets.length > 0 && (
            <>
              <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">Týmové buňky</div>
              {teamBuckets.map(renderBucketNavItem)}
            </>
          )}

          {specialBuckets.length > 0 && (
            <>
              <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">Orgány</div>
              {specialBuckets.map(renderBucketNavItem)}
            </>
          )}

          {otherBuckets.length > 0 && (
            <>
              <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">Ostatní</div>
              {otherBuckets.map(renderBucketNavItem)}
            </>
          )}
        </nav>

        <div className="border-t border-ctrl-border relative shrink-0" ref={profileMenuRef}>
          {profileMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 bg-ctrl-panel border-t border-ctrl-border">
              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2.5 px-5 bg-transparent border-0 border-b border-ctrl-border text-ctrl-text2 text-xs font-semibold tracking-wide uppercase cursor-pointer font-mono text-left transition-all duration-200 hover:text-ctrl-text hover:bg-[rgba(42,107,255,0.05)]"
                onClick={() => {
                  setProfileMenuOpen(false)
                  navigate('/profil')
                }}
              >
                <IconProfile />
                <span>Profil</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2.5 px-5 bg-transparent border-0 border-b border-ctrl-border text-ctrl-text2 text-xs font-semibold tracking-wide uppercase cursor-pointer font-mono text-left transition-all duration-200 hover:text-ctrl-warning hover:bg-[rgba(255,184,0,0.05)]"
                onClick={() => {
                  setProfileMenuOpen(false)
                  setReportModalOpen(true)
                }}
              >
                <IconReport />
                <span>Report</span>
              </button>
              <button
                type="button"
                className="w-full bg-transparent border-0 text-ctrl-text2 py-2.5 px-5 text-[10px] tracking-[2px] uppercase cursor-pointer font-mono text-left transition-all duration-200 hover:text-ctrl-danger hover:bg-[rgba(255,51,102,0.05)]"
                onClick={() => {
                  setProfileMenuOpen(false)
                  handleLogout()
                }}
              >
                ODHLÁSIT SE
              </button>
            </div>
          )}
          <button
            type="button"
            className={cn(
              'w-full flex items-center gap-2.5 py-3.5 px-5 bg-transparent border-0 cursor-pointer text-left transition-all duration-200 hover:bg-[rgba(42,107,255,0.05)]',
              profileMenuOpen && 'bg-[rgba(42,107,255,0.08)]',
              location.pathname === '/profil' && !profileMenuOpen && 'bg-[rgba(42,107,255,0.1)]'
            )}
            onClick={() => setProfileMenuOpen(open => !open)}
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
          >
            <div className={cn('w-9 h-9 shrink-0 flex items-center justify-center text-[13px] font-bold font-mono', bucketMemberAvCls(profile.bucket))}>
              {getInitials(profile.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold truncate">{profile.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={cn('font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase', roleBadgeCls(profile.layer))}>
                  {ROLE_LABELS[profile.layer]}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-[7px] h-[7px] rounded-full shrink-0', (profile.status || 'active') === 'active' && 'bg-ctrl-success shadow-[0_0_6px_#00e5a0]', profile.status === 'away' && 'bg-ctrl-warning', profile.status === 'needs_help' && 'bg-ctrl-danger animate-pulse')} />
                  <span className="font-mono text-[9px] text-ctrl-text2 tracking-wide">{myStatus.label}</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <div className="ml-[230px] flex-1 min-h-screen animate-fade-in max-[900px]:ml-0 max-[900px]:pb-[70px] max-[900px]:overflow-x-hidden">
        <header className="h-[54px] bg-ctrl-panel border-b border-ctrl-border flex items-center px-7 gap-0 sticky top-0 z-[100] backdrop-blur-md max-[900px]:px-4 max-[900px]:h-[50px]">
          {activeBucket && (
            <>
              <button
                type="button"
                className="flex items-center gap-1.5 shrink-0 py-1.5 pl-2 pr-2.5 mr-3 rounded-md border border-ctrl-border bg-[rgba(42,107,255,0.06)] text-ctrl-text2 cursor-pointer transition-all duration-200 hover:text-ctrl-accent hover:border-[rgba(42,107,255,0.35)] hover:bg-[rgba(42,107,255,0.12)] max-[480px]:px-2 max-[480px]:mr-2"
                onClick={() => navigate('/bunky')}
                aria-label="Zpět na Buňky"
              >
                <IconArrowLeft />
                <span className="font-mono text-[10px] tracking-[2px] uppercase max-[480px]:sr-only">Buňky</span>
              </button>
              <div className="w-px h-5 bg-ctrl-border shrink-0 mr-3 max-[480px]:mr-2" aria-hidden />
            </>
          )}
          <span className="font-mono text-[10px] tracking-[3px] uppercase text-ctrl-text2 truncate min-w-0">
            [CTRL] · {headerTitle}
          </span>
          <div className="ml-auto flex items-center gap-2 shrink-0 pl-3">
            {admin && (
              <span className="text-[9px] py-0.5 px-2 font-mono tracking-wide bg-ctrl-danger text-white">ADMIN</span>
            )}
            {!admin && adminPanelAccess && (
              <span className="text-[9px] py-0.5 px-2 font-mono tracking-wide bg-ctrl-info text-white">DEV</span>
            )}
            <NotificationsDropdown
              notifications={notifications}
              onMarkAllRead={markNotificationsAsRead}
            />
          </div>
        </header>

        <main className="p-7 animate-fade-in max-[900px]:p-4">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav
        activeBucketSlug={activeBucketSlug}
      />

      {reportModalOpen && (
        <ReportModal profile={profile} onClose={() => setReportModalOpen(false)} />
      )}
    </div>
  )
}
