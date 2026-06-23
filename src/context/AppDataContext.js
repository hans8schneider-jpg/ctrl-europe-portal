import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { canAccessAdminPanel, getEffectiveLayer, getHighestMembershipLayer, isAdmin } from '../lib/permissions'
import { canViewerSeeTask } from '../lib/tasks'
import { applyBucketRows } from '../constants/buckets'
import {
  fetchNotificationsForUser,
  filterInAppNotifications,
  markNotificationsRead,
  notificationVisibleToProfile,
} from '../lib/notifications'
import { inAppAllowedForProfile } from '../lib/notificationPreferences'

const AppDataContext = createContext(null)
const LAST_SEEN_INTERVAL_MS = 5 * 60 * 1000

function readLastSeenTouchTs(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? Number(raw) : 0
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

/**
 * Obohatí profil o:
 * - memberships: pole z profile_memberships
 * - bucket: primární buňka (z is_primary členství)
 * - layer: efektivní layer (globální role NEBO nejvyšší membership layer)
 */
function enrichProfile(p) {
  if (!p) return p
  const memberships = p.profile_memberships || []
  const primary = memberships.find(m => m.is_primary)
  const globalLayer = p.layer  // admin, developer, pozorovatel, nebo null
  const derivedLayer = globalLayer || getHighestMembershipLayer(memberships)
  return {
    ...p,
    memberships,
    bucket: primary?.bucket ?? p.bucket ?? null,
    layer: derivedLayer,
  }
}

export function AppDataProvider({ session, children }) {
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState([])
  const [news, setNews] = useState([])
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [bucketCatalogVersion, setBucketCatalogVersion] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const touchLastSeen = useCallback(async () => {
    if (!session?.user?.id) return
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    const storageKey = `ctrl:last-seen-touch:${session.user.id}`
    const lastTouchTs = readLastSeenTouchTs(storageKey)
    const nowTs = Date.now()
    if (lastTouchTs && nowTs - lastTouchTs < LAST_SEEN_INTERVAL_MS) return

    const now = new Date().toISOString()
    const { error } = await supabase.from('profiles').update({ last_seen: now }).eq('id', session.user.id)
    if (error) return
    try {
      localStorage.setItem(storageKey, String(nowTs))
    } catch {}

    const userId = session.user.id
    setProfile(prev => (prev && String(prev.id) === String(userId) ? { ...prev, last_seen: now } : prev))
    setMembers(prev => prev.map(m => (String(m.id) === String(userId) ? { ...m, last_seen: now } : m)))
  }, [session])

  useEffect(() => {
    if (!session?.user?.id) return

    touchLastSeen()

    const heartbeat = setInterval(() => {
      touchLastSeen()
    }, LAST_SEEN_INTERVAL_MS)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') touchLastSeen()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [session?.user?.id, touchLastSeen])

  const loadNotifications = useCallback(async (userId, currentProfile) => {
    if (!userId || !currentProfile) return
    const { data } = await fetchNotificationsForUser(userId)
    setNotifications(filterInAppNotifications(data, currentProfile))
  }, [])

  useEffect(() => {
    if (!profile) return
    setNotifications(prev => prev.filter(n => inAppAllowedForProfile(n, profile)))
  }, [
    profile,
    profile?.notify_inapp_tasks,
    profile?.notify_inapp_news,
    profile?.notify_inapp_events,
    profile?.notify_inapp_mentions,
  ])

  const markNotificationsAsRead = useCallback(async (notificationIds) => {
    if (!session?.user?.id || !notificationIds?.length) return
    const ids = [...new Set(notificationIds.map(String))]
    const { error } = await markNotificationsRead(ids, session.user.id)
    if (error) return
    setNotifications(prev =>
      prev.map(n => (ids.includes(String(n.id)) ? { ...n, read: true } : n))
    )
  }, [session])

  useEffect(() => {
    if (!session) return
    const load = async () => {
      await touchLastSeen()

      const [
        { data: prof },
        { data: taskData },
        { data: newsData },
        { data: eventData },
        { data: memberData },
        { data: bucketData },
      ] = await Promise.all([
        supabase.from('profiles').select('*, profile_memberships(*)').eq('id', session.user.id).single(),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*, profile_memberships(*)').order('name'),
        supabase.from('buckets').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      ])
      if (bucketData) {
        applyBucketRows(bucketData)
        setBucketCatalogVersion(v => v + 1)
      }
      if (prof) setProfile(enrichProfile(prof))
      if (taskData) setTasks(taskData)
      if (newsData) setNews(newsData)
      if (eventData) setEvents(eventData)
      if (memberData) setMembers(memberData.map(enrichProfile))
      if (prof) await loadNotifications(session.user.id, enrichProfile(prof))
      setLoading(false)
    }
    load()
  }, [session, touchLastSeen, loadNotifications])

  const profileRef = useRef(profile)
  const sessionUserIdRef = useRef(session?.user?.id)
  useEffect(() => {
    profileRef.current = profile
  }, [profile])
  useEffect(() => {
    sessionUserIdRef.current = session?.user?.id
  }, [session?.user?.id])

  useEffect(() => {
    if (!session) return

    const refreshBuckets = async () => {
      const { data } = await supabase
        .from('buckets')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (data) {
        applyBucketRows(data)
        setBucketCatalogVersion(v => v + 1)
      }
    }

    /**
     * Při realtime updatu profilu znovu načteme jeho memberships z DB,
     * protože postgres_changes vrací jen sloupce profiles tabulky.
     */
    const refreshProfileWithMemberships = async (profileId) => {
      const { data } = await supabase
        .from('profiles')
        .select('*, profile_memberships(*)')
        .eq('id', profileId)
        .single()
      if (!data) return null
      return enrichProfile(data)
    }

    const mergeMemberRow = async (row) => {
      if (!row?.id) return
      const id = String(row.id)
      const enriched = await refreshProfileWithMemberships(id)
      if (!enriched) return
      setMembers(prev => {
        const idx = prev.findIndex(m => String(m.id) === id)
        if (idx === -1) {
          return [...prev, enriched].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'))
        }
        const next = [...prev]
        next[idx] = enriched
        return next
      })
      setProfile(prev => (prev && String(prev.id) === id ? enriched : prev))
    }

    /** Při změně členství znovu načteme dotčený profil. */
    const handleMembershipChange = async (profileId) => {
      if (!profileId) return
      await mergeMemberRow({ id: profileId })
    }

    const channel = supabase
      .channel('app-data-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => {
        mergeMemberRow(payload.new)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        mergeMemberRow(payload.new)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profile_memberships' }, payload => {
        handleMembershipChange(payload.new?.profile_id)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profile_memberships' }, payload => {
        handleMembershipChange(payload.new?.profile_id)
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profile_memberships' }, payload => {
        handleMembershipChange(payload.old?.profile_id)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, payload => {
        const row = payload.new
        if (!row?.id) return
        setTasks(prev => {
          const id = String(row.id)
          if (prev.some(t => String(t.id) === id)) {
            return prev.map(t => (String(t.id) === id ? { ...t, ...row } : t))
          }
          return [row, ...prev]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, payload => {
        const row = payload.new
        if (!row?.id) return
        const id = String(row.id)
        setTasks(prev => prev.map(t => (String(t.id) === id ? { ...t, ...row } : t)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, payload => {
        const id = payload.old?.id
        if (id == null) return
        setTasks(prev => prev.filter(t => String(t.id) !== String(id)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, payload => {
        const row = payload.new
        if (!row?.id) return
        setNews(prev => {
          const id = String(row.id)
          if (prev.some(n => String(n.id) === id)) return prev
          return [row, ...prev].slice(0, 20)
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'news' }, payload => {
        const id = payload.old?.id
        if (id == null) return
        setNews(prev => prev.filter(n => String(n.id) !== String(id)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
        const row = payload.new
        if (!row?.id) return
        setEvents(prev => {
          const id = String(row.id)
          if (prev.some(e => String(e.id) === id)) return prev
          return [...prev, row].sort((a, b) => String(b.date).localeCompare(String(a.date)))
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, payload => {
        const row = payload.new
        if (!row?.id) return
        const id = String(row.id)
        setEvents(prev =>
          prev
            .map(e => (String(e.id) === id ? { ...e, ...row } : e))
            .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        )
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events' }, payload => {
        const id = payload.old?.id
        if (id == null) return
        setEvents(prev => prev.filter(e => String(e.id) !== String(id)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        const row = payload.new
        const prof = profileRef.current
        if (!row?.id || !prof || !notificationVisibleToProfile(row, prof) || !inAppAllowedForProfile(row, prof)) return
        setNotifications(prev => {
          const id = String(row.id)
          if (prev.some(n => String(n.id) === id)) return prev
          return [{ ...row, read: false }, ...prev].slice(0, 50)
        })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notification_reads' }, payload => {
        const row = payload.new
        const userId = sessionUserIdRef.current
        if (!row?.notification_id || !userId || String(row.user_id) !== String(userId)) return
        const nid = String(row.notification_id)
        setNotifications(prev =>
          prev.map(n => (String(n.id) === nid ? { ...n, read: true } : n))
        )
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notification_reads' }, payload => {
        const row = payload.new
        const userId = sessionUserIdRef.current
        if (!row?.notification_id || !userId || String(row.user_id) !== String(userId)) return
        const nid = String(row.notification_id)
        setNotifications(prev =>
          prev.map(n => (String(n.id) === nid ? { ...n, read: true } : n))
        )
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'buckets' }, () => {
        refreshBuckets()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'buckets' }, () => {
        refreshBuckets()
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'buckets' }, () => {
        refreshBuckets()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  const myOpenCount = useMemo(() => {
    if (!profile) return 0
    const buckets = (profile.memberships ?? []).map(m => m.bucket)
    return tasks.filter(
      t =>
        !t.done &&
        (t.bucket_target === 'all' || buckets.includes(t.bucket_target)) &&
        canViewerSeeTask(t, profile)
    ).length
  }, [tasks, profile])

  const openCountByBucket = useMemo(() => {
    if (!profile) return {}
    const counts = {}
    for (const t of tasks) {
      if (t.done || !t.bucket_target) continue
      if (!canViewerSeeTask(t, profile)) continue
      counts[t.bucket_target] = (counts[t.bucket_target] || 0) + 1
    }
    return counts
  }, [tasks, profile])

  const unreadNotificationCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  )

  const mentionCountByBucket = useMemo(() => {
    const counts = {}
    for (const n of notifications) {
      if (n.type !== 'mention' || n.read || !n.bucket_target) continue
      counts[n.bucket_target] = (counts[n.bucket_target] || 0) + 1
    }
    return counts
  }, [notifications])

  const patchMember = useCallback((memberId, patch) => {
    setMembers(prev =>
      prev.map(m => (String(m.id) === String(memberId) ? { ...m, ...patch } : m))
    )
  }, [])

  const admin = profile ? isAdmin(getEffectiveLayer(profile)) : false
  const adminPanelAccess = profile ? canAccessAdminPanel(profile) : false

  const value = {
    profile,
    setProfile,
    tasks,
    setTasks,
    news,
    setNews,
    events,
    setEvents,
    members,
    patchMember,
    notifications,
    setNotifications,
    loadNotifications,
    markNotificationsAsRead,
    unreadNotificationCount,
    touchLastSeen,
    loading,
    myOpenCount,
    openCountByBucket,
    admin,
    adminPanelAccess,
    bucketCatalogVersion,
    mentionCountByBucket,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
