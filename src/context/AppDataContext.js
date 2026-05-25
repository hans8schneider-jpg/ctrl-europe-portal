import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { canAccessAdminPanel, isAdmin } from '../lib/permissions'
import {
  fetchNotificationsForUser,
  markNotificationsRead,
  notificationVisibleToProfile,
} from '../lib/notifications'

const AppDataContext = createContext(null)

export function AppDataProvider({ session, children }) {
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState([])
  const [news, setNews] = useState([])
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const touchLastSeen = useCallback(async () => {
    if (!session?.user?.id) return
    const now = new Date().toISOString()
    await supabase.from('profiles').update({ last_seen: now }).eq('id', session.user.id)
    const userId = session.user.id
    setProfile(prev => (prev && String(prev.id) === String(userId) ? { ...prev, last_seen: now } : prev))
    setMembers(prev => prev.map(m => (String(m.id) === String(userId) ? { ...m, last_seen: now } : m)))
  }, [session])

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

      const [{ data: prof }, { data: taskData }, { data: newsData }, { data: eventData }, { data: memberData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*').order('name'),
      ])
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

  const myOpenCount = useMemo(() => {
    if (!profile) return 0
    return tasks.filter(t => !t.done && (t.bucket_target === profile.bucket || t.bucket_target === 'all')).length
  }, [tasks, profile])

  const openCountByBucket = useMemo(() => {
    const counts = {}
    for (const t of tasks) {
      if (t.done || !t.bucket_target) continue
      counts[t.bucket_target] = (counts[t.bucket_target] || 0) + 1
    }
    return counts
  }, [tasks])

  const unreadNotificationCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  )

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
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
