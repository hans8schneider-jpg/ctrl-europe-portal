import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { isAdmin } from '../lib/permissions'

const AppDataContext = createContext(null)

export function AppDataProvider({ session, children }) {
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState([])
  const [news, setNews] = useState([])
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    const load = async () => {
      await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', session.user.id)

      const [{ data: prof }, { data: taskData }, { data: newsData }, { data: eventData }, { data: memberData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('profiles').select('*').order('name'),
      ])
      if (prof) setProfile(prof)
      if (taskData) setTasks(taskData)
      if (newsData) setNews(newsData)
      if (eventData) setEvents(eventData)
      if (memberData) setMembers(memberData)
      setLoading(false)
    }
    load()
  }, [session])

  const myOpenCount = useMemo(() => {
    if (!profile) return 0
    return tasks.filter(t => !t.done && (t.bucket_target === profile.bucket || t.bucket_target === 'all')).length
  }, [tasks, profile])

  const admin = profile ? isAdmin(profile.layer) : false

  const value = {
    profile,
    setProfile,
    tasks,
    setTasks,
    news,
    setNews,
    events,
    members,
    loading,
    myOpenCount,
    admin,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
