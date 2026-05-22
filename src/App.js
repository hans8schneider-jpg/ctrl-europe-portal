import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const G = {
  bg: '#050508', bg2: '#08080f', bg3: '#0d0d18',
  panel: '#0f0f1a', panel2: '#141428', panel3: '#191932',
  border: '#1a1a30', border2: '#222240',
  accent: '#2A6BFF', accent2: '#1a4fd4', accentDim: 'rgba(42,107,255,0.12)',
  text: '#eaeaf5', text2: '#7878a0', text3: '#3a3a60',
  danger: '#ff3366', success: '#00e5a0', warning: '#ffb800', info: '#00c9ff',
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

const ROLE_COLORS = {
  admin: G.danger,
  predsednictvo: '#b44fff',
  zastupce_predsednictva: '#7744ff',
  vedouci: G.accent,
  clen: G.success,
  pozorovatel: G.text2,
}

const TEAM_BUCKETS = [
  'PR a komunikace', 'Sociální sítě', 'Podcast', 'Research',
  'Grafika', 'Video', 'Mezinárodní', 'Eventy',
]
const SPECIAL_BUCKETS = ['Rada zástupců', 'Předsednictvo']
const ALL_BUCKETS = [...TEAM_BUCKETS, ...SPECIAL_BUCKETS]

const BUCKET_COLORS = {
  'PR a komunikace': '#2A6BFF',
  'Sociální sítě': '#ffb800',
  'Podcast': '#b44fff',
  'Research': '#00c9ff',
  'Grafika': '#ff6b35',
  'Video': '#ff3366',
  'Mezinárodní': '#00e5a0',
  'Eventy': '#00e5a0',
  'Rada zástupců': '#ffb800',
  'Předsednictvo': '#b44fff',
}

const getBucketColor = (b) => BUCKET_COLORS[b] || G.accent
const getInitials = (n) => n ? n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() : '??'

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
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">[<span>CTRL</span>]</div>
        <div className="login-sub" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Members Portal · CEE Youth Platform</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.text2, marginBottom: 32, letterSpacing: 1, fontStyle: 'italic' }}>
          "Take control before someone else does."
        </div>
        <div className="login-label">Email</div>
        <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="tvuj@email.cz" autoComplete="email" />
        <div className="login-label">Heslo</div>
        <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" autoComplete="current-password" />
        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? 'PŘIHLAŠUJI...' : 'PŘIHLÁSIT SE →'}
        </button>
        {error && <div className="login-err">{error}</div>}
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
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Vítej zpět, {profile.name.split(' ')[0]} 👋
        </div>
        <div className="motto">"Take control before someone else does."</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderBottom: `2px solid ${G.accent}` }}>
          <div className="stat-val" style={{ color: G.accent }}>{totalOpen}</div>
          <div className="stat-label">Otevřené úkoly</div>
        </div>
        <div className="stat-card" style={{ borderBottom: `2px solid ${G.success}` }}>
          <div className="stat-val" style={{ color: G.success }}>{totalDone}</div>
          <div className="stat-label">Splněné úkoly</div>
        </div>
        <div className="stat-card" style={{ borderBottom: `2px solid ${G.warning}` }}>
          <div className="stat-val" style={{ color: G.warning }}>{myOpenTasks.length}</div>
          <div className="stat-label">Moje úkoly</div>
        </div>
        <div className="stat-card" style={{ borderBottom: `2px solid ${G.info}` }}>
          <div className="stat-val" style={{ color: G.info }}>{activeMembers}</div>
          <div className="stat-label">Aktivní tento týden</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="sec" style={{ marginBottom: 0 }}>OZNÁMENÍ</div>
            {admin && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-p" style={{ fontSize: 10, padding: '6px 12px' }} onClick={() => setShowAddNews(v => !v)}>+ PŘIDAT</button>
              </div>
            )}
          </div>

          {showAddNews && (
            <div className="form-wrap">
              <div className="form-row">
                <input className="fi" placeholder="Nadpis..." value={newNews.title} onChange={e => setNewNews(p => ({ ...p, title: e.target.value }))} />
                <input className="fi" placeholder="Tag..." value={newNews.tag} onChange={e => setNewNews(p => ({ ...p, tag: e.target.value }))} style={{ maxWidth: 100 }} />
                <select className="fs" value={newNews.type} onChange={e => setNewNews(p => ({ ...p, type: e.target.value }))}>
                  <option value="accent">Modrá</option>
                  <option value="warn">Žlutá</option>
                  <option value="ok">Zelená</option>
                </select>
              </div>
              <div className="form-row">
                <input className="fi" placeholder="Text oznámení..." value={newNews.body} onChange={e => setNewNews(p => ({ ...p, body: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-p" onClick={addNews}>PŘIDAT</button>
                <button className="btn btn-g" onClick={() => setShowAddNews(false)}>ZRUŠIT</button>
              </div>
            </div>
          )}

          {news.slice(0, 5).map(n => (
            <div key={n.id} className="news-item">
              <div className="news-dot" style={{ background: n.type === 'warn' ? G.warning : n.type === 'ok' ? G.success : G.accent }} />
              <div style={{ flex: 1 }}>
                <div className="news-title">{n.title}</div>
                <div className="news-body">{n.body}</div>
                <div className="news-meta">{formatDate(n.created_at)} · {n.tag}</div>
              </div>
              {admin && <div className="news-delete" onClick={() => deleteNews(n.id)}>✕</div>}
            </div>
          ))}
          {news.length === 0 && <div style={{ color: G.text2, fontSize: 12 }}>Žádná oznámení.</div>}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="sec" style={{ marginBottom: 0 }}>KALENDÁŘ AKCÍ</div>
            {admin && <button className="btn btn-p" style={{ fontSize: 10, padding: '6px 12px' }} onClick={() => setShowAddEvent(v => !v)}>+ PŘIDAT</button>}
          </div>

          {showAddEvent && (
            <div className="form-wrap">
              <div className="form-row">
                <input className="fi" placeholder="Název akce..." value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} />
                <select className="fs" value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}>
                  <option value="event">Akce</option>
                  <option value="deadline">Deadline</option>
                  <option value="meeting">Schůzka</option>
                </select>
              </div>
              <div className="form-row">
                <input className="fi" type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} />
                <input className="fi" type="time" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} style={{ maxWidth: 120 }} />
              </div>
              <div className="form-row">
                <input className="fi" placeholder="Popis..." value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-p" onClick={addEvent}>PŘIDAT</button>
                <button className="btn btn-g" onClick={() => setShowAddEvent(false)}>ZRUŠIT</button>
              </div>
            </div>
          )}

          {events.slice(0, 6).map(e => (
            <div key={e.id} className="event-item">
              <div className="event-date">{e.date}{e.time && ` · ${e.time}`}</div>
              <div style={{ flex: 1 }}>
                <div className="event-title">{e.title}</div>
                {e.description && <div className="event-desc">{e.description}</div>}
              </div>
              <span className={`event-type type-${e.type}`}>{e.type === 'event' ? 'AKCE' : e.type === 'deadline' ? 'DEADLINE' : 'SCHŮZKA'}</span>
            </div>
          ))}
          {events.length === 0 && <div style={{ color: G.text2, fontSize: 12 }}>Žádné nadcházející akce.</div>}
        </div>
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
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="sec" style={{ marginBottom: 0 }}>ÚKOLY {activeBucket && `· ${activeBucket}`}</div>
        {canAdd && profile.layer !== 'pozorovatel' && (
          <button className="btn btn-p" onClick={() => setShowAdd(v => !v)}>+ PŘIDAT ÚKOL</button>
        )}
      </div>

      {showAdd && canAdd && (
        <div className="form-wrap">
          <div className="form-row">
            <input className="fi" placeholder="Název úkolu..." value={newTask.name} onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))} />
            <input className="fi" placeholder="Přiřadit..." value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))} style={{ maxWidth: 160 }} />
            <input className="fi" placeholder="Termín..." value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))} style={{ maxWidth: 120 }} />
          </div>
          <div className="form-row">
            <select className="fs" value={newTask.tag} onChange={e => setNewTask(p => ({ ...p, tag: e.target.value }))}>
              <option value="other">Obecné</option>
              <option value="podcast">Podcast</option>
              <option value="research">Research</option>
              <option value="social">Social</option>
              <option value="event">Event</option>
            </select>
            {admin && (
              <select className="fs" value={newTask.bucket_target} onChange={e => setNewTask(p => ({ ...p, bucket_target: e.target.value }))}>
                <option value="all">Všechny buňky</option>
                {ALL_BUCKETS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            <button className="btn btn-p" onClick={addTask}>PŘIDAT</button>
            <button className="btn btn-g" onClick={() => setShowAdd(false)}>ZRUŠIT</button>
          </div>
        </div>
      )}

      <div className="tabs">
        <div className={`tab${activeTab === 'open' ? ' active' : ''}`} onClick={() => setActiveTab('open')}>
          OTEVŘENÉ ({openTasks.length})
        </div>
        <div className={`tab${activeTab === 'done' ? ' active' : ''}`} onClick={() => setActiveTab('done')}>
          SPLNĚNÉ ({doneTasks.length})
        </div>
      </div>

      {displayTasks.map(t => (
        <div key={t.id} className={`task-item${t.done ? ' is-done' : ''}`}>
          {profile.layer !== 'pozorovatel' && (
            <div className={`task-check${t.done ? ' done' : ''}`} onClick={() => toggleTask(t)} />
          )}
          <div style={{ flex: 1 }}>
            <div className="task-name">{t.name}</div>
            <div className="task-meta">{t.assignee && `${t.assignee} · `}{t.due && `Termín: ${t.due}`}</div>
            {t.done && t.completed_at && <div className="task-completor">✓ {getCompletorName(t)}</div>}
          </div>
          <span className={`tag tag-${t.tag}`}>{t.tag}</span>
        </div>
      ))}
      {displayTasks.length === 0 && (
        <div style={{ color: G.text2, fontSize: 13, padding: '20px 0' }}>
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

  if (loading) return <div style={{ color: G.text2, fontSize: 13 }}>Načítám zprávy...</div>

  return (
    <div className="chat-wrap fade-in">
      <div className="sec">CHAT · {bucket.toUpperCase()}</div>
      {pinnedMsg && (
        <div className="chat-pinned">
          <div className="chat-pinned-icon">📌</div>
          <div className="chat-pinned-text"><strong>{pinnedMsg.author_name}:</strong> {pinnedMsg.text}</div>
        </div>
      )}
      <div className="chat-msgs">
        {messages.map(m => {
          const isOwn = m.author_id === profile.id
          return (
            <div key={m.id} className={`msg${isOwn ? ' own' : ''}`}>
              <div className="msg-av" style={{ background: isOwn ? G.accent : G.panel2, color: isOwn ? '#fff' : G.text }}>
                {m.author_initials}
              </div>
              <div className="msg-bubble">
                <div className="msg-author">
                  {m.author_name}
                  {isAdmin(profile.layer) && !isOwn && (
                    <span className="pin-btn" onClick={() => pinMessage(m)}>📌 připnout</span>
                  )}
                </div>
                <div className="msg-text">{m.text}</div>
                <div className="msg-time">{formatDate(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {canWrite ? (
        <div className="chat-input-row">
          <input className="chat-input" placeholder="Napiš zprávu..." value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
          <button className="btn btn-p" onClick={sendMessage} style={{ padding: '12px 20px', fontFamily: 'JetBrains Mono, monospace' }}>→</button>
        </div>
      ) : (
        <div style={{ padding: '12px 0', color: G.text2, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', borderTop: `1px solid ${G.border}` }}>
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

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div style={{
        background: G.panel, border: `1px solid ${G.border}`,
        borderRadius: 4, width: '100%', maxWidth: 480,
        maxHeight: '85vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '28px 28px 20px', borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: getBucketColor(member.bucket) + '22',
              border: `2px solid ${getBucketColor(member.bucket)}44`,
              color: getBucketColor(member.bucket),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
              flexShrink: 0
            }}>
              {getInitials(member.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{member.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                {roleLabel}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.text2, letterSpacing: 1 }}>
                {member.bucket}{member.secondary_bucket ? ` · ${member.secondary_bucket}` : ''}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: G.text2, fontSize: 20, cursor: 'pointer', padding: 4 }}>×</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '16px 28px', borderBottom: `1px solid ${G.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: G.accent }}>{openTasks.length}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: G.text2, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>otevřené úkoly</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{doneTasks.length}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: G.text2, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>splněno</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: member.last_seen && (Date.now() - new Date(member.last_seen)) < 300000 ? '#4ade80' : G.text2, marginTop: 4 }}>
              {lastSeen}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: G.text2, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>naposledy online</div>
          </div>
        </div>

        {/* Open tasks */}
        {openTasks.length > 0 && (
          <div style={{ padding: '16px 28px', borderBottom: `1px solid ${G.border}` }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.text2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
              Otevřené úkoly ({openTasks.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {openTasks.slice(0, 5).map(t => (
                <div key={t.id} style={{ fontSize: 13, padding: '8px 12px', background: G.bg2, borderLeft: `2px solid ${G.accent}`, borderRadius: 2 }}>
                  {t.text}
                  {t.due_date && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.text2, marginLeft: 8 }}>{t.due_date}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {openTasks.length === 0 && (
          <div style={{ padding: '16px 28px', borderBottom: `1px solid ${G.border}` }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.text2, letterSpacing: 1, textAlign: 'center' }}>
              Žádné otevřené úkoly
            </div>
          </div>
        )}

        <div style={{ padding: '12px 28px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: G.text2, letterSpacing: 1 }}>
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
  const color = getBucketColor(bucket)

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 4, height: 36, background: color }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{bucket}</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.text2, letterSpacing: 2, textTransform: 'uppercase' }}>
            {bucketMembers.length} členů
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {bucketMembers.slice(0, 6).map(m => (
            <div key={m.id} className="bucket-member-av" style={{ background: color + '22', border: `1px solid ${color}44`, color, cursor: 'pointer' }}
              onClick={() => setSelectedMember(m)} title={m.name}>
              {getInitials(m.name)}
            </div>
          ))}
          {selectedMember && <MemberModal member={selectedMember} tasks={tasks} onClose={() => setSelectedMember(null)} />}
        </div>
      </div>

      <div className="tabs">
        <div className={`tab${view === 'tasks' ? ' active' : ''}`} onClick={() => setView('tasks')}>ÚKOLY</div>
        <div className={`tab${view === 'chat' ? ' active' : ''}`} onClick={() => setView('chat')}>CHAT</div>
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
    <div className="fade-in">
      <div className="sec">BUŇKY PROJEKTU</div>
      <div className="bucket-grid">
        {accessible.map(bucket => {
          const color = getBucketColor(bucket)
          const bucketTasks = tasks.filter(t => (t.bucket_target === bucket || t.bucket_target === 'all') && !t.done)
          const bucketMembers = members.filter(m => m.bucket === bucket || m.secondary_bucket === bucket)
          const isSpecial = SPECIAL_BUCKETS.includes(bucket)

          return (
            <div key={bucket} className="bucket-card" style={{ '--bc': color }}
              onClick={() => onSelectBucket(bucket)}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="bucket-name">{bucket}</div>
                {isSpecial && (
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, padding: '2px 6px', background: color + '22', color, letterSpacing: 1, textTransform: 'uppercase' }}>
                    ORGÁN
                  </span>
                )}
              </div>
              <div className="bucket-count">{bucketTasks.length} otevřených úkolů · {bucketMembers.length} členů</div>
              <div className="bucket-members">
                {bucketMembers.slice(0, 5).map(m => (
                  <div key={m.id} className="bucket-member-av" style={{ background: color + '20', border: `1px solid ${color}40`, color, cursor: 'pointer' }}
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

  const getLastSeenClass = (lastSeen) => {
    if (!lastSeen) return 'last-seen-never'
    const diff = new Date() - new Date(lastSeen)
    if (diff < 86400000) return 'last-seen-good'
    if (diff < 86400000 * 3) return 'last-seen-ok'
    if (diff < 86400000 * 7) return 'last-seen-bad'
    return 'last-seen-never'
  }

  const bucketStats = ALL_BUCKETS.map(bucket => {
    const bucketMembers = members.filter(m => m.bucket === bucket)
    const active = bucketMembers.filter(m => m.last_seen && new Date() - new Date(m.last_seen) < 86400000 * 7)
    return { bucket, total: bucketMembers.length, active: active.length }
  }).filter(s => s.total > 0)

  const maxActive = Math.max(...bucketStats.map(s => s.active), 1)

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div className="sec" style={{ marginBottom: 0 }}>ADMIN PANEL</div>
        <span style={{ background: G.danger, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, padding: '2px 8px', letterSpacing: 1 }}>POUZE ADMIN</span>
      </div>

      <div className="tabs">
        <div className={`tab${activeTab === 'members' ? ' active' : ''}`} onClick={() => setActiveTab('members')}>ČLENOVÉ ({members.length})</div>
        <div className={`tab${activeTab === 'stats' ? ' active' : ''}`} onClick={() => setActiveTab('stats')}>STATISTIKY</div>
        <div className={`tab${activeTab === 'add' ? ' active' : ''}`} onClick={() => setActiveTab('add')}>PŘIDAT ČLENA</div>
      </div>

      {activeTab === 'members' && (
        <div>
          {members.map(m => (
            <div key={m.id} className="member-row">
              <div style={{ width: 34, height: 34, background: getBucketColor(m.bucket) + '22', border: `1px solid ${getBucketColor(m.bucket)}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: getBucketColor(m.bucket), flexShrink: 0 }}>
                {getInitials(m.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.text2, marginTop: 2 }}>
                  {m.role} · {m.bucket}{m.secondary_bucket && ` + ${m.secondary_bucket}`}
                </div>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, padding: '2px 7px', letterSpacing: 1, textTransform: 'uppercase', background: ROLE_COLORS[m.layer] + '20', color: ROLE_COLORS[m.layer] }}>
                {ROLE_LABELS[m.layer] || m.layer}
              </span>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, minWidth: 120, textAlign: 'right' }} className={getLastSeenClass(m.last_seen)}>
                {formatTime(m.last_seen)}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'stats' && (
        <div>
          <div className="report-card">
            <div className="sec">AKTIVITA BUNĚK — POSLEDNÍCH 7 DNÍ</div>
            {bucketStats.map(s => (
              <div key={s.bucket} className="report-bucket">
                <div style={{ width: 140, fontSize: 12, color: G.text2 }}>{s.bucket}</div>
                <div className="report-bar">
                  <div className="report-bar-fill" style={{ width: `${(s.active / maxActive) * 100}%`, background: getBucketColor(s.bucket) }} />
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: G.text2, minWidth: 80, textAlign: 'right' }}>
                  {s.active}/{s.total} aktivních
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="form-wrap" style={{ border: `1px solid ${G.warning}` }}>
          <div className="sec">JAK PŘIDAT ČLENA</div>
          <div style={{ fontSize: 12, color: G.text2, lineHeight: 1.8, fontFamily: 'JetBrains Mono, monospace' }}>
            <div style={{ color: G.warning, marginBottom: 8 }}>Krok 1 — Supabase → Authentication → Users → Add User</div>
            <div style={{ color: G.text2, marginBottom: 4 }}>Email + heslo + Auto Confirm User ✓</div>
            <div style={{ color: G.text2, marginBottom: 16 }}>Zkopíruj UUID nového uživatele</div>
            <div style={{ color: G.warning, marginBottom: 8 }}>Krok 2 — Supabase → SQL Editor → spusť:</div>
            <div style={{ background: G.bg2, padding: 12, color: G.success, fontSize: 11, lineHeight: 2, borderLeft: `2px solid ${G.accent}` }}>
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
            <div style={{ color: G.text2, marginTop: 12, fontSize: 11 }}>
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
    active: { color: G.success, label: 'Aktivní', dot: 'status-active' },
    away: { color: G.warning, label: 'Zaneprázdněn', dot: 'status-away' },
    needs_help: { color: G.danger, label: 'Potřebuji pomoc', dot: 'status-help' },
  }

  const myStats = members.find(m => m.id === profile.id)

  return (
    <div className="fade-in">
      <div className="sec">PROFIL ČLENA</div>
      <div className="profile-grid">
        <div style={{ background: G.panel, border: `1px solid ${G.border}`, padding: 28 }}>
          <div className="profile-av-big" style={{ background: getBucketColor(profile.bucket) + '30', border: `2px solid ${getBucketColor(profile.bucket)}50`, color: getBucketColor(profile.bucket) }}>
            {getInitials(profile.name)}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{profile.name}</div>
          <div style={{ display: 'inline-block', background: ROLE_COLORS[profile.layer] + '20', color: ROLE_COLORS[profile.layer], fontFamily: 'JetBrains Mono, monospace', fontSize: 9, padding: '3px 10px', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            {ROLE_LABELS[profile.layer] || profile.layer}
          </div>
          <div className="div" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: G.text2, marginBottom: 4 }}>Buňka</div>
            <div style={{ fontSize: 13 }}>{profile.bucket}</div>
          </div>
          {profile.secondary_bucket && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: G.text2, marginBottom: 4 }}>Sekundární buňka</div>
              <div style={{ fontSize: 13 }}>{profile.secondary_bucket}</div>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: G.text2, marginBottom: 8 }}>Stav</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div className={`status-dot ${statusConfig[status].dot}`} />
              <span style={{ fontSize: 13 }}>{statusConfig[status].label}</span>
            </div>
            <div className="status-picker">
              {Object.entries(statusConfig).map(([key, val]) => (
                <div key={key} className={`status-opt${status === key ? ' selected' : ''}`}
                  style={{ color: val.color, borderColor: status === key ? val.color : G.border }}
                  onClick={() => updateStatus(key)}>
                  {val.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: G.panel, border: `1px solid ${G.border}`, padding: 20 }}>
            <div className="sec">PŘÍSTUPOVÁ PRÁVA</div>
            {[
              'Dashboard a oznámení',
              profile.layer !== 'pozorovatel' && 'Chat v buňce',
              profile.layer !== 'pozorovatel' && 'Označování úkolů',
              canAddTasks(profile.layer) && 'Přidávání úkolů',
              isAdmin(profile.layer) && 'Admin panel',
              isAdmin(profile.layer) && 'Správa všech buněk',
              profile.layer === 'pozorovatel' && 'Čtení všech buněk',
            ].filter(Boolean).map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ color: G.success, fontFamily: 'JetBrains Mono', fontSize: 11 }}>✓</span>
                <span style={{ fontSize: 13, color: G.text2 }}>{p}</span>
              </div>
            ))}
          </div>

          <PasswordChange />

          <div style={{ background: G.panel, border: `1px solid ${G.border}`, padding: 20 }}>
            <div className="sec">DOKUMENTY SPOLKU</div>
            <div style={{ fontSize: 12, color: G.text2, marginBottom: 14, lineHeight: 1.6 }}>
              Oficiální dokumenty CTRL Europe Team, z. s. Kliknutím stáhneš dokument.
            </div>
            {[
              { name: 'Stanovy spolku', desc: 'Kompletní stanovy CTRL Europe Team, z. s.', icon: '📋' },
              { name: 'Zakládací listina', desc: 'Zakládací listina spolku', icon: '📄' },
              { name: 'GDPR — Zásady zpracování osobních údajů', desc: 'Jak zpracováváme tvé osobní údaje', icon: '🔒' },
              { name: 'Členský závazek', desc: 'Vzor členského závazku spolku', icon: '✍️' },
            ].map(doc => (
              <div key={doc.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: `1px solid ${G.border}`,
                cursor: 'default', opacity: 0.7
              }}>
                <span style={{ fontSize: 18 }}>{doc.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{doc.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.text2, letterSpacing: 0.5 }}>{doc.desc}</div>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: G.text2, letterSpacing: 1 }}>BRZY</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.text2, letterSpacing: 1 }}>
              Dokumenty budou k dispozici po finálním podpisu a zápisu spolku.
            </div>
          </div>

          <div style={{ background: G.panel, border: `1px solid ${G.border}`, padding: 20 }}>
            <div className="sec">CTRL EUROPE TEAM</div>
            <div style={{ fontSize: 13, color: G.text2, lineHeight: 1.7 }}>
              CEE Youth Platform zaměřená na digitální hrozby naší generace. AI, deepfakes, dezinformace — a proč nás školy nepřipravují.
            </div>
            <div style={{ marginTop: 14, fontFamily: 'JetBrains Mono', fontSize: 11, color: G.accent, letterSpacing: 1, fontStyle: 'italic' }}>
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
    <div style={{ background: G.panel, border: `1px solid ${G.border}`, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="sec" style={{ marginBottom: 0 }}>ZMĚNIT HESLO</div>
        <button className="btn btn-g" style={{ fontSize: 10, padding: '6px 12px' }} onClick={() => { setOpen(v => !v); setMsg(''); setError('') }}>
          {open ? 'ZRUŠIT' : 'ZMĚNIT'}
        </button>
      </div>
      {msg && <div style={{ color: G.success, fontFamily: 'JetBrains Mono', fontSize: 11, marginTop: 10 }}>✓ {msg}</div>}
      {open && (
        <div style={{ marginTop: 14, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: G.text2, marginBottom: 6 }}>Původní heslo</div>
            <input className="fi" type="password" placeholder="Původní heslo..." value={oldPass} onChange={e => setOldPass(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: G.text2, marginBottom: 6 }}>Nové heslo</div>
            <input className="fi" type="password" placeholder="Nové heslo (min. 6 znaků)..." value={newPass} onChange={e => setNewPass(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: G.text2, marginBottom: 6 }}>Potvrdit nové heslo</div>
            <input className="fi" type="password" placeholder="Zopakuj nové heslo..." value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChange()} style={{ width: '100%' }} />
          </div>
          {error && <div style={{ color: G.danger, fontFamily: 'JetBrains Mono', fontSize: 11, marginBottom: 10 }}>// {error}</div>}
          <button className="btn btn-p" onClick={handleChange} disabled={loading}>
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
    <div className="loading">
        <div className="loading-logo">[<span>CTRL</span>]</div>
        <div className="loading-text">Načítám portál...</div>
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
    <div className="app">
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-glitch">[<span>CTRL</span>]</div>
            <div className="sidebar-logo-sub">Members Portal</div>
          </div>

          <div className="sidebar-user">
            <div className="sidebar-av" style={{ background: getBucketColor(profile.bucket) + '25', border: `1px solid ${getBucketColor(profile.bucket)}50`, color: getBucketColor(profile.bucket) }}>
              {getInitials(profile.name)}
            </div>
            <div className="sidebar-name">{profile.name}</div>
            <div className="sidebar-role-badge" style={{ background: ROLE_COLORS[profile.layer] + '20', color: ROLE_COLORS[profile.layer] }}>
              {ROLE_LABELS[profile.layer]}
            </div>
            <div className="sidebar-status">
              <div className={`status-dot ${myStatus.dot}`} />
              <span className="status-text">{myStatus.label}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">Navigace</div>
            {NAV_MAIN.map(n => (
              <div key={n.id} className={`nav-item${page === n.id && !activeBucket ? ' active' : ''}`}
                onClick={() => { setPage(n.id); setActiveBucket(null) }}>
                <span className="nav-icon">{n.icon}</span>
                <span>{n.label}</span>
                {n.id === 'dashboard' && myOpenCount > 0 && <span className="nav-badge">{myOpenCount}</span>}
              </div>
            ))}

            {teamBuckets.length > 0 && (
              <>
                <div className="nav-section">Týmové buňky</div>
                {teamBuckets.map(b => (
                  <div key={b} className={`nav-item${activeBucket === b ? ' active' : ''}`}
                    onClick={() => handleSelectBucket(b)}>
                    <div className="nav-bucket-color" style={{ background: getBucketColor(b) }} />
                    <span style={{ fontSize: 11 }}>{b}</span>
                  </div>
                ))}
              </>
            )}

            {specialBuckets.length > 0 && (
              <>
                <div className="nav-section">Orgány</div>
                {specialBuckets.map(b => (
                  <div key={b} className={`nav-item${activeBucket === b ? ' active' : ''}`}
                    onClick={() => handleSelectBucket(b)}>
                    <div className="nav-bucket-color" style={{ background: getBucketColor(b) }} />
                    <span style={{ fontSize: 11 }}>{b}</span>
                  </div>
                ))}
              </>
            )}
          </nav>

          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={handleLogout}>ODHLÁSIT SE</button>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <span className="topbar-title">
              [CTRL] ·{' '}
              {activeBucket ? activeBucket :
                page === 'dashboard' ? 'Dashboard' :
                  page === 'buckets' ? 'Buňky' :
                    page === 'profile' ? 'Profil' :
                      page === 'admin' ? 'Admin' : ''}
            </span>
            {activeBucket && (
              <button className="btn btn-g" style={{ fontSize: 10, padding: '4px 10px' }}
                onClick={() => { setActiveBucket(null); setPage('buckets') }}>
                ← Zpět
              </button>
            )}
            {myOpenCount > 0 && !activeBucket && (
              <span className="topbar-badge" style={{ background: G.accent }}>
                {myOpenCount} ÚKOLŮ
              </span>
            )}
            {admin && (
              <span className="topbar-badge" style={{ background: G.danger, marginLeft: 'auto' }}>ADMIN</span>
            )}
          </div>

          <div className="content">
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

  const BUCKET_COLORS = {
    'PR a komunikace': '#2A6BFF', 'Sociální sítě': '#ffb800', 'Podcast': '#b44fff',
    'Research': '#00c9ff', 'Grafika': '#ff6b35', 'Video': '#ff3366',
    'Mezinárodní': '#00e5a0', 'Eventy': '#00e5a0', 'Rada zástupců': '#ffb800', 'Předsednictvo': '#b44fff',
  }

  return (
    <>
      <div className="bottom-nav">
        {navItems.map(n => (
          <div key={n.id}
            className={"bottom-nav-item" + (page === n.id && !activeBucket ? ' active' : '')}
            onClick={() => { setPage(n.id); setActiveBucket(null); setDrawerOpen(false) }}>
            {n.id === 'dashboard' && myOpenCount > 0 && <span className="bottom-nav-badge">{myOpenCount}</span>}
            <span className="bottom-nav-icon">{n.icon}</span>
            <span className="bottom-nav-label">{n.label}</span>
          </div>
        ))}
        <div className={"bottom-nav-item" + (drawerOpen || activeBucket ? ' active' : '')}
          onClick={() => setDrawerOpen(v => !v)}>
          <span className="bottom-nav-icon">☰</span>
          <span className="bottom-nav-label">Menu</span>
        </div>
      </div>

      <div className={"bucket-drawer" + (drawerOpen ? ' open' : '')} onClick={() => setDrawerOpen(false)}>
        <div className="bucket-drawer-content" onClick={e => e.stopPropagation()}>
          <div className="drawer-handle" />
          <div className="drawer-section">Týmové buňky</div>
          {teamBuckets.map(b => {
            const bucketTasks = tasks.filter(t => (t.bucket_target === b) && !t.done)
            return (
              <div key={b} className="drawer-bucket-item" onClick={() => { handleSelectBucket(b); setDrawerOpen(false) }}>
                <div className="drawer-bucket-dot" style={{ background: BUCKET_COLORS[b] || '#2A6BFF' }} />
                <span className="drawer-bucket-name">{b}</span>
                {bucketTasks.length > 0 && <span className="drawer-bucket-count">{bucketTasks.length} úkolů</span>}
              </div>
            )
          })}
          {specialBuckets.length > 0 && (
            <>
              <div className="drawer-section">Orgány</div>
              {specialBuckets.map(b => (
                <div key={b} className="drawer-bucket-item" onClick={() => { handleSelectBucket(b); setDrawerOpen(false) }}>
                  <div className="drawer-bucket-dot" style={{ background: BUCKET_COLORS[b] || '#2A6BFF' }} />
                  <span className="drawer-bucket-name">{b}</span>
                </div>
              ))}
            </>
          )}
          <div style={{ paddingTop: 12 }}>
            <div className="drawer-bucket-item" onClick={() => { setDrawerOpen(false) }} style={{ opacity: 0.5 }}>
              <span style={{ fontSize: 13, color: '#7878a0' }}>Zavřít</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
