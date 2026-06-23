import { useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { Sec } from '../components/ui/Sec'
import { EventModal } from '../components/EventModal'
import { EventsCalendar } from '../components/EventsCalendar'
import { TextWithLinks } from '../components/TextWithLinks'
import { cn } from '../lib/utils'
import { formatDate } from '../lib/format'
import { canManageNews, isAdmin } from '../lib/permissions'
import { canViewerSeeTask } from '../lib/tasks'
import { getMyAssignedOpenTasks } from '../lib/tasks'
import { newsDotCls } from '../constants/styles'
import { useAppData } from '../context/AppDataContext'

export function DashboardPage() {
  const { profile, tasks, news, setNews, events, setEvents, members, loadNotifications } = useAppData()
  const myOpenTasks = useMemo(
    () => getMyAssignedOpenTasks(tasks, profile),
    [tasks, profile]
  )
  const [showAddNews, setShowAddNews] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newNews, setNewNews] = useState({ title: '', body: '', tag: 'INFO', type: 'accent' })
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', time: '', type: 'event' })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [addingNews, setAddingNews] = useState(false)
  const addingNewsRef = useRef(false)
  const canEditNews = canManageNews(profile.layer)
  const admin = isAdmin(profile.layer)

  const isCellScoped = ['vedouci', 'clen'].includes(profile.layer)
  const profileBuckets = (profile.memberships ?? []).map(m => m.bucket)
  const taskInProfileBuckets = (t) => profileBuckets.includes(t.bucket_target)
  const memberInProfileBuckets = (m) =>
    (m.memberships ?? []).some(mm => profileBuckets.includes(mm.bucket))

  const relevantTasks = (isCellScoped ? tasks.filter(taskInProfileBuckets) : tasks).filter(t =>
    canViewerSeeTask(t, profile)
  )
  const deleteNews = async (id) => {
    await supabase.from('news').delete().eq('id', id)
    setNews(prev => prev.filter(n => n.id !== id))
  }

  const addNews = async () => {
    if (addingNewsRef.current || !newNews.title || !newNews.body) return
    addingNewsRef.current = true
    setAddingNews(true)
    try {
      const { data } = await supabase.from('news').insert([{ ...newNews, created_by: profile.id }]).select()
      if (data) {
        setNews(prev => [data[0], ...prev])
        setNewNews({ title: '', body: '', tag: 'INFO', type: 'accent' })
        setShowAddNews(false)
        await loadNotifications(profile.id, profile)
      }
    } finally {
      addingNewsRef.current = false
      setAddingNews(false)
    }
  }

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return
    const { data } = await supabase.from('events').insert([{ ...newEvent, created_by: profile.id }]).select()
    if (data) {
      setEvents(prev => [...prev, data[0]].sort((a, b) => String(b.date).localeCompare(String(a.date))))
      setNewEvent({ title: '', description: '', date: '', time: '', type: 'event' })
      setShowAddEvent(false)
      await loadNotifications(profile.id, profile)
    }
  }

  const totalDone = relevantTasks.filter(t => t.done).length
  const totalOpen = relevantTasks.filter(t => !t.done).length
  const activeMembers = (isCellScoped ? members.filter(memberInProfileBuckets) : members).filter(m => {
    if (!m.last_seen) return false
    return new Date() - new Date(m.last_seen) < 86400000 * 7
  }).length

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="text-[22px] font-extrabold mb-1">
          Vítej zpět, {profile.name.split(' ')[0]} 👋
        </div>
        <div className="font-mono text-[11px] text-ctrl-accent tracking-[2px] mt-1 max-[900px]:text-[10px]">"Take control before someone else does."</div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6 max-[900px]:grid-cols-2 max-[900px]:gap-2">
        <div className="p-5 bg-ctrl-panel border border-ctrl-border border-b-2 border-b-ctrl-accent relative overflow-hidden transition-all duration-[250ms] hover:border-ctrl-border2 hover:-translate-y-px max-[900px]:p-3.5">
          <div className="font-mono text-4xl font-bold leading-none mb-1 max-[900px]:text-[26px] text-ctrl-accent">{totalOpen}</div>
          <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Otevřené úkoly</div>
        </div>
        <div className="p-5 bg-ctrl-panel border border-ctrl-border border-b-2 border-b-ctrl-success relative overflow-hidden transition-all duration-[250ms] hover:border-ctrl-border2 hover:-translate-y-px max-[900px]:p-3.5">
          <div className="font-mono text-4xl font-bold leading-none mb-1 max-[900px]:text-[26px] text-ctrl-success">{totalDone}</div>
          <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Splněné úkoly</div>
        </div>
        <div className="p-5 bg-ctrl-panel border border-ctrl-border border-b-2 border-b-ctrl-warning relative overflow-hidden transition-all duration-[250ms] hover:border-ctrl-border2 hover:-translate-y-px max-[900px]:p-3.5">
          <div className="font-mono text-4xl font-bold leading-none mb-1 max-[900px]:text-[26px] text-ctrl-warning">
            {myOpenTasks.length}
          </div>
          <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Moje úkoly</div>
        </div>
        <div className="p-5 bg-ctrl-panel border border-ctrl-border border-b-2 border-b-ctrl-info relative overflow-hidden transition-all duration-[250ms] hover:border-ctrl-border2 hover:-translate-y-px max-[900px]:p-3.5">
          <div className="font-mono text-4xl font-bold leading-none mb-1 max-[900px]:text-[26px] text-ctrl-info">{activeMembers}</div>
          <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Aktivní tento týden</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1 max-[900px]:gap-8">
        <section className="min-w-0">
          <div className="flex justify-between items-center gap-3 mb-3.5 max-[900px]:mb-4">
            <Sec className="!mb-0">OZNÁMENÍ</Sec>
            {canEditNews && (
              <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px text-[10px] py-1.5 px-3 shrink-0" onClick={() => setShowAddNews(v => !v)}>+ PŘIDAT</button>
            )}
          </div>

          {showAddNews && (
            <div className="bg-ctrl-panel border border-ctrl-accent p-4 mb-3.5 animate-fade-in">
              <div className="flex gap-2.5 mb-2.5 flex-wrap">
                <input className="flex-1 min-w-[140px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Nadpis..." value={newNews.title} onChange={e => setNewNews(p => ({ ...p, title: e.target.value }))} />
                <input className="flex-1 min-w-[140px] max-w-[100px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Tag..." value={newNews.tag} onChange={e => setNewNews(p => ({ ...p, tag: e.target.value }))} />
                <select className="bg-ctrl-bg2 border border-ctrl-border text-ctrl-text2 py-[9px] px-3 text-xs font-sans outline-none cursor-pointer transition-colors duration-200 focus:border-ctrl-accent" value={newNews.type} onChange={e => setNewNews(p => ({ ...p, type: e.target.value }))}>
                  <option value="accent">Modrá</option>
                  <option value="warn">Žlutá</option>
                  <option value="ok">Zelená</option>
                </select>
              </div>
              <div className="flex gap-2.5 mb-2.5 flex-wrap">
                <input className="flex-1 min-w-[140px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Text oznámení... (odkaz: [text](https://...))" value={newNews.body} onChange={e => setNewNews(p => ({ ...p, body: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0" onClick={addNews} disabled={addingNews}>{addingNews ? 'PŘIDÁVÁM...' : 'PŘIDAT'}</button>
                <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text" onClick={() => setShowAddNews(false)}>ZRUŠIT</button>
              </div>
            </div>
          )}

          {news.slice(0, 5).map(n => (
            <div key={n.id} className="py-4 px-5 flex gap-3 bg-ctrl-panel border border-ctrl-border mb-2.5 transition-all duration-200 animate-slide-in hover:border-ctrl-border2 max-[900px]:py-4 max-[900px]:px-4 max-[900px]:gap-3.5 max-[900px]:mb-3">
              <div className={cn('w-[7px] h-[7px] mt-[5px] shrink-0', newsDotCls(n.type))} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold mb-0.5 max-[900px]:text-sm max-[900px]:leading-snug max-[900px]:mb-1">{n.title}</div>
                <TextWithLinks text={n.body} className="text-xs text-ctrl-text2 leading-normal max-[900px]:text-[13px] max-[900px]:leading-relaxed" />
                <div className="font-mono text-[9px] text-ctrl-text3 mt-1 tracking-wide max-[900px]:text-[10px] max-[900px]:mt-2">{formatDate(n.created_at)} · {n.tag}</div>
              </div>
              {canEditNews && <div className="text-[11px] text-ctrl-text3 cursor-pointer ml-auto py-0.5 px-1.5 transition-colors duration-200 shrink-0 hover:text-ctrl-danger" onClick={() => deleteNews(n.id)}>✕</div>}
            </div>
          ))}
          {news.length === 0 && <div className="text-ctrl-text2 text-xs py-2">Žádná oznámení.</div>}
        </section>

        <section className="min-w-0">
          <div className="flex justify-between items-center gap-3 mb-3.5 max-[900px]:mb-4">
            <Sec className="!mb-0">KALENDÁŘ AKCÍ</Sec>
            {admin && <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px text-[10px] py-1.5 px-3 shrink-0" onClick={() => setShowAddEvent(v => !v)}>+ PŘIDAT</button>}
          </div>

          {showAddEvent && (
            <div className="bg-ctrl-panel border border-ctrl-accent p-4 mb-3.5 animate-fade-in">
              <div className="flex gap-2.5 mb-2.5 flex-wrap">
                <input className="flex-1 min-w-[140px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Název akce..." value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} />
                <select className="bg-ctrl-bg2 border border-ctrl-border text-ctrl-text2 py-[9px] px-3 text-xs font-sans outline-none cursor-pointer transition-colors duration-200 focus:border-ctrl-accent" value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}>
                  <option value="event">Akce</option>
                  <option value="deadline">Deadline</option>
                  <option value="meeting">Schůzka</option>
                </select>
              </div>
              <div className="flex gap-2.5 mb-2.5 flex-wrap">
                <input className="flex-1 min-w-[140px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} />
                <input className="flex-1 min-w-[140px] max-w-[120px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" type="time" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} />
              </div>
              <div className="flex gap-2.5 mb-2.5 flex-wrap">
                <input className="flex-1 min-w-[140px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Popis..." value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={addEvent}>PŘIDAT</button>
                <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text" onClick={() => setShowAddEvent(false)}>ZRUŠIT</button>
              </div>
            </div>
          )}

          <EventsCalendar events={events} onSelectEvent={setSelectedEvent} />
        </section>
      </div>

      <section className="mt-8">
        <Sec>ČLÁNKY</Sec>
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-ctrl-panel border border-ctrl-border border-dashed text-center gap-2">
          <div className="font-mono text-[10px] tracking-[3px] uppercase text-ctrl-text3">Články se chystají</div>
        </div>
      </section>

      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  )
}
