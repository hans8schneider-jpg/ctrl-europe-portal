import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'
const cn = (...parts) => parts.filter(Boolean).join(' ')

const tagCls = {
  podcast: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-[rgba(180,79,255,0.12)] text-[#b44fff]'),
  research: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-[rgba(0,229,160,0.1)] text-ctrl-success'),
  social: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-[rgba(255,184,0,0.1)] text-ctrl-warning'),
  event: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-[rgba(255,51,102,0.1)] text-ctrl-danger'),
  other: cn('font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase shrink-0', 'bg-ctrl-panel2 text-ctrl-text2'),
}

const eventTypeCls = {
  event: cn('font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase shrink-0', 'bg-[rgba(42,107,255,0.12)] text-ctrl-accent'),
  deadline: cn('font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase shrink-0', 'bg-[rgba(255,51,102,0.1)] text-ctrl-danger'),
  meeting: cn('font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase shrink-0', 'bg-[rgba(0,229,160,0.1)] text-ctrl-success'),
}

const lastSeenCls = (kind) => ({
  good: 'text-ctrl-success',
  ok: 'text-ctrl-warning',
  bad: 'text-ctrl-danger',
  never: 'text-ctrl-text3',
}[kind] || 'text-ctrl-text3')

function Sec({ children, className = '' }) {
  return (
    <div className={cn('font-mono text-[9px] tracking-[3px] uppercase text-ctrl-text2 mb-3.5 flex items-center gap-2.5', className)}>
      <span className="shrink-0">{children}</span>
      <div className="flex-1 h-px bg-ctrl-border" />
    </div>
  )
}


const ROLE_HIERARCHY = {
  admin: 6,
  predsednictvo: 5,
  zastupce_predsednictva: 4,
  vedouci: 3,
  clen: 2,
  pozorovatel: 1,
}

const ROLE_LABELS = {
  admin: 'Admin',
  predsednictvo: 'Předsednictvo',
  zastupce_predsednictva: 'Zástupce předsednictva',
  vedouci: 'Vedoucí buňky',
  clen: 'Člen',
  pozorovatel: 'Pozorovatel',
}

const TEAM_BUCKETS = [
  'PR a komunikace', 'Sociální sítě', 'Podcast', 'Research',
  'Grafika', 'Video', 'Mezinárodní', 'Eventy',
]
const SPECIAL_BUCKETS = ['Rada zástupců', 'Předsednictvo']
const ALL_BUCKETS = [...TEAM_BUCKETS, ...SPECIAL_BUCKETS]

const getInitials = (n) => n ? n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() : '??'

const newsDotCls = (type) => ({
  warn: 'bg-ctrl-warning',
  ok: 'bg-ctrl-success',
  accent: 'bg-ctrl-accent',
}[type] || 'bg-ctrl-accent')

const ROLE_BADGE_CLS = {
  admin: 'bg-[rgba(255,51,102,0.12)] text-ctrl-danger',
  predsednictvo: 'bg-[rgba(180,79,255,0.12)] text-[#b44fff]',
  zastupce_predsednictva: 'bg-[rgba(119,68,255,0.12)] text-[#7744ff]',
  vedouci: 'bg-[rgba(42,107,255,0.12)] text-ctrl-accent',
  clen: 'bg-[rgba(0,229,160,0.12)] text-ctrl-success',
  pozorovatel: 'bg-ctrl-panel2 text-ctrl-text2',
}
const roleBadgeCls = (layer) => ROLE_BADGE_CLS[layer] || ROLE_BADGE_CLS.clen

const BUCKET_AV_CLS = {
  'PR a komunikace': 'bg-[rgba(42,107,255,0.15)] border border-[rgba(42,107,255,0.31)] text-[#2A6BFF]',
  'Sociální sítě': 'bg-[rgba(255,184,0,0.15)] border border-[rgba(255,184,0,0.31)] text-[#ffb800]',
  'Podcast': 'bg-[rgba(180,79,255,0.15)] border border-[rgba(180,79,255,0.31)] text-[#b44fff]',
  'Research': 'bg-[rgba(0,201,255,0.15)] border border-[rgba(0,201,255,0.31)] text-[#00c9ff]',
  'Grafika': 'bg-[rgba(255,107,53,0.15)] border border-[rgba(255,107,53,0.31)] text-[#ff6b35]',
  'Video': 'bg-[rgba(255,51,102,0.15)] border border-[rgba(255,51,102,0.31)] text-ctrl-danger',
  'Mezinárodní': 'bg-[rgba(0,229,160,0.15)] border border-[rgba(0,229,160,0.31)] text-ctrl-success',
  'Eventy': 'bg-[rgba(0,229,160,0.15)] border border-[rgba(0,229,160,0.31)] text-ctrl-success',
  'Rada zástupců': 'bg-[rgba(255,184,0,0.15)] border border-[rgba(255,184,0,0.31)] text-[#ffb800]',
  'Předsednictvo': 'bg-[rgba(180,79,255,0.15)] border border-[rgba(180,79,255,0.31)] text-[#b44fff]',
}
const bucketAvCls = (bucket) => BUCKET_AV_CLS[bucket] || 'bg-[rgba(42,107,255,0.15)] border border-[rgba(42,107,255,0.31)] text-ctrl-accent'

const BUCKET_DOT_CLS = {
  'PR a komunikace': 'bg-[#2A6BFF]',
  'Sociální sítě': 'bg-[#ffb800]',
  'Podcast': 'bg-[#b44fff]',
  'Research': 'bg-[#00c9ff]',
  'Grafika': 'bg-[#ff6b35]',
  'Video': 'bg-[#ff3366]',
  'Mezinárodní': 'bg-[#00e5a0]',
  'Eventy': 'bg-[#00e5a0]',
  'Rada zástupců': 'bg-[#ffb800]',
  'Předsednictvo': 'bg-[#b44fff]',
}
const bucketDotCls = (bucket) => BUCKET_DOT_CLS[bucket] || 'bg-ctrl-accent'
const bucketBarCls = (bucket) => BUCKET_DOT_CLS[bucket] || 'bg-ctrl-accent'

const BUCKET_MEMBER_AV_CLS = {
  'PR a komunikace': 'bg-[rgba(42,107,255,0.13)] border border-[rgba(42,107,255,0.27)] text-[#2A6BFF]',
  'Sociální sítě': 'bg-[rgba(255,184,0,0.13)] border border-[rgba(255,184,0,0.27)] text-[#ffb800]',
  'Podcast': 'bg-[rgba(180,79,255,0.13)] border border-[rgba(180,79,255,0.27)] text-[#b44fff]',
  'Research': 'bg-[rgba(0,201,255,0.13)] border border-[rgba(0,201,255,0.27)] text-[#00c9ff]',
  'Grafika': 'bg-[rgba(255,107,53,0.13)] border border-[rgba(255,107,53,0.27)] text-[#ff6b35]',
  'Video': 'bg-[rgba(255,51,102,0.13)] border border-[rgba(255,51,102,0.27)] text-[#ff3366]',
  'Mezinárodní': 'bg-[rgba(0,229,160,0.13)] border border-[rgba(0,229,160,0.27)] text-[#00e5a0]',
  'Eventy': 'bg-[rgba(0,229,160,0.13)] border border-[rgba(0,229,160,0.27)] text-[#00e5a0]',
  'Rada zástupců': 'bg-[rgba(255,184,0,0.13)] border border-[rgba(255,184,0,0.27)] text-[#ffb800]',
  'Předsednictvo': 'bg-[rgba(180,79,255,0.13)] border border-[rgba(180,79,255,0.27)] text-[#b44fff]',
}
const bucketMemberAvCls = (bucket) => BUCKET_MEMBER_AV_CLS[bucket] || 'bg-[rgba(42,107,255,0.13)] border border-[rgba(42,107,255,0.27)] text-ctrl-accent'

const BUCKET_ORGAN_BADGE_CLS = {
  'PR a komunikace': 'bg-[rgba(42,107,255,0.13)] text-[#2A6BFF]',
  'Sociální sítě': 'bg-[rgba(255,184,0,0.13)] text-[#ffb800]',
  'Podcast': 'bg-[rgba(180,79,255,0.13)] text-[#b44fff]',
  'Research': 'bg-[rgba(0,201,255,0.13)] text-[#00c9ff]',
  'Grafika': 'bg-[rgba(255,107,53,0.13)] text-[#ff6b35]',
  'Video': 'bg-[rgba(255,51,102,0.13)] text-[#ff3366]',
  'Mezinárodní': 'bg-[rgba(0,229,160,0.13)] text-[#00e5a0]',
  'Eventy': 'bg-[rgba(0,229,160,0.13)] text-[#00e5a0]',
  'Rada zástupců': 'bg-[rgba(255,184,0,0.13)] text-[#ffb800]',
  'Předsednictvo': 'bg-[rgba(180,79,255,0.13)] text-[#b44fff]',
}
const bucketOrganBadgeCls = (bucket) => BUCKET_ORGAN_BADGE_CLS[bucket] || 'bg-[rgba(42,107,255,0.13)] text-ctrl-accent'

const STATUS_OPT_CLS = {
  active: 'text-ctrl-success border-ctrl-success',
  away: 'text-ctrl-warning border-ctrl-warning',
  needs_help: 'text-ctrl-danger border-ctrl-danger',
}

const formatTime = (ts) => {
  if (!ts) return 'Nikdy'
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Právě teď'
  if (diff < 3600000) return `Před ${Math.floor(diff / 60000)} min`
  if (diff < 86400000) return `Před ${Math.floor(diff / 3600000)} hod`
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getDate()}. ${d.getMonth() + 1}. · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const canAddTasks = (role) => ['admin', 'vedouci'].includes(role)
const canSeeAllBuckets = (role) => role === 'admin'
const canObserveAll = (role) => ['admin', 'pozorovatel'].includes(role)
const isAdmin = (role) => role === 'admin'

const getAccessibleBuckets = (profile) => {
  if (!profile) return []
  const { layer, bucket, secondary_bucket } = profile
  if (layer === 'admin') return ALL_BUCKETS
  if (layer === 'pozorovatel') return TEAM_BUCKETS
  const buckets = [bucket]
  if (secondary_bucket) buckets.push(secondary_bucket)
  if (layer === 'vedouci') buckets.push('Rada zástupců')
  if (layer === 'predsednictvo' || layer === 'zastupce_predsednictva') buckets.push('Předsednictvo')
  return [...new Set(buckets)]
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return setError('// Vyplň email a heslo')
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError('// ' + (err.message.includes('Invalid') ? 'Chybný email nebo heslo' : err.message))
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-ctrl-bg [background:radial-gradient(ellipse_100%_80%_at_50%_-10%,rgba(42,107,255,0.15)_0%,transparent_60%),#050508]">
      <div className="w-full max-w-[400px] bg-ctrl-panel border border-ctrl-border py-12 px-10 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-0.5 animate-glow bg-gradient-to-r from-transparent via-ctrl-accent to-transparent" aria-hidden />
        <div className="absolute bottom-5 right-5 font-mono text-[10px] text-ctrl-text3 tracking-[2px] opacity-50 pointer-events-none" aria-hidden>[CTRL]</div>
        <div className="font-mono text-[44px] font-bold tracking-[-2px] mb-1">[<span className="text-ctrl-accent [text-shadow:0_0_20px_rgba(42,107,255,0.5)]">CTRL</span>]</div>
        <div className="font-mono text-[10px] tracking-[3px] text-ctrl-text2 uppercase mb-10">Members Portal · CEE Youth Platform</div>
        <div className="font-mono text-[10px] text-ctrl-text2 mb-8 tracking-wide italic">
          "Take control before someone else does."
        </div>
        <div className="font-mono text-[10px] tracking-[2px] uppercase text-ctrl-text2 mb-2">Email</div>
        <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[13px] px-4 text-sm font-sans outline-none transition-all duration-[250ms] mb-5 block focus:border-ctrl-accent focus:shadow-[0_0_0_3px_rgba(42,107,255,0.1)]" type="email" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="tvuj@email.cz" autoComplete="email" />
        <div className="font-mono text-[10px] tracking-[2px] uppercase text-ctrl-text2 mb-2">Heslo</div>
        <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[13px] px-4 text-sm font-sans outline-none transition-all duration-[250ms] mb-5 block focus:border-ctrl-accent focus:shadow-[0_0_0_3px_rgba(42,107,255,0.1)]" type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" autoComplete="current-password" />
        <button className="w-full bg-ctrl-accent text-white border-0 py-[15px] text-[13px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 mt-1 hover:bg-ctrl-accent2 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleLogin} disabled={loading}>
          {loading ? 'PŘIHLAŠUJI...' : 'PŘIHLÁSIT SE →'}
        </button>
        {error && <div className="text-ctrl-danger text-[11px] mt-2.5 font-mono">{error}</div>}
      </div>
    </div>
  )
}

function Dashboard({ profile, tasks, news, setNews, events, members }) {
  const [showAddNews, setShowAddNews] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newNews, setNewNews] = useState({ title: '', body: '', tag: 'INFO', type: 'accent' })
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', time: '', type: 'event' })
  const admin = isAdmin(profile.layer)

  const myOpenTasks = tasks.filter(t => !t.done && (t.bucket_target === 'all' || t.bucket_target === profile.bucket))

  const deleteNews = async (id) => {
    await supabase.from('news').delete().eq('id', id)
    setNews(prev => prev.filter(n => n.id !== id))
  }

  const addNews = async () => {
    if (!newNews.title || !newNews.body) return
    const { data } = await supabase.from('news').insert([{ ...newNews, created_by: profile.id }]).select()
    if (data) { setNews(prev => [data[0], ...prev]); setNewNews({ title: '', body: '', tag: 'INFO', type: 'accent' }); setShowAddNews(false) }
  }

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return
    await supabase.from('events').insert([{ ...newEvent, created_by: profile.id }])
    setShowAddEvent(false)
    window.location.reload()
  }

  const totalDone = tasks.filter(t => t.done).length
  const totalOpen = tasks.filter(t => !t.done).length
  const activeMembers = members.filter(m => {
    if (!m.last_seen) return false
    return new Date() - new Date(m.last_seen) < 86400000 * 7
  }).length

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="text-[22px] font-extrabold mb-1">
          Vítej zpět, {profile.name.split(' ')[0]} 👋
        </div>
        <div className="font-mono text-[11px] text-ctrl-accent tracking-[2px] opacity-60 mt-1 max-[900px]:text-[10px]">"Take control before someone else does."</div>
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
          <div className="font-mono text-4xl font-bold leading-none mb-1 max-[900px]:text-[26px] text-ctrl-warning">{myOpenTasks.length}</div>
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
            {admin && (
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
                <input className="flex-1 min-w-[140px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Text oznámení..." value={newNews.body} onChange={e => setNewNews(p => ({ ...p, body: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={addNews}>PŘIDAT</button>
                <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text" onClick={() => setShowAddNews(false)}>ZRUŠIT</button>
              </div>
            </div>
          )}

          {news.slice(0, 5).map(n => (
            <div key={n.id} className="py-4 px-5 flex gap-3 bg-ctrl-panel border border-ctrl-border mb-2.5 transition-all duration-200 animate-slide-in hover:border-ctrl-border2 max-[900px]:py-4 max-[900px]:px-4 max-[900px]:gap-3.5 max-[900px]:mb-3">
              <div className={cn('w-[7px] h-[7px] mt-[5px] shrink-0', newsDotCls(n.type))} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold mb-0.5 max-[900px]:text-sm max-[900px]:leading-snug max-[900px]:mb-1">{n.title}</div>
                <div className="text-xs text-ctrl-text2 leading-normal max-[900px]:text-[13px] max-[900px]:leading-relaxed">{n.body}</div>
                <div className="font-mono text-[9px] text-ctrl-text3 mt-1 tracking-wide max-[900px]:text-[10px] max-[900px]:mt-2">{formatDate(n.created_at)} · {n.tag}</div>
              </div>
              {admin && <div className="text-[11px] text-ctrl-text3 cursor-pointer ml-auto py-0.5 px-1.5 transition-colors duration-200 shrink-0 hover:text-ctrl-danger" onClick={() => deleteNews(n.id)}>✕</div>}
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

          {events.slice(0, 6).map(e => (
            <div key={e.id} className="py-4 px-5 bg-ctrl-panel border border-ctrl-border mb-2.5 transition-all duration-200 hover:border-ctrl-border2 max-[900px]:py-4 max-[900px]:px-4 max-[900px]:mb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-mono text-[11px] text-ctrl-accent tracking-wide max-[900px]:text-xs">{e.date}{e.time && ` · ${e.time}`}</div>
                <span className={eventTypeCls[e.type] || eventTypeCls.event}>{e.type === 'event' ? 'AKCE' : e.type === 'deadline' ? 'DEADLINE' : 'SCHŮZKA'}</span>
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold leading-snug max-[900px]:text-sm">{e.title}</div>
                {e.description && <div className="text-xs text-ctrl-text2 mt-1.5 leading-relaxed max-[900px]:text-[13px]">{e.description}</div>}
              </div>
            </div>
          ))}
          {events.length === 0 && <div className="text-ctrl-text2 text-xs py-2">Žádné nadcházející akce.</div>}
        </section>
      </div>
    </div>
  )
}

function Tasks({ profile, tasks, setTasks, activeBucket }) {
  const [showAdd, setShowAdd] = useState(false)
  const [activeTab, setActiveTab] = useState('open')
  const [newTask, setNewTask] = useState({ name: '', assignee: '', due: '', tag: 'other', bucket_target: activeBucket || 'all' })
  const canAdd = canAddTasks(profile.layer)
  const admin = isAdmin(profile.layer)

  const myTasks = admin
    ? tasks.filter(t => t.bucket_target === activeBucket || activeBucket === 'all' || !activeBucket)
    : tasks.filter(t => t.bucket_target === profile.bucket || t.bucket_target === 'all')

  const openTasks = myTasks.filter(t => !t.done)
  const doneTasks = myTasks.filter(t => t.done)
  const displayTasks = activeTab === 'open' ? openTasks : doneTasks

  const toggleTask = async (task) => {
    if (profile.layer === 'pozorovatel') return
    const updates = {
      done: !task.done,
      completed_by: !task.done ? profile.id : null,
      completed_at: !task.done ? new Date().toISOString() : null
    }
    const { error } = await supabase.from('tasks').update(updates).eq('id', task.id)
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t))
  }

  const addTask = async () => {
    if (!newTask.name.trim()) return
    const { data } = await supabase.from('tasks').insert([{ ...newTask, created_by: profile.id }]).select()
    if (data) { setTasks(prev => [...prev, data[0]]); setNewTask({ name: '', assignee: '', due: '', tag: 'other', bucket_target: activeBucket || 'all' }); setShowAdd(false) }
  }

  const getCompletorName = (task) => {
    return task.completed_at ? `Splněno ${formatDate(task.completed_at)}` : ''
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <Sec className="!mb-0">ÚKOLY {activeBucket && `· ${activeBucket}`}</Sec>
        {canAdd && profile.layer !== 'pozorovatel' && (
          <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={() => setShowAdd(v => !v)}>+ PŘIDAT ÚKOL</button>
        )}
      </div>

      {showAdd && canAdd && (
        <div className="bg-ctrl-panel border border-ctrl-accent p-4 mb-3.5 animate-fade-in">
          <div className="flex gap-2.5 mb-2.5 flex-wrap">
            <input className="flex-1 min-w-[140px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Název úkolu..." value={newTask.name} onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))} />
            <input className="flex-1 min-w-[140px] max-w-[160px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Přiřadit..." value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))} />
            <input className="flex-1 min-w-[140px] max-w-[120px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Termín..." value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))} />
          </div>
          <div className="flex gap-2.5 mb-2.5 flex-wrap">
            <select className="bg-ctrl-bg2 border border-ctrl-border text-ctrl-text2 py-[9px] px-3 text-xs font-sans outline-none cursor-pointer transition-colors duration-200 focus:border-ctrl-accent" value={newTask.tag} onChange={e => setNewTask(p => ({ ...p, tag: e.target.value }))}>
              <option value="other">Obecné</option>
              <option value="podcast">Podcast</option>
              <option value="research">Research</option>
              <option value="social">Social</option>
              <option value="event">Event</option>
            </select>
            {admin && (
              <select className="bg-ctrl-bg2 border border-ctrl-border text-ctrl-text2 py-[9px] px-3 text-xs font-sans outline-none cursor-pointer transition-colors duration-200 focus:border-ctrl-accent" value={newTask.bucket_target} onChange={e => setNewTask(p => ({ ...p, bucket_target: e.target.value }))}>
                <option value="all">Všechny buňky</option>
                {ALL_BUCKETS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={addTask}>PŘIDAT</button>
            <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text" onClick={() => setShowAdd(false)}>ZRUŠIT</button>
          </div>
        </div>
      )}

      <div className="flex gap-0 mb-5 border-b border-ctrl-border">
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', activeTab === 'open' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('open')}>
          OTEVŘENÉ ({openTasks.length})
        </div>
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', activeTab === 'done' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('done')}>
          SPLNĚNÉ ({doneTasks.length})
        </div>
      </div>

      {displayTasks.map(t => (
        <div key={t.id} className="py-3.5 px-[18px] flex items-center gap-3 mb-2 bg-ctrl-panel border border-ctrl-border transition-all duration-200 hover:border-ctrl-border2">
          {profile.layer !== 'pozorovatel' && (
            <div className={cn('w-[18px] h-[18px] border-2 border-ctrl-border2 cursor-pointer shrink-0 flex items-center justify-center transition-all duration-200 hover:border-ctrl-accent', t.done && 'bg-ctrl-success border-ctrl-success')} onClick={() => toggleTask(t)}>{t.done && <span className="text-black text-[11px] font-bold">✓</span>}</div>
          )}
          <div className="flex-1 min-w-0">
            <div className={cn('text-[13px] font-semibold transition-all duration-200', t.done && 'line-through text-ctrl-text2')}>{t.name}</div>
            <div className="font-mono text-[10px] text-ctrl-text2 mt-0.5">{t.assignee && `${t.assignee} · `}{t.due && `Termín: ${t.due}`}</div>
            {t.done && t.completed_at && <div className="text-[10px] text-ctrl-success font-mono mt-0.5">✓ {getCompletorName(t)}</div>}
          </div>
          <span className={tagCls[t.tag] || tagCls.other}>{t.tag}</span>
        </div>
      ))}
      {displayTasks.length === 0 && (
        <div className="text-ctrl-text2 text-[13px] py-5">
          {activeTab === 'open' ? 'Žádné otevřené úkoly.' : 'Žádná historie splněných úkolů.'}
        </div>
      )}
    </div>
  )
}

