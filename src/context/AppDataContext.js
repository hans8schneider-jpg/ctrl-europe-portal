import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { canAccessAdminPanel, isAdmin } from '../lib/permissions'
import { canViewerSeeTask } from '../lib/tasks'
import { applyBucketRows } from '../constants/buckets'
import {
  fetchNotificationsForUser,
  markNotificationsRead,
  notificationVisibleToProfile,
} from '../lib/notifications'

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
    setNotifications(data.filter(n => notificationVisibleToProfile(n, currentProfile)))
  }, [])

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
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*').order('name'),
        supabase.from('buckets').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      ])
      if (bucketData) {
        applyBucketRows(bucketData)
        setBucketCatalogVersion(v => v + 1)
      }
      if (prof) setProfile(prof)
      if (taskData) setTasks(taskData)
      if (newsData) setNews(newsData)
      if (eventData) setEvents(eventData)
      if (memberData) setMembers(memberData)
      if (prof) await loadNotifications(session.user.id, prof)
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

    const mergeMemberRow = row => {
      if (!row?.id) return
      const id = String(row.id)
      setMembers(prev => {
        const idx = prev.findIndex(m => String(m.id) === id)
        if (idx === -1) {
          return [...prev, row].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'))
        }
        const next = [...prev]
        next[idx] = { ...next[idx], ...row }
        return next
      })
      setProfile(prev => (prev && String(prev.id) === id ? { ...prev, ...row } : prev))
    }

    const channel = supabase
      .channel('app-data-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => {
        mergeMemberRow(payload.new)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        mergeMemberRow(payload.new)
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
        if (!row?.id || !prof || !notificationVisibleToProfile(row, prof)) return
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
    const buckets = [profile.bucket, profile.secondary_bucket].filter(Boolean)
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

  const admin = profile ? isAdmin(profile.layer) : false
  const adminPanelAccess = profile ? canAccessAdminPanel(profile.layer) : false

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
