import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { cn, getInitials } from '../../lib/utils'
import { TEAM_BUCKETS, SPECIAL_BUCKETS } from '../../constants/buckets'
import { bucketDotCls, bucketMemberAvCls } from '../../constants/buckets'
import { bucketPath, bucketToSlug } from '../../lib/bucketSlug'
import { getAccessibleBuckets, isAdmin } from '../../lib/permissions'
import { ROLE_LABELS, roleBadgeCls } from '../../constants/roles'
import { useAppData } from '../../context/AppDataContext'
import { MobileBottomNav } from '../MobileBottomNav'
import { IconAdmin, IconCells, IconDashboard, IconProfile } from '../icons/NavIcons'

const NAV_MAIN = [
  { path: '/', label: 'Dashboard', Icon: IconDashboard, end: true },
  { path: '/bunky', label: 'Buňky', Icon: IconCells },
  { path: '/profil', label: 'Profil', Icon: IconProfile },
  { path: '/admin', label: 'Admin', Icon: IconAdmin, adminOnly: true },
]

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/bunky': 'Buňky',
  '/profil': 'Profil',
  '/admin': 'Admin',
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, tasks, myOpenCount, admin } = useAppData()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

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

  const accessibleBuckets = getAccessibleBuckets(profile)
  const teamBuckets = accessibleBuckets.filter(b => TEAM_BUCKETS.includes(b))
  const specialBuckets = accessibleBuckets.filter(b => SPECIAL_BUCKETS.includes(b))

  const bucketMatch = location.pathname.match(/^\/bunka\/([^/]+)/)
  const activeBucketSlug = bucketMatch?.[1] ?? null
  const activeBucket = activeBucketSlug
    ? accessibleBuckets.find(b => bucketToSlug(b) === activeBucketSlug) ?? null
    : null

  const headerTitle = activeBucket || PAGE_TITLES[location.pathname] || ''

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const statusConfig = {
    active: { label: 'Aktivní' },
    away: { label: 'Zaneprázdněn' },
    needs_help: { label: 'Potřebuji pomoc' },
  }
  const myStatus = statusConfig[profile.status || 'active']

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
          <div className="font-mono text-[28px] font-bold tracking-[-1px] relative inline-block">
            [<span className="text-ctrl-accent">CTRL</span>]
            <span className="absolute inset-0 text-ctrl-danger opacity-0 animate-glitch pointer-events-none" aria-hidden>[CTRL]</span>
          </div>
          <div className="font-mono text-[9px] tracking-[2px] text-ctrl-text2 uppercase mt-0.5">Members Portal</div>
        </div>

        <nav className="flex-1 py-2.5 overflow-y-auto">
          <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">Navigace</div>
          {NAV_MAIN.filter(n => !n.adminOnly || admin).map(n => (
            <NavLink key={n.path} to={n.path} end={n.end} className={navLinkCls}>
              <n.Icon />
              <span>{n.label}</span>
              {n.path === '/' && myOpenCount > 0 && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-ctrl-danger text-white text-[9px] min-w-4 h-4 flex items-center justify-center rounded-lg font-mono animate-badge-pop">{myOpenCount}</span>
              )}
            </NavLink>
          ))}

          {teamBuckets.length > 0 && (
            <>
              <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">Týmové buňky</div>
              {teamBuckets.map(b => (
                <div key={b} className={bucketLinkCls(bucketToSlug(b))} onClick={() => navigate(bucketPath(b))} role="link" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate(bucketPath(b))}>
                  <div className={cn('w-1.5 h-1.5 shrink-0', bucketDotCls(b))} />
                  <span className="text-[11px]">{b}</span>
                </div>
              ))}
            </>
          )}

          {specialBuckets.length > 0 && (
            <>
              <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">Orgány</div>
              {specialBuckets.map(b => (
                <div key={b} className={bucketLinkCls(bucketToSlug(b))} onClick={() => navigate(bucketPath(b))} role="link" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate(bucketPath(b))}>
                  <div className={cn('w-1.5 h-1.5 shrink-0', bucketDotCls(b))} />
                  <span className="text-[11px]">{b}</span>
                </div>
              ))}
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

      <div className="ml-[230px] flex-1 min-h-screen animate-fade-in max-[900px]:ml-0 max-[900px]:pb-[70px]">
        <header className="h-[54px] bg-ctrl-panel border-b border-ctrl-border flex items-center px-7 gap-3 sticky top-0 z-[100] backdrop-blur-md max-[900px]:px-4 max-[900px]:h-[50px]">
          <span className="font-mono text-[10px] tracking-[3px] uppercase text-ctrl-text2">
            [CTRL] · {headerTitle}
          </span>
          {activeBucket && (
            <button
              className="border-0 py-1 px-2.5 text-[10px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text"
              onClick={() => navigate('/bunky')}
            >
              ← Zpět
            </button>
          )}
          {myOpenCount > 0 && !activeBucket && (
            <span className="text-[9px] py-0.5 px-2 font-mono tracking-wide bg-ctrl-accent text-white">
              {myOpenCount} ÚKOLŮ
            </span>
          )}
          {admin && (
            <span className="text-[9px] py-0.5 px-2 font-mono tracking-wide bg-ctrl-danger text-white ml-auto">ADMIN</span>
          )}
        </header>

        <main className="p-7 animate-fade-in max-[900px]:p-4">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav
        accessibleBuckets={accessibleBuckets}
        activeBucketSlug={activeBucketSlug}
        tasks={tasks}
      />
    </div>
  )
}