function Chat({ profile, activeBucket }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [pinnedMsg, setPinnedMsg] = useState(null)
  const bottomRef = useRef(null)
  const bucket = activeBucket || profile.bucket
  const canWrite = profile.layer !== 'pozorovatel'

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from('messages').select('*')
      .eq('bucket', bucket).order('created_at', { ascending: true }).limit(100)
    if (data) {
      setMessages(data.filter(m => !m.pinned))
      const pinned = data.find(m => m.pinned)
      if (pinned) setPinnedMsg(pinned)
    }
    setLoading(false)
  }, [bucket])

  useEffect(() => {
    loadMessages()
    const channel = supabase.channel(`chat-${bucket}`, { config: { broadcast: { self: true } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `bucket=eq.${bucket}` }, payload => {
        if (payload.new.pinned) setPinnedMsg(payload.new)
        else setMessages(prev => [...prev, payload.new])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `bucket=eq.${bucket}` }, () => {
        loadMessages()
      })
      .subscribe()
    // Fallback polling every 5s in case realtime fails
    const poll = setInterval(loadMessages, 5000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [loadMessages, bucket])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !canWrite) return
    await supabase.from('messages').insert([{
      text: input, author_id: profile.id,
      author_name: profile.name, author_initials: getInitials(profile.name), bucket, pinned: false
    }])
    setInput('')
  }

  const pinMessage = async (msg) => {
    if (!isAdmin(profile.layer)) return
    await supabase.from('messages').update({ pinned: true, pinned_by: profile.id }).eq('id', msg.id)
    setPinnedMsg(msg)
    setMessages(prev => prev.filter(m => m.id !== msg.id))
  }

  if (loading) return <div className="text-ctrl-text2 text-[13px]">Načítám zprávy...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] max-[900px]:h-[calc(100vh-130px)] animate-fade-in">
      <Sec>CHAT · {bucket.toUpperCase()}</Sec>
      {pinnedMsg && (
        <div className="border border-[rgba(42,107,255,0.2)] py-2.5 px-3.5 mb-3 flex items-start gap-2.5 bg-[rgba(42,107,255,0.08)]">
          <div className="text-ctrl-accent text-xs shrink-0 mt-px">📌</div>
          <div className="text-xs text-ctrl-text2 flex-1"><strong>{pinnedMsg.author_name}:</strong> {pinnedMsg.text}</div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-3">
        {messages.map(m => {
          const isOwn = m.author_id === profile.id
          return (
            <div key={m.id} className={cn('flex gap-2.5 items-start animate-fade-in', isOwn && 'flex-row-reverse', "group")}>
              <div className={cn('w-[30px] h-[30px] shrink-0 flex items-center justify-center text-[11px] font-bold font-mono border border-ctrl-border', isOwn ? 'bg-ctrl-accent text-white' : 'bg-ctrl-panel2 text-ctrl-text')}>
                {m.author_initials}
              </div>
              <div className={cn('max-w-[68%] bg-ctrl-panel border border-ctrl-border py-2.5 px-3.5 transition-colors duration-200 hover:border-ctrl-border2', isOwn && 'bg-[rgba(42,107,255,0.08)] border-[rgba(42,107,255,0.25)]')}>
                <div className={cn('font-mono text-[9px] text-ctrl-accent tracking-wide uppercase mb-0.5 flex items-center gap-2', isOwn && 'flex-row-reverse')}>
                  {m.author_name}
                  {isAdmin(profile.layer) && !isOwn && (
                    <span className="text-[9px] text-ctrl-text3 cursor-pointer opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:text-ctrl-accent" onClick={() => pinMessage(m)}>📌 připnout</span>
                  )}
                </div>
                <div className="text-[13px] leading-normal">{m.text}</div>
                <div className={cn('font-mono text-[9px] text-ctrl-text3 mt-1', isOwn && 'text-right')}>{formatDate(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {canWrite ? (
        <div className="flex gap-2 pt-3 border-t border-ctrl-border mt-1">
          <input className="flex-1 bg-ctrl-panel border border-ctrl-border text-ctrl-text py-3 px-4 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent" placeholder="Napiš zprávu..." value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
          <button className="border-0 py-3 px-5 text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-mono transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={sendMessage}>→</button>
        </div>
      ) : (
        <div className="py-3 text-ctrl-text2 text-xs font-mono border-t border-ctrl-border">
          // Pozorovatel — pouze čtení
        </div>
      )}
    </div>
  )
}


function MemberModal({ member, tasks, onClose }) {
  if (!member) return null
  const memberTasks = tasks.filter(t => t.created_by === member.id || t.completed_by === member.id)
  const openTasks = memberTasks.filter(t => !t.done)
  const doneTasks = memberTasks.filter(t => t.done)

  const lastSeen = member.last_seen
    ? (() => {
        const d = new Date(member.last_seen)
        const diff = Math.floor((Date.now() - d) / 60000)
        if (diff < 2) return 'právě online'
        if (diff < 60) return `před ${diff} min`
        if (diff < 1440) return `před ${Math.floor(diff/60)} hod`
        return `před ${Math.floor(diff/1440)} dny`
      })()
    : 'neznámo'

  const roleLabel = ROLE_LABELS[member.layer] || member.layer

  const isOnline = member.last_seen && (Date.now() - new Date(member.last_seen)) < 300000

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.7)] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-ctrl-panel border border-ctrl-border rounded w-full max-w-[480px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="py-7 px-7 pb-5 border-b border-ctrl-border">
          <div className="flex items-center gap-4">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-extrabold font-mono shrink-0', bucketAvCls(member.bucket))}>
              {getInitials(member.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-extrabold mb-0.5">{member.name}</div>
              <div className="font-mono text-[10px] text-ctrl-accent tracking-[2px] uppercase mb-1">
                {roleLabel}
              </div>
              <div className="font-mono text-[10px] text-ctrl-text2 tracking-wide">
                {member.bucket}{member.secondary_bucket ? ` · ${member.secondary_bucket}` : ''}
              </div>
            </div>
            <button onClick={onClose} className="bg-transparent border-0 text-ctrl-text2 text-xl cursor-pointer p-1 hover:text-ctrl-text">×</button>
          </div>
        </div>

        <div className="py-4 px-7 border-b border-ctrl-border grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-[22px] font-extrabold text-ctrl-accent">{openTasks.length}</div>
            <div className="font-mono text-[9px] text-ctrl-text2 tracking-wide uppercase mt-0.5">otevřené úkoly</div>
          </div>
          <div className="text-center">
            <div className="text-[22px] font-extrabold">{doneTasks.length}</div>
            <div className="font-mono text-[9px] text-ctrl-text2 tracking-wide uppercase mt-0.5">splněno</div>
          </div>
          <div className="text-center">
            <div className={cn('text-[11px] font-semibold mt-1', isOnline ? 'text-[#4ade80]' : 'text-ctrl-text2')}>
              {lastSeen}
            </div>
            <div className="font-mono text-[9px] text-ctrl-text2 tracking-wide uppercase mt-0.5">naposledy online</div>
          </div>
        </div>

        {openTasks.length > 0 && (
          <div className="py-4 px-7 border-b border-ctrl-border">
            <div className="font-mono text-[10px] text-ctrl-text2 tracking-[2px] uppercase mb-2.5">
              Otevřené úkoly ({openTasks.length})
            </div>
            <div className="flex flex-col gap-1.5">
              {openTasks.slice(0, 5).map(t => (
                <div key={t.id} className="text-[13px] py-2 px-3 bg-ctrl-bg2 border-l-2 border-l-ctrl-accent rounded-sm">
                  {t.text}
                  {t.due_date && <span className="font-mono text-[10px] text-ctrl-text2 ml-2">{t.due_date}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {openTasks.length === 0 && (
          <div className="py-4 px-7 border-b border-ctrl-border">
            <div className="font-mono text-[10px] text-ctrl-text2 tracking-wide text-center">
              Žádné otevřené úkoly
            </div>
          </div>
        )}

        <div className="py-3 px-7">
          <div className="font-mono text-[9px] text-ctrl-text2 tracking-wide">
            Člen od: {member.created_at ? new Date(member.created_at).toLocaleDateString('cs-CZ') : 'neznámo'}
          </div>
        </div>
      </div>
    </div>
  )
}

function BucketView({ profile, bucket, tasks, setTasks, members }) {
  const [view, setView] = useState('tasks')
  const [selectedMember, setSelectedMember] = useState(null)
  const bucketMembers = members.filter(m => m.bucket === bucket || m.secondary_bucket === bucket)
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3.5 mb-5">
        <div className={cn('w-1 h-9 shrink-0', bucketBarCls(bucket))} />
        <div>
          <div className="text-xl font-extrabold">{bucket}</div>
          <div className="font-mono text-[10px] text-ctrl-text2 tracking-[2px] uppercase">
            {bucketMembers.length} členů
          </div>
        </div>
        <div className="flex gap-1 ml-auto flex-wrap">
          {bucketMembers.slice(0, 6).map(m => (
            <div key={m.id} className={cn('w-6 h-6 flex items-center justify-center text-[9px] font-bold font-mono cursor-pointer transition-transform duration-200 hover:scale-[1.15] hover:z-[1]', bucketMemberAvCls(bucket))}
              onClick={() => setSelectedMember(m)} title={m.name}>
              {getInitials(m.name)}
            </div>
          ))}
          {selectedMember && <MemberModal member={selectedMember} tasks={tasks} onClose={() => setSelectedMember(null)} />}
        </div>
      </div>

      <div className="flex gap-0 mb-5 border-b border-ctrl-border">
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', view === 'tasks' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setView('tasks')}>ÚKOLY</div>
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', view === 'chat' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setView('chat')}>CHAT</div>
      </div>

      {view === 'tasks' && <Tasks profile={profile} tasks={tasks} setTasks={setTasks} activeBucket={bucket} />}
      {view === 'chat' && <Chat profile={profile} activeBucket={bucket} />}
    </div>
  )
}

function BucketOverview({ profile, tasks, members, onSelectBucket }) {
  const accessible = getAccessibleBuckets(profile)
  const [selectedMember, setSelectedMember] = useState(null)

  return (
    <div className="animate-fade-in">
      <Sec>BUŇKY PROJEKTU</Sec>
      <div className="grid grid-cols-3 gap-3 mb-5 max-[900px]:grid-cols-2 max-[900px]:gap-2">
        {accessible.map(bucket => {
          const bucketTasks = tasks.filter(t => (t.bucket_target === bucket || t.bucket_target === 'all') && !t.done)
          const bucketMembers = members.filter(m => m.bucket === bucket || m.secondary_bucket === bucket)
          const isSpecial = SPECIAL_BUCKETS.includes(bucket)

          return (
            <div key={bucket} className="p-5 cursor-pointer bg-ctrl-panel border border-ctrl-border relative overflow-hidden transition-all duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
              onClick={() => onSelectBucket(bucket)}>
              <div className={cn('absolute top-0 left-0 right-0 h-[3px]', bucketBarCls(bucket))} />
              <div className="flex items-start justify-between mb-2">
                <div className="text-[13px] font-bold mb-1">{bucket}</div>
                {isSpecial && (
                  <span className={cn('font-mono text-[8px] py-0.5 px-1.5 tracking-wide uppercase', bucketOrganBadgeCls(bucket))}>
                    ORGÁN
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] text-ctrl-text2">{bucketTasks.length} otevřených úkolů · {bucketMembers.length} členů</div>
              <div className="flex gap-1 mt-2.5 flex-wrap">
                {bucketMembers.slice(0, 5).map(m => (
                  <div key={m.id} className={cn('w-6 h-6 flex items-center justify-center text-[9px] font-bold font-mono cursor-pointer transition-transform duration-200 hover:scale-[1.15] hover:z-[1]', bucketMemberAvCls(bucket))}
                    onClick={e => { e.stopPropagation(); setSelectedMember(m); }} title={m.name}>
                    {getInitials(m.name)}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {selectedMember && <MemberModal member={selectedMember} tasks={tasks} onClose={() => setSelectedMember(null)} />}
    </div>
  )
}

function AdminPanel({ profile, members }) {
  const [activeTab, setActiveTab] = useState('members')

  const getLastSeenKind = (lastSeen) => {
    if (!lastSeen) return 'never'
    const diff = new Date() - new Date(lastSeen)
    if (diff < 86400000) return 'good'
    if (diff < 86400000 * 3) return 'ok'
    if (diff < 86400000 * 7) return 'bad'
    return 'never'
  }

  const bucketStats = ALL_BUCKETS.map(bucket => {
    const bucketMembers = members.filter(m => m.bucket === bucket)
    const active = bucketMembers.filter(m => m.last_seen && new Date() - new Date(m.last_seen) < 86400000 * 7)
    return { bucket, total: bucketMembers.length, active: active.length }
  }).filter(s => s.total > 0)

  const maxActive = Math.max(...bucketStats.map(s => s.active), 1)

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <Sec className="!mb-0">ADMIN PANEL</Sec>
        <span className="bg-ctrl-danger text-white font-mono text-[9px] py-0.5 px-2 tracking-wide">POUZE ADMIN</span>
      </div>

      <div className="flex gap-0 mb-5 border-b border-ctrl-border">
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', activeTab === 'members' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('members')}>ČLENOVÉ ({members.length})</div>
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', activeTab === 'stats' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('stats')}>STATISTIKY</div>
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', activeTab === 'add' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('add')}>PŘIDAT ČLENA</div>
      </div>

      {activeTab === 'members' && (
        <div>
          {members.map(m => (
            <div key={m.id} className="py-3 px-4 flex items-center gap-3 bg-ctrl-panel border border-ctrl-border mb-2 transition-all duration-200 hover:border-ctrl-border2">
              <div className={cn('w-[34px] h-[34px] flex items-center justify-center text-xs font-bold font-mono shrink-0', bucketMemberAvCls(m.bucket))}>
                {getInitials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold">{m.name}</div>
                <div className="font-mono text-[10px] text-ctrl-text2 mt-0.5">
                  {m.role} · {m.bucket}{m.secondary_bucket && ` + ${m.secondary_bucket}`}
                </div>
              </div>
              <span className={cn('font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase', roleBadgeCls(m.layer))}>
                {ROLE_LABELS[m.layer] || m.layer}
              </span>
              <div className={cn('font-mono text-[10px] min-w-[120px] text-right', lastSeenCls(getLastSeenKind(m.last_seen)))}>
                {formatTime(m.last_seen)}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'stats' && (
        <div>
          <div className="bg-ctrl-panel border border-ctrl-border p-5 mb-3">
            <Sec>AKTIVITA BUNĚK — POSLEDNÍCH 7 DNÍ</Sec>
            {bucketStats.map(s => (
              <div key={s.bucket} className="flex items-center gap-3 py-2.5 border-b border-ctrl-border last:border-b-0">
                <div className="w-[140px] text-xs text-ctrl-text2 shrink-0">{s.bucket}</div>
                <div className="flex-1 h-1 bg-ctrl-border flex gap-px overflow-hidden">
                  {Array.from({ length: maxActive }, (_, i) => (
                    <div key={i} className={cn('flex-1 h-full min-w-0 transition-colors duration-[600ms]', i < s.active ? bucketBarCls(s.bucket) : 'bg-transparent')} />
                  ))}
                </div>
                <div className="font-mono text-[11px] text-ctrl-text2 min-w-[80px] text-right">
                  {s.active}/{s.total} aktivních
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="bg-ctrl-panel border border-ctrl-warning p-4 mb-3.5 animate-fade-in">
          <Sec>JAK PŘIDAT ČLENA</Sec>
          <div className="text-xs text-ctrl-text2 leading-[1.8] font-mono">
            <div className="text-ctrl-warning mb-2">Krok 1 — Supabase → Authentication → Users → Add User</div>
            <div className="text-ctrl-text2 mb-1">Email + heslo + Auto Confirm User ✓</div>
            <div className="text-ctrl-text2 mb-4">Zkopíruj UUID nového uživatele</div>
            <div className="text-ctrl-warning mb-2">Krok 2 — Supabase → SQL Editor → spusť:</div>
            <div className="bg-ctrl-bg2 p-3 text-ctrl-success text-[11px] leading-loose border-l-2 border-l-ctrl-accent">
              INSERT INTO profiles (id, name, role, bucket, layer, secondary_bucket)<br />
              VALUES (<br />
              &nbsp;&nbsp;'UUID-sem',<br />
              &nbsp;&nbsp;'Jméno Příjmení',<br />
              &nbsp;&nbsp;'Role v týmu',<br />
              &nbsp;&nbsp;'Primární buňka',<br />
              &nbsp;&nbsp;'clen',<br />
              &nbsp;&nbsp;NULL -- nebo 'Předsednictvo' pro dual membership<br />
              );
            </div>
            <div className="text-ctrl-text2 mt-3 text-[11px]">
              Dostupné vrstvy: admin · predsednictvo · zastupce_predsednictva · vedouci · clen · pozorovatel
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Profile({ profile, members }) {
  const [status, setStatus] = useState(profile.status || 'active')

  const updateStatus = async (newStatus) => {
    setStatus(newStatus)
    await supabase.from('profiles').update({ status: newStatus }).eq('id', profile.id)
  }

  const statusConfig = {
    active: { label: 'Aktivní' },
    away: { label: 'Zaneprázdněn' },
    needs_help: { label: 'Potřebuji pomoc' },
  }

  return (
    <div className="animate-fade-in">
      <Sec>PROFIL ČLENA</Sec>
      <div className="grid gap-4 grid-cols-[260px_1fr] max-[900px]:grid-cols-1">
        <div className="bg-ctrl-panel border border-ctrl-border p-7 min-w-0">
          <div className={cn('w-[72px] h-[72px] flex items-center justify-center text-[26px] font-bold font-mono mb-4 transition-transform duration-200 hover:scale-105', bucketAvCls(profile.bucket))}>
            {getInitials(profile.name)}
          </div>
          <div className="text-lg font-extrabold mb-1">{profile.name}</div>
          <div className={cn('inline-block font-mono text-[9px] py-[3px] px-2.5 tracking-[2px] uppercase mb-4', roleBadgeCls(profile.layer))}>
            {ROLE_LABELS[profile.layer] || profile.layer}
          </div>
          <div className="h-px bg-ctrl-border my-5" />
          <div className="mb-3.5">
            <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1">Buňka</div>
            <div className="text-[13px]">{profile.bucket}</div>
          </div>
          {profile.secondary_bucket && (
            <div className="mb-3.5">
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1">Sekundární buňka</div>
              <div className="text-[13px]">{profile.secondary_bucket}</div>
            </div>
          )}
          <div className="mb-3.5">
            <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-2">Stav</div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className={cn('w-[7px] h-[7px] rounded-full shrink-0', status === "active" && 'bg-ctrl-success shadow-[0_0_6px_#00e5a0]', status === "away" && 'bg-ctrl-warning', status === "needs_help" && 'bg-ctrl-danger animate-pulse')} />
              <span className="text-[13px]">{statusConfig[status].label}</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              {Object.entries(statusConfig).map(([key, val]) => (
                <div key={key} className={cn('w-full box-border py-1.5 px-2.5 font-mono text-[9px] tracking-wide uppercase cursor-pointer border transition-all duration-200 hover:border-ctrl-accent text-center', status === key ? STATUS_OPT_CLS[key] : 'border-ctrl-border text-ctrl-text2')}
                  onClick={() => updateStatus(key)}>
                  {val.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-ctrl-panel border border-ctrl-border p-5">
            <Sec>PŘÍSTUPOVÁ PRÁVA</Sec>
            {[
              'Dashboard a oznámení',
              profile.layer !== 'pozorovatel' && 'Chat v buňce',
              profile.layer !== 'pozorovatel' && 'Označování úkolů',
              canAddTasks(profile.layer) && 'Přidávání úkolů',
              isAdmin(profile.layer) && 'Admin panel',
              isAdmin(profile.layer) && 'Správa všech buněk',
              profile.layer === 'pozorovatel' && 'Čtení všech buněk',
            ].filter(Boolean).map(p => (
              <div key={p} className="flex items-center gap-2 mb-[7px]">
                <span className="text-ctrl-success font-mono text-[11px]">✓</span>
                <span className="text-[13px] text-ctrl-text2">{p}</span>
              </div>
            ))}
          </div>

          <PasswordChange />

          <div className="bg-ctrl-panel border border-ctrl-border p-5">
            <Sec>DOKUMENTY SPOLKU</Sec>
            <div className="text-xs text-ctrl-text2 mb-3.5 leading-relaxed">
              Oficiální dokumenty CTRL Europe Team, z. s. Kliknutím stáhneš dokument.
            </div>
            {[
              { name: 'Stanovy spolku', desc: 'Kompletní stanovy CTRL Europe Team, z. s.', icon: '📋' },
              { name: 'Zakládací listina', desc: 'Zakládací listina spolku', icon: '📄' },
              { name: 'GDPR — Zásady zpracování osobních údajů', desc: 'Jak zpracováváme tvé osobní údaje', icon: '🔒' },
              { name: 'Členský závazek', desc: 'Vzor členského závazku spolku', icon: '✍️' },
            ].map(doc => (
              <div key={doc.name} className="flex items-center gap-3 py-3 border-b border-ctrl-border cursor-default opacity-70">
                <span className="text-lg">{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold mb-0.5">{doc.name}</div>
                  <div className="font-mono text-[10px] text-ctrl-text2 tracking-wide">{doc.desc}</div>
                </div>
                <span className="font-mono text-[9px] text-ctrl-text2 tracking-wide shrink-0">BRZY</span>
              </div>
            ))}
            <div className="mt-3 font-mono text-[10px] text-ctrl-text2 tracking-wide">
              Dokumenty budou k dispozici po finálním podpisu a zápisu spolku.
            </div>
          </div>

          <div className="bg-ctrl-panel border border-ctrl-border p-5">
            <Sec>CTRL EUROPE TEAM</Sec>
            <div className="text-[13px] text-ctrl-text2 leading-relaxed">
              CEE Youth Platform zaměřená na digitální hrozby naší generace. AI, deepfakes, dezinformace — a proč nás školy nepřipravují.
            </div>
            <div className="mt-3.5 font-mono text-[11px] text-ctrl-accent tracking-wide italic">
              "Take control before someone else does."
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordChange() {
  const [open, setOpen] = useState(false)
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = async () => {
    setMsg(''); setError('')
    if (!oldPass || !newPass || !confirm) return setError('Vyplň všechna pole')
    if (newPass.length < 6) return setError('Nové heslo musí mít alespoň 6 znaků')
    if (newPass !== confirm) return setError('Hesla se neshodují')
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: session.user.email, password: oldPass
    })
    if (signInErr) { setError('Původní heslo je nesprávné'); setLoading(false); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPass })
    if (updateErr) setError('Chyba: ' + updateErr.message)
    else { setMsg('Heslo bylo úspěšně změněno!'); setOldPass(''); setNewPass(''); setConfirm(''); setOpen(false) }
    setLoading(false)
  }

  return (
    <div className="bg-ctrl-panel border border-ctrl-border p-5">
      <div className="flex justify-between items-center">
        <Sec className="!mb-0">ZMĚNIT HESLO</Sec>
        <button className="border-0 py-1.5 px-3 text-[10px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text" onClick={() => { setOpen(v => !v); setMsg(''); setError('') }}>
          {open ? 'ZRUŠIT' : 'ZMĚNIT'}
        </button>
      </div>
      {msg && <div className="text-ctrl-success font-mono text-[11px] mt-2.5">✓ {msg}</div>}
      {open && (
        <div className="mt-3.5 animate-fade-in">
          <div className="mb-2.5">
            <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Původní heslo</div>
            <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" type="password" placeholder="Původní heslo..." value={oldPass} onChange={e => setOldPass(e.target.value)} />
          </div>
          <div className="mb-2.5">
            <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Nové heslo</div>
            <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" type="password" placeholder="Nové heslo (min. 6 znaků)..." value={newPass} onChange={e => setNewPass(e.target.value)} />
          </div>
          <div className="mb-3.5">
            <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Potvrdit nové heslo</div>
            <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" type="password" placeholder="Zopakuj nové heslo..." value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChange()} />
          </div>
          {error && <div className="text-ctrl-danger font-mono text-[11px] mb-2.5">// {error}</div>}
          <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={handleChange} disabled={loading}>
            {loading ? 'MĚNÍM...' : 'ULOŽIT NOVÉ HESLO'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [activeBucket, setActiveBucket] = useState(null)
  const [tasks, setTasks] = useState([])
  const [news, setNews] = useState([])
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (!session) { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    const load = async () => {
      // Update last_seen
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setPage('dashboard'); setActiveBucket(null)
  }

  const handleSelectBucket = (bucket) => {
    setActiveBucket(bucket)
    setPage('bucket')
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ctrl-bg gap-4">
        <div className="font-mono text-4xl font-bold tracking-[-1px]">[<span className="text-ctrl-accent [text-shadow:0_0_20px_rgba(42,107,255,0.5)]">CTRL</span>]</div>
        <div className="font-mono text-[11px] tracking-[3px] text-ctrl-text2 uppercase animate-pulse-slow">Načítám portál...</div>
    </div>
  )

  if (!session || !profile) return <LoginPage />

  const admin = isAdmin(profile.layer)
  const accessibleBuckets = getAccessibleBuckets(profile)
  const teamBuckets = accessibleBuckets.filter(b => TEAM_BUCKETS.includes(b))
  const specialBuckets = accessibleBuckets.filter(b => SPECIAL_BUCKETS.includes(b))

  // Count unread (simple: open tasks for user)
  const myOpenCount = tasks.filter(t => !t.done && (t.bucket_target === profile.bucket || t.bucket_target === 'all')).length

  const NAV_MAIN = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'buckets', icon: '◈', label: 'Buňky' },
    { id: 'profile', icon: '◉', label: 'Profil' },
    ...(admin ? [{ id: 'admin', icon: '⚙', label: 'Admin' }] : []),
  ]

  const statusConfig = {
    active: { dot: 'status-active', label: 'Aktivní' },
    away: { dot: 'status-away', label: 'Zaneprázdněn' },
    needs_help: { dot: 'status-help', label: 'Potřebuji pomoc' },
  }
  const myStatus = statusConfig[profile.status || 'active']

  return (
    <div className="flex min-h-screen">
        <div className="w-[230px] min-h-screen bg-ctrl-panel border-r border-ctrl-border flex flex-col fixed left-0 top-0 bottom-0 z-[200] max-[900px]:hidden">
          <div className="py-6 px-5 pb-4 border-b border-ctrl-border relative overflow-hidden">
            <div className="font-mono text-[28px] font-bold tracking-[-1px] relative inline-block">
              [<span className="text-ctrl-accent">CTRL</span>]
              <span className="absolute inset-0 text-ctrl-danger opacity-0 animate-glitch pointer-events-none" aria-hidden>[CTRL]</span>
            </div>
            <div className="font-mono text-[9px] tracking-[2px] text-ctrl-text2 uppercase mt-0.5">Members Portal</div>
          </div>

          <div className="py-3.5 px-5 border-b border-ctrl-border">
            <div className={cn('w-9 h-9 flex items-center justify-center text-[13px] font-bold font-mono mb-2 transition-transform duration-200 hover:scale-105', bucketMemberAvCls(profile.bucket))}>
              {getInitials(profile.name)}
            </div>
            <div className="text-[13px] font-bold">{profile.name}</div>
            <div className={cn('inline-block font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase mt-0.5', roleBadgeCls(profile.layer))}>
              {ROLE_LABELS[profile.layer]}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={cn('w-[7px] h-[7px] rounded-full shrink-0', (profile.status || "active") === "active" && 'bg-ctrl-success shadow-[0_0_6px_#00e5a0]', profile.status === "away" && 'bg-ctrl-warning', profile.status === "needs_help" && 'bg-ctrl-danger animate-pulse')} />
              <span className="font-mono text-[9px] text-ctrl-text2 tracking-wide cursor-pointer hover:text-ctrl-text">{myStatus.label}</span>
            </div>
          </div>

          <nav className="flex-1 py-2.5 overflow-y-auto">
            <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">Navigace</div>
            {NAV_MAIN.map(n => (
              <div key={n.id} className={cn('flex items-center gap-2.5 py-2.5 px-5 cursor-pointer text-ctrl-text2 text-xs font-semibold tracking-wide uppercase border-l-2 border-transparent transition-all duration-200 relative hover:text-ctrl-text hover:bg-[rgba(42,107,255,0.05)] hover:translate-x-0.5', page === n.id && !activeBucket && 'text-ctrl-accent border-l-ctrl-accent bg-[rgba(42,107,255,0.1)]')}
                onClick={() => { setPage(n.id); setActiveBucket(null) }}>
                <span className="text-sm w-[18px] text-center shrink-0">{n.icon}</span>
                <span>{n.label}</span>
                {n.id === 'dashboard' && myOpenCount > 0 && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-ctrl-danger text-white text-[9px] min-w-4 h-4 flex items-center justify-center rounded-lg font-mono animate-badge-pop">{myOpenCount}</span>}
              </div>
            ))}

            {teamBuckets.length > 0 && (
              <>
                <div className="py-2.5 px-5 pb-1 font-mono text-[8px] tracking-[3px] text-ctrl-text3 uppercase">Týmové buňky</div>
                {teamBuckets.map(b => (
                  <div key={b} className={cn('flex items-center gap-2.5 py-2.5 px-5 cursor-pointer text-ctrl-text2 text-xs font-semibold tracking-wide uppercase border-l-2 border-transparent transition-all duration-200 relative hover:text-ctrl-text hover:bg-[rgba(42,107,255,0.05)] hover:translate-x-0.5', activeBucket === b && 'text-ctrl-accent border-l-ctrl-accent bg-[rgba(42,107,255,0.1)]')}
                    onClick={() => handleSelectBucket(b)}>
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
                  <div key={b} className={cn('flex items-center gap-2.5 py-2.5 px-5 cursor-pointer text-ctrl-text2 text-xs font-semibold tracking-wide uppercase border-l-2 border-transparent transition-all duration-200 relative hover:text-ctrl-text hover:bg-[rgba(42,107,255,0.05)] hover:translate-x-0.5', activeBucket === b && 'text-ctrl-accent border-l-ctrl-accent bg-[rgba(42,107,255,0.1)]')}
                    onClick={() => handleSelectBucket(b)}>
                    <div className={cn('w-1.5 h-1.5 shrink-0', bucketDotCls(b))} />
                    <span className="text-[11px]">{b}</span>
                  </div>
                ))}
              </>
            )}
          </nav>

          <div className="py-3.5 px-5 border-t border-ctrl-border">
            <button className="w-full bg-transparent border border-ctrl-border text-ctrl-text2 py-[9px] text-[10px] tracking-[2px] uppercase cursor-pointer font-mono transition-all duration-200 hover:border-ctrl-danger hover:text-ctrl-danger hover:bg-[rgba(255,51,102,0.05)]" onClick={handleLogout}>ODHLÁSIT SE</button>
          </div>
        </div>

        <div className="ml-[230px] flex-1 min-h-screen animate-fade-in max-[900px]:ml-0 max-[900px]:pb-[70px]">
          <div className="h-[54px] bg-ctrl-panel border-b border-ctrl-border flex items-center px-7 gap-3 sticky top-0 z-[100] backdrop-blur-md max-[900px]:px-4 max-[900px]:h-[50px]">
            <span className="font-mono text-[10px] tracking-[3px] uppercase text-ctrl-text2">
              [CTRL] ·{' '}
              {activeBucket ? activeBucket :
                page === 'dashboard' ? 'Dashboard' :
                  page === 'buckets' ? 'Buňky' :
                    page === 'profile' ? 'Profil' :
                      page === 'admin' ? 'Admin' : ''}
            </span>
            {activeBucket && (
              <button className="border-0 py-1 px-2.5 text-[10px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text"
                onClick={() => { setActiveBucket(null); setPage('buckets') }}>
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
          </div>

          <div className="p-7 animate-fade-in max-[900px]:p-4">
            {!activeBucket && page === 'dashboard' && (
              <Dashboard profile={profile} tasks={tasks} news={news} setNews={setNews} events={events} members={members} />
            )}
            {!activeBucket && page === 'buckets' && (
              <BucketOverview profile={profile} tasks={tasks} members={members} onSelectBucket={handleSelectBucket} />
            )}
            {!activeBucket && page === 'profile' && (
              <Profile profile={profile} members={members} />
            )}
            {!activeBucket && page === 'admin' && admin && (
              <AdminPanel profile={profile} members={members} />
            )}
            {activeBucket && (
              <BucketView profile={profile} bucket={activeBucket} tasks={tasks} setTasks={setTasks} members={members} />
            )}
          </div>
        </div>

        {/* BOTTOM NAV — mobile */}
        <MobileBottomNav
          page={page} activeBucket={activeBucket}
          setPage={setPage} setActiveBucket={setActiveBucket}
          accessibleBuckets={accessibleBuckets}
          tasks={tasks} profile={profile}
          myOpenCount={myOpenCount} admin={admin}
          handleSelectBucket={handleSelectBucket}
        />
    </div>
  )
}

function MobileBottomNav({ page, activeBucket, setPage, setActiveBucket, accessibleBuckets, tasks, profile, myOpenCount, admin, handleSelectBucket }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navItems = [
    { id: 'dashboard', icon: '⊞', label: 'Hlavní' },
    { id: 'buckets', icon: '◈', label: 'Buňky' },
    { id: 'profile', icon: '◉', label: 'Profil' },
    ...(admin ? [{ id: 'admin', icon: '⚙', label: 'Admin' }] : []),
  ]

  const teamBuckets = accessibleBuckets.filter(b => ['PR a komunikace','Sociální sítě','Podcast','Research','Grafika','Video','Mezinárodní','Eventy'].includes(b))
  const specialBuckets = accessibleBuckets.filter(b => ['Rada zástupců','Předsednictvo'].includes(b))

  return (
    <>
      <div className="hidden fixed bottom-0 left-0 right-0 h-[62px] bg-ctrl-panel border-t border-ctrl-border z-[300] px-1 items-center justify-around pb-[env(safe-area-inset-bottom)] max-[900px]:flex">
        {navItems.map(n => (
          <div key={n.id}
            className={cn('flex flex-col items-center justify-center gap-0.5 py-2 px-2.5 cursor-pointer flex-1 text-ctrl-text2 transition-all duration-150 relative rounded-lg active:scale-90', page === n.id && !activeBucket && 'text-ctrl-accent bg-[rgba(42,107,255,0.1)]')}
            onClick={() => { setPage(n.id); setActiveBucket(null); setDrawerOpen(false) }}>
            {n.id === 'dashboard' && myOpenCount > 0 && <span className="absolute top-[5px] right-2 bg-ctrl-danger text-white text-[8px] min-w-[14px] h-3.5 flex items-center justify-center rounded-[7px]">{myOpenCount}</span>}
            <span className="text-xl leading-none">{n.icon}</span>
            <span className="font-mono text-[8px] tracking-wide uppercase">{n.label}</span>
          </div>
        ))}
        <div className={cn('flex flex-col items-center justify-center gap-0.5 py-2 px-2.5 cursor-pointer flex-1 text-ctrl-text2 transition-all duration-150 relative rounded-lg active:scale-90', (drawerOpen || activeBucket) && 'text-ctrl-accent bg-[rgba(42,107,255,0.1)]')}
          onClick={() => setDrawerOpen(v => !v)}>
          <span className="text-xl leading-none">☰</span>
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
              <div key={b} className="flex items-center gap-3 py-3.5 px-3 cursor-pointer rounded-lg transition-colors duration-150 mb-0.5 active:bg-[rgba(42,107,255,0.1)]" onClick={() => { handleSelectBucket(b); setDrawerOpen(false) }}>
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
                <div key={b} className="flex items-center gap-3 py-3.5 px-3 cursor-pointer rounded-lg transition-colors duration-150 mb-0.5 active:bg-[rgba(42,107,255,0.1)]" onClick={() => { handleSelectBucket(b); setDrawerOpen(false) }}>
                  <div className={cn('w-2.5 h-2.5 rounded-sm shrink-0', bucketDotCls(b))} />
                  <span className="text-[15px] font-semibold">{b}</span>
                </div>
              ))}
            </>
          )}
          <div className="pt-3">
            <div className="flex items-center gap-3 py-3.5 px-3 cursor-pointer rounded-lg transition-colors duration-150 mb-0.5 active:bg-[rgba(42,107,255,0.1)] opacity-50" onClick={() => { setDrawerOpen(false) }}>
              <span className="text-[13px] text-ctrl-text2">Zavřít</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
