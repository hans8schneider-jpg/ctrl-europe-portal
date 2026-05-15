import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'

// ─── STYLES ──────────────────────────────────────────────────────────────────
const G = {
  bg: '#050508', bg2: '#0a0a10', bg3: '#0f0f18',
  panel: '#11111c', panel2: '#161625',
  border: '#1e1e35', border2: '#252540',
  accent: '#2A6BFF', accent2: '#1a4fd4',
  accentGlow: 'rgba(42,107,255,0.15)',
  text: '#e8e8f0', text2: '#8888aa', text3: '#444466',
  danger: '#ff3355', success: '#00e5a0', warning: '#ffb800',
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: ${G.bg}; color: ${G.text}; font-family: 'Syne', sans-serif; overflow-x: hidden; }
  body::before {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,16,0.06) 2px, rgba(0,0,16,0.06) 4px);
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; }
  ::-webkit-scrollbar-track { background: transparent; }

  .mono { font-family: 'JetBrains Mono', monospace !important; }

  /* LOGIN */
  .login-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(42,107,255,0.1) 0%, transparent 70%), ${G.bg};
    padding: 20px;
  }
  .login-box {
    width: 100%; max-width: 400px; background: ${G.panel};
    border: 1px solid ${G.border}; padding: 44px 36px; position: relative; overflow: hidden;
  }
  .login-box::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, ${G.accent}, transparent);
  }
  .login-logo { font-family: 'JetBrains Mono', monospace; font-size: 40px; font-weight: 700; letter-spacing: -2px; margin-bottom: 4px; }
  .login-logo span { color: ${G.accent}; }
  .login-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 3px; color: ${G.text2}; text-transform: uppercase; margin-bottom: 36px; }
  .login-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: ${G.text2}; margin-bottom: 8px; }
  .login-input {
    width: 100%; background: ${G.bg2}; border: 1px solid ${G.border}; color: ${G.text};
    padding: 13px 15px; font-size: 14px; font-family: 'Syne', sans-serif; outline: none;
    transition: border-color 0.2s; margin-bottom: 18px; display: block;
  }
  .login-input:focus { border-color: ${G.accent}; }
  .login-btn {
    width: 100%; background: ${G.accent}; color: #fff; border: none; padding: 15px;
    font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    cursor: pointer; font-family: 'Syne', sans-serif; transition: background 0.2s; margin-top: 6px;
  }
  .login-btn:hover { background: ${G.accent2}; }
  .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .login-err { color: ${G.danger}; font-size: 11px; margin-top: 10px; font-family: 'JetBrains Mono', monospace; }

  /* LAYOUT */
  .app-wrap { display: flex; min-height: 100vh; }

  /* SIDEBAR */
  .sidebar {
    width: 220px; min-height: 100vh; background: ${G.panel}; border-right: 1px solid ${G.border};
    display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
    transition: width 0.2s;
  }
  .sidebar-logo { padding: 24px 20px 16px; border-bottom: 1px solid ${G.border}; }
  .sidebar-logo-text { font-family: 'JetBrains Mono', monospace; font-size: 26px; font-weight: 700; letter-spacing: -1px; }
  .sidebar-logo-text span { color: ${G.accent}; }
  .sidebar-logo-sub { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px; color: ${G.text2}; text-transform: uppercase; margin-top: 2px; }
  .sidebar-user { padding: 14px 20px; border-bottom: 1px solid ${G.border}; }
  .sidebar-avatar {
    width: 34px; height: 34px; background: ${G.accent}; display: flex; align-items: center;
    justify-content: center; font-weight: 700; font-size: 13px; margin-bottom: 8px;
    font-family: 'JetBrains Mono', monospace;
  }
  .sidebar-name { font-size: 13px; font-weight: 700; }
  .sidebar-role { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${G.accent}; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
  .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 11px 20px; cursor: pointer;
    color: ${G.text2}; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
    border-left: 2px solid transparent; transition: all 0.15s;
  }
  .nav-item:hover { background: rgba(42,107,255,0.04); color: ${G.text}; }
  .nav-item.active { background: ${G.accentGlow}; color: ${G.accent}; border-left-color: ${G.accent}; }
  .nav-icon { font-size: 15px; width: 18px; text-align: center; flex-shrink: 0; }
  .sidebar-bottom { padding: 14px 20px; border-top: 1px solid ${G.border}; }
  .logout-btn {
    width: 100%; background: transparent; border: 1px solid ${G.border}; color: ${G.text2};
    padding: 9px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
    font-family: 'JetBrains Mono', monospace; transition: all 0.2s;
  }
  .logout-btn:hover { border-color: ${G.danger}; color: ${G.danger}; }

  /* MAIN */
  .main { margin-left: 220px; flex: 1; min-height: 100vh; }
  .topbar {
    height: 56px; background: ${G.panel}; border-bottom: 1px solid ${G.border};
    display: flex; align-items: center; padding: 0 28px; gap: 12px;
    position: sticky; top: 0; z-index: 50;
  }
  .topbar-title { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: ${G.text2}; }
  .topbar-badge { background: ${G.accent}; color: #fff; font-size: 9px; padding: 2px 8px; font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
  .content { padding: 28px; }

  /* CARDS */
  .card {
    background: ${G.panel}; border: 1px solid ${G.border}; transition: border-color 0.2s;
    position: relative; overflow: hidden;
  }
  .card:hover { border-color: ${G.border2}; }
  .card.interactive { cursor: pointer; }
  .card.interactive:hover { border-color: ${G.accent}; }
  .card-accent::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: ${G.accent}; }

  /* STATS */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card { padding: 20px; position: relative; overflow: hidden; background: ${G.panel}; border: 1px solid ${G.border}; }
  .stat-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
  .stat-card.blue::after { background: ${G.accent}; }
  .stat-card.green::after { background: ${G.success}; }
  .stat-card.yellow::after { background: ${G.warning}; }
  .stat-card.red::after { background: ${G.danger}; }
  .stat-val { font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
  .stat-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: ${G.text2}; }

  /* SECTION TITLE */
  .sec-title {
    font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 3px; text-transform: uppercase;
    color: ${G.text2}; margin-bottom: 14px; display: flex; align-items: center; gap: 10px;
  }
  .sec-title::after { content: ''; flex: 1; height: 1px; background: ${G.border}; }

  /* NEWS */
  .news-item { padding: 18px 20px; display: flex; gap: 14px; align-items: flex-start; margin-bottom: 10px; }
  .news-dot { width: 7px; height: 7px; margin-top: 5px; flex-shrink: 0; }
  .news-title { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
  .news-body { font-size: 12px; color: ${G.text2}; line-height: 1.5; }
  .news-meta { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${G.text2}; margin-top: 5px; letter-spacing: 1px; }

  /* TASKS */
  .task-item { padding: 15px 18px; display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
  .task-check {
    width: 18px; height: 18px; border: 2px solid ${G.border}; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: transparent;
  }
  .task-check.done { background: ${G.accent}; border-color: ${G.accent}; }
  .task-check.done::after { content: '✓'; color: #fff; font-size: 11px; font-weight: 700; }
  .task-name { font-size: 13px; font-weight: 600; }
  .task-item.is-done .task-name { text-decoration: line-through; color: ${G.text2}; }
  .task-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${G.text2}; margin-top: 2px; }
  .tag { font-family: 'JetBrains Mono', monospace; font-size: 9px; padding: 3px 8px; letter-spacing: 1px; text-transform: uppercase; flex-shrink: 0; }
  .tag-podcast { background: rgba(180,79,255,0.12); color: #b44fff; }
  .tag-research { background: rgba(0,229,160,0.1); color: ${G.success}; }
  .tag-social { background: rgba(255,184,0,0.1); color: ${G.warning}; }
  .tag-event { background: rgba(255,51,85,0.1); color: ${G.danger}; }
  .tag-other { background: ${G.panel2}; color: ${G.text2}; }

  /* FORM */
  .form-wrap { background: ${G.panel}; border: 1px solid ${G.accent}; padding: 18px; margin-bottom: 14px; }
  .form-row { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .form-input {
    flex: 1; min-width: 160px; background: ${G.bg2}; border: 1px solid ${G.border}; color: ${G.text};
    padding: 9px 12px; font-size: 13px; font-family: 'Syne', sans-serif; outline: none; transition: border-color 0.2s;
  }
  .form-input:focus { border-color: ${G.accent}; }
  .form-select { background: ${G.bg2}; border: 1px solid ${G.border}; color: ${G.text2}; padding: 9px 12px; font-size: 12px; font-family: 'Syne', sans-serif; outline: none; cursor: pointer; }
  .btn { border: none; padding: 9px 18px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; font-family: 'Syne', sans-serif; transition: background 0.2s; }
  .btn-primary { background: ${G.accent}; color: #fff; }
  .btn-primary:hover { background: ${G.accent2}; }
  .btn-ghost { background: transparent; border: 1px solid ${G.border}; color: ${G.text2}; }
  .btn-ghost:hover { border-color: ${G.text2}; color: ${G.text}; }

  /* CHAT */
  .chat-wrap { display: flex; flex-direction: column; height: calc(100vh - 112px); }
  .chat-msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding-bottom: 16px; }
  .msg { display: flex; gap: 10px; align-items: flex-start; }
  .msg.own { flex-direction: row-reverse; }
  .msg-av {
    width: 30px; height: 30px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
    background: ${G.panel2}; border: 1px solid ${G.border};
  }
  .msg.own .msg-av { background: ${G.accent}; border-color: ${G.accent}; }
  .msg-bubble { max-width: 65%; background: ${G.panel}; border: 1px solid ${G.border}; padding: 10px 14px; }
  .msg.own .msg-bubble { background: rgba(42,107,255,0.1); border-color: rgba(42,107,255,0.3); }
  .msg-author { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${G.accent}; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; }
  .msg.own .msg-author { text-align: right; }
  .msg-text { font-size: 13px; line-height: 1.5; }
  .msg-time { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${G.text2}; margin-top: 3px; }
  .msg.own .msg-time { text-align: right; }
  .chat-input-row { display: flex; gap: 8px; padding-top: 14px; border-top: 1px solid ${G.border}; }
  .chat-input {
    flex: 1; background: ${G.panel}; border: 1px solid ${G.border}; color: ${G.text};
    padding: 12px 16px; font-size: 13px; font-family: 'Syne', sans-serif; outline: none; transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: ${G.accent}; }

  /* DOCS */
  .docs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .doc-card { padding: 20px; cursor: pointer; background: ${G.panel}; border: 1px solid ${G.border}; transition: all 0.2s; position: relative; }
  .doc-card:hover { border-color: ${G.accent}; background: ${G.panel2}; }
  .doc-icon { font-size: 26px; margin-bottom: 10px; }
  .doc-name { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .doc-desc { font-size: 11px; color: ${G.text2}; line-height: 1.5; margin-bottom: 10px; }
  .doc-meta { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${G.text2}; letter-spacing: 1px; }
  .doc-badge { position: absolute; top: 14px; right: 14px; font-family: 'JetBrains Mono', monospace; font-size: 8px; padding: 2px 7px; letter-spacing: 1px; text-transform: uppercase; }
  .badge-new { background: rgba(42,107,255,0.2); color: ${G.accent}; }
  .badge-updated { background: rgba(0,229,160,0.1); color: ${G.success}; }

  /* ADMIN */
  .member-row { padding: 14px 18px; display: flex; align-items: center; gap: 14px; margin-bottom: 8px; background: ${G.panel}; border: 1px solid ${G.border}; }
  .member-av { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }
  .member-name { font-size: 13px; font-weight: 700; }
  .member-role { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${G.text2}; margin-top: 2px; }
  .layer-badge { font-family: 'JetBrains Mono', monospace; font-size: 9px; padding: 3px 8px; letter-spacing: 1px; text-transform: uppercase; }
  .layer-admin { background: rgba(255,51,85,0.1); color: ${G.danger}; }
  .layer-core { background: rgba(42,107,255,0.12); color: ${G.accent}; }
  .layer-extended { background: rgba(255,184,0,0.1); color: ${G.warning}; }
  .layer-community { background: rgba(136,138,170,0.1); color: ${G.text2}; }

  /* DIVIDER */
  .divider { height: 1px; background: ${G.border}; margin: 20px 0; }

  /* PROFILE */
  .profile-grid { display: grid; grid-template-columns: 260px 1fr; gap: 16px; }
  .profile-card { background: ${G.panel}; border: 1px solid ${G.border}; padding: 28px; }
  .profile-av-big { width: 72px; height: 72px; background: ${G.accent}; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-bottom: 16px; }
  .profile-name { font-size: 18px; font-weight: 800; margin-bottom: 3px; }
  .profile-role-badge { display: inline-block; background: rgba(42,107,255,0.12); color: ${G.accent}; font-family: 'JetBrains Mono', monospace; font-size: 9px; padding: 3px 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
  .profile-field { margin-bottom: 14px; }
  .profile-field-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: ${G.text2}; margin-bottom: 3px; }
  .profile-field-val { font-size: 13px; }

  /* LOADING */
  .loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: ${G.bg}; }
  .loading-text { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 3px; color: ${G.accent}; text-transform: uppercase; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

  @media (max-width: 768px) {
    .sidebar { width: 52px; }
    .sidebar-logo-text, .sidebar-logo-sub, .sidebar-user, .nav-item span, .sidebar-bottom { display: none; }
    .main { margin-left: 52px; }
    .nav-item { justify-content: center; padding: 14px; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .docs-grid { grid-template-columns: 1fr; }
    .profile-grid { grid-template-columns: 1fr; }
  }
`

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'
const formatTime = (ts) => {
  const d = new Date(ts)
  return `${d.getDate()}. ${d.getMonth() + 1}. · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const BUCKET_COLORS = {
  'PR a komunikace': '#2A6BFF',
  'Sociální sítě': '#ffb800',
  'Podcast': '#b44fff',
  'Research': '#00c9ff',
  'Grafika': '#ff6b35',
  'Video': '#ff3355',
  'Mezinárodní': '#00e5a0',
  'Eventy': '#00e5a0',
  'all': '#2A6BFF',
}
const getBucketColor = (b) => BUCKET_COLORS[b] || '#2A6BFF'

const DOCS = [
  { id: 1, icon: '📋', name: 'Plán roku 1', desc: 'Kompletní roadmapa od května 2025 do května 2026.', meta: 'Aktualizováno 14. 5. 2025', badge: 'new' },
  { id: 2, icon: '🎙️', name: 'Podcast CTRL+ALT', desc: 'Formát, témata první sezóny, seznam hostů.', meta: 'Aktualizováno 14. 5. 2025', badge: 'new' },
  { id: 3, icon: '🏛️', name: 'CTRL Summit 2026', desc: 'Konference — datum, místo, program, řečníci.', meta: 'Aktualizováno 14. 5. 2025', badge: null },
  { id: 4, icon: '💶', name: 'Grantová strategie', desc: 'Visegrad Fund, Erasmus+, Active Citizens Fund.', meta: 'Aktualizováno 14. 5. 2025', badge: 'new' },
  { id: 5, icon: '🔬', name: 'Research report', desc: 'Metodologie prvního výzkumného reportu o CEE školách.', meta: 'Aktualizováno 13. 5. 2025', badge: null },
  { id: 6, icon: '🎨', name: 'Brand Guidelines', desc: 'Logo, barvy, typografie, tone of voice.', meta: 'Rozpracováno', badge: 'updated' },
  { id: 7, icon: '⚖️', name: 'Stanovy spolku', desc: 'Právní dokumenty CTRL Europe Team, z. s.', meta: 'Aktualizováno 14. 5. 2025', badge: 'new' },
  { id: 8, icon: '📅', name: 'Zakládací listina', desc: 'Slavnostní dokument o vzniku spolku.', meta: 'Aktualizováno 14. 5. 2025', badge: 'new' },
]

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return setError('// Vyplň email a heslo')
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError('// ' + (err.message === 'Invalid login credentials' ? 'Chybný email nebo heslo' : err.message))
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">[<span>CTRL</span>]</div>
        <div className="login-sub mono">Members Portal · CEE Youth Platform</div>
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

function Dashboard({ profile, tasks, news }) {
  const openTasks = tasks.filter(t => !t.done)
  const doneTasks = tasks.filter(t => t.done)
  const myTasks = tasks.filter(t => !t.done && (t.bucket === 'all' || t.bucket === profile.bucket))

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-val" style={{ color: G.accent }}>{openTasks.length}</div>
          <div className="stat-label">Otevřené úkoly</div>
        </div>
        <div className="stat-card green">
          <div className="stat-val" style={{ color: G.success }}>{doneTasks.length}</div>
          <div className="stat-label">Splněné úkoly</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-val" style={{ color: G.warning }}>{myTasks.length}</div>
          <div className="stat-label">Moje úkoly</div>
        </div>
        <div className="stat-card red">
          <div className="stat-val" style={{ color: G.danger }}>{news.length}</div>
          <div className="stat-label">Oznámení</div>
        </div>
      </div>

      <div className="sec-title mono">NOVINKY A OZNÁMENÍ</div>
      {news.length === 0 && <div style={{ color: G.text2, fontSize: 13 }}>Žádné novinky.</div>}
      {news.map(n => (
        <div key={n.id} className="card news-item" style={{ marginBottom: 10 }}>
          <div className="news-dot" style={{ background: n.type === 'warn' ? G.warning : n.type === 'ok' ? G.success : G.accent }} />
          <div>
            <div className="news-title">{n.title}</div>
            <div className="news-body">{n.body}</div>
            <div className="news-meta">{formatTime(n.created_at)} · {n.tag}</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 24 }} className="sec-title mono">NEJBLIŽŠÍ ÚKOLY</div>
      {myTasks.slice(0, 4).map(t => (
        <div key={t.id} className="card task-item">
          <div className="task-check" />
          <div style={{ flex: 1 }}>
            <div className="task-name">{t.name}</div>
            <div className="task-meta">{t.assignee} · {t.due}</div>
          </div>
          <span className={`tag tag-${t.tag}`}>{t.tag}</span>
        </div>
      ))}
    </div>
  )
}

function Tasks({ profile, tasks, setTasks }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ name: '', assignee: '', due: '', tag: 'other', bucket: 'all' })
  const isAdmin = profile.layer === 'admin'

  const myTasks = profile.layer === 'admin'
    ? tasks
    : tasks.filter(t => t.bucket === 'all' || t.bucket === profile.bucket)

  const toggleTask = async (task) => {
    const { error } = await supabase.from('tasks').update({ done: !task.done }).eq('id', task.id)
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
  }

  const addTask = async () => {
    if (!newTask.name.trim()) return
    const { data, error } = await supabase.from('tasks').insert([{ ...newTask, created_by: profile.id }]).select()
    if (!error && data) {
      setTasks(prev => [...prev, data[0]])
      setNewTask({ name: '', assignee: '', due: '', tag: 'other', bucket: 'all' })
      setShowAdd(false)
    }
  }

  const BUCKETS = ['all', 'PR a komunikace', 'Sociální sítě', 'Podcast', 'Research', 'Grafika', 'Video', 'Mezinárodní', 'Eventy']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="sec-title mono" style={{ marginBottom: 0 }}>ÚKOLY</div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowAdd(v => !v)}>+ PŘIDAT ÚKOL</button>}
      </div>

      {showAdd && (
        <div className="form-wrap">
          <div className="form-row">
            <input className="form-input" placeholder="Název úkolu..." value={newTask.name} onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))} />
            <input className="form-input" placeholder="Přiřadit..." value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))} style={{ maxWidth: 150 }} />
            <input className="form-input" placeholder="Termín..." value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))} style={{ maxWidth: 120 }} />
          </div>
          <div className="form-row">
            <select className="form-select" value={newTask.tag} onChange={e => setNewTask(p => ({ ...p, tag: e.target.value }))}>
              <option value="other">Obecné</option>
              <option value="podcast">Podcast</option>
              <option value="research">Research</option>
              <option value="social">Social</option>
              <option value="event">Event</option>
            </select>
            <select className="form-select" value={newTask.bucket} onChange={e => setNewTask(p => ({ ...p, bucket: e.target.value }))}>
              {BUCKETS.map(b => <option key={b} value={b}>{b === 'all' ? 'Všechny buňky' : b}</option>)}
            </select>
            <button className="btn btn-primary" onClick={addTask}>PŘIDAT</button>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>ZRUŠIT</button>
          </div>
        </div>
      )}

      {myTasks.map(t => (
        <div key={t.id} className={`card task-item${t.done ? ' is-done' : ''}`} style={{ marginBottom: 8 }}>
          <div className={`task-check${t.done ? ' done' : ''}`} onClick={() => toggleTask(t)} />
          <div style={{ flex: 1 }}>
            <div className="task-name">{t.name}</div>
            <div className="task-meta">{t.assignee} · {t.due} {t.bucket !== 'all' && `· ${t.bucket}`}</div>
          </div>
          <span className={`tag tag-${t.tag}`}>{t.tag}</span>
        </div>
      ))}
      {myTasks.length === 0 && <div style={{ color: G.text2, fontSize: 13 }}>Žádné úkoly.</div>}
    </div>
  )
}

function Chat({ profile }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const bucket = profile.layer === 'admin' ? 'general' : profile.bucket

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from('messages').select('*')
      .eq('bucket', bucket).order('created_at', { ascending: true }).limit(100)
    if (data) setMessages(data)
    setLoading(false)
  }, [bucket])

  useEffect(() => {
    loadMessages()
    const channel = supabase.channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.bucket === bucket) setMessages(prev => [...prev, payload.new])
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadMessages, bucket])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    await supabase.from('messages').insert([{
      text: input, author_id: profile.id,
      author_name: profile.name, author_initials: getInitials(profile.name), bucket
    }])
    setInput('')
  }

  if (loading) return <div style={{ color: G.text2, fontSize: 13 }}>Načítám zprávy...</div>

  return (
    <div className="chat-wrap">
      <div className="sec-title mono">TÝMOVÝ CHAT — {bucket.toUpperCase()}</div>
      <div className="chat-msgs">
        {messages.map(m => {
          const isOwn = m.author_id === profile.id
          return (
            <div key={m.id} className={`msg${isOwn ? ' own' : ''}`}>
              <div className="msg-av">{m.author_initials}</div>
              <div className="msg-bubble">
                <div className="msg-author">{m.author_name}</div>
                <div className="msg-text">{m.text}</div>
                <div className="msg-time">{formatTime(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input className="chat-input" placeholder="Napiš zprávu..." value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
        <button className="btn btn-primary" onClick={sendMessage} style={{ padding: '12px 20px' }}>ODESLAT →</button>
      </div>
    </div>
  )
}

function Docs() {
  return (
    <div>
      <div className="sec-title mono">SDÍLENÉ DOKUMENTY</div>
      <div className="docs-grid">
        {DOCS.map(d => (
          <div key={d.id} className="doc-card">
            {d.badge && <span className={`doc-badge badge-${d.badge}`}>{d.badge === 'new' ? 'NOVÉ' : 'UPDATE'}</span>}
            <div className="doc-icon">{d.icon}</div>
            <div className="doc-name">{d.name}</div>
            <div className="doc-desc">{d.desc}</div>
            <div className="doc-meta">{d.meta}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Profile({ profile }) {
  return (
    <div>
      <div className="sec-title mono">PROFIL ČLENA</div>
      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-av-big" style={{ background: getBucketColor(profile.bucket) }}>
            {getInitials(profile.name)}
          </div>
          <div className="profile-name">{profile.name}</div>
          <div className="profile-role-badge">{profile.role}</div>
          <div className="divider" />
          <div className="profile-field">
            <div className="profile-field-label">Buňka</div>
            <div className="profile-field-val">{profile.bucket}</div>
          </div>
          <div className="profile-field">
            <div className="profile-field-label">Vrstva</div>
            <div className="profile-field-val" style={{ textTransform: 'capitalize' }}>{profile.layer}</div>
          </div>
          <div className="profile-field">
            <div className="profile-field-label">Status</div>
            <div className="profile-field-val" style={{ color: G.success }}>● Aktivní člen</div>
          </div>
          <div className="profile-field">
            <div className="profile-field-label">Projekt</div>
            <div className="profile-field-val">CTRL Europe Team, z. s.</div>
          </div>
        </div>
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 12 }}>
            <div className="sec-title mono">PŘÍSTUPOVÁ PRÁVA</div>
            {['Dashboard', 'Úkoly', 'Dokumenty', 'Týmový chat',
              ...(profile.layer === 'admin' ? ['Přidávat úkoly', 'Správa členů', 'Přidávat novinky'] : [])
            ].map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ color: G.success, fontFamily: 'JetBrains Mono', fontSize: 11 }}>✓</span>
                <span style={{ fontSize: 13, color: G.text2 }}>{p}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="sec-title mono">CTRL EUROPE TEAM</div>
            <div style={{ fontSize: 13, color: G.text2, lineHeight: 1.6 }}>
              CEE Youth Platform zaměřená na digitální hrozby naší generace. AI, deepfakes, dezinformace — a proč nás školy nepřipravují.
            </div>
            <div style={{ marginTop: 14, fontFamily: 'JetBrains Mono', fontSize: 11, color: G.accent, letterSpacing: 1 }}>
              "Take control before someone else does."
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Admin({ profile }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddNews, setShowAddNews] = useState(false)
  const [newNews, setNewNews] = useState({ title: '', body: '', tag: 'INFO', type: 'accent' })
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMember, setNewMember] = useState({ email: '', password: '', name: '', role: '', bucket: 'PR a komunikace', layer: 'core' })
  const [msg, setMsg] = useState('')

  const BUCKETS = ['PR a komunikace', 'Sociální sítě', 'Podcast', 'Research', 'Grafika', 'Video', 'Mezinárodní', 'Eventy', 'all']

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data) setMembers(data)
      setLoading(false)
    })
  }, [])

  const addNews = async () => {
    if (!newNews.title || !newNews.body) return
    const { error } = await supabase.from('news').insert([{ ...newNews, created_by: profile.id }])
    if (!error) { setMsg('Novinka přidána!'); setNewNews({ title: '', body: '', tag: 'INFO', type: 'accent' }); setShowAddNews(false) }
    else setMsg('Chyba: ' + error.message)
  }

  const addMember = async () => {
    if (!newMember.email || !newMember.password || !newMember.name) return setMsg('Vyplň všechna pole')
    setMsg('Vytvářím účet...')
    const { data, error } = await supabase.auth.admin
      ? { error: { message: 'Admin API není dostupné z frontend — přidej uživatele přes Supabase Dashboard → Authentication → Users' } }
      : { error: null }
    setMsg('Pro přidání nového člena jdi do Supabase Dashboard → Authentication → Users → Add User. Pak vlož profil přes SQL Editor.')
  }

  if (profile.layer !== 'admin') return <div style={{ color: G.danger, fontSize: 13 }}>Přístup odepřen.</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div className="sec-title mono" style={{ marginBottom: 0 }}>SPRÁVA PROJEKTU</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setShowAddNews(v => !v)}>+ NOVINKA</button>
          <button className="btn btn-ghost" onClick={() => setShowAddMember(v => !v)}>+ ČLEN</button>
        </div>
      </div>

      {msg && <div style={{ background: G.panel, border: `1px solid ${G.accent}`, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: G.accent, fontFamily: 'JetBrains Mono' }}>{msg}</div>}

      {showAddNews && (
        <div className="form-wrap" style={{ marginBottom: 20 }}>
          <div className="sec-title mono">NOVÁ NOVINKA</div>
          <div className="form-row">
            <input className="form-input" placeholder="Nadpis..." value={newNews.title} onChange={e => setNewNews(p => ({ ...p, title: e.target.value }))} />
            <input className="form-input" placeholder="Tag (INFO, AKCE, TECH...)" value={newNews.tag} onChange={e => setNewNews(p => ({ ...p, tag: e.target.value }))} style={{ maxWidth: 160 }} />
            <select className="form-select" value={newNews.type} onChange={e => setNewNews(p => ({ ...p, type: e.target.value }))}>
              <option value="accent">Modrá</option>
              <option value="warn">Žlutá</option>
              <option value="ok">Zelená</option>
            </select>
          </div>
          <div className="form-row">
            <input className="form-input" placeholder="Text novinky..." value={newNews.body} onChange={e => setNewNews(p => ({ ...p, body: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={addNews}>PŘIDAT</button>
            <button className="btn btn-ghost" onClick={() => setShowAddNews(false)}>ZRUŠIT</button>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="form-wrap" style={{ marginBottom: 20, border: `1px solid ${G.warning}` }}>
          <div className="sec-title mono">PŘIDAT ČLENA</div>
          <div style={{ fontSize: 12, color: G.warning, fontFamily: 'JetBrains Mono', marginBottom: 12, lineHeight: 1.6 }}>
            ⚠ Pro přidání člena:<br />
            1. Jdi do Supabase → Authentication → Users → Add User<br />
            2. Zkopíruj UUID nového uživatele<br />
            3. Spusť v SQL Editoru:<br />
            <code style={{ color: G.success, display: 'block', marginTop: 8 }}>
              INSERT INTO profiles (id, name, role, bucket, layer)<br />
              VALUES ('UUID', 'Jméno', 'Role', 'Buňka', 'core');
            </code>
          </div>
          <button className="btn btn-ghost" onClick={() => setShowAddMember(false)}>ZAVŘÍT</button>
        </div>
      )}

      <div className="sec-title mono">ČLENOVÉ ({members.length})</div>
      {loading && <div style={{ color: G.text2, fontSize: 13 }}>Načítám...</div>}
      {members.map(m => (
        <div key={m.id} className="member-row">
          <div className="member-av" style={{ background: getBucketColor(m.bucket) + '33', border: `1px solid ${getBucketColor(m.bucket)}44`, color: getBucketColor(m.bucket) }}>
            {getInitials(m.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div className="member-name">{m.name}</div>
            <div className="member-role">{m.role} · {m.bucket}</div>
          </div>
          <span className={`layer-badge layer-${m.layer}`}>{m.layer}</span>
        </div>
      ))}
    </div>
  )
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [tasks, setTasks] = useState([])
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    const load = async () => {
      const [{ data: prof }, { data: taskData }, { data: newsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(10),
      ])
      if (prof) setProfile(prof)
      if (taskData) setTasks(taskData)
      if (newsData) setNews(newsData)
      setLoading(false)
    }
    load()
  }, [session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setPage('dashboard')
  }

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="loading"><div className="loading-text">CTRL EUROPE · NAČÍTÁM...</div></div>
    </>
  )

  if (!session || !profile) return (
    <>
      <style>{css}</style>
      <LoginPage onLogin={() => {}} />
    </>
  )

  const isAdmin = profile.layer === 'admin'

  const NAV = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'tasks', icon: '◻', label: 'Úkoly' },
    { id: 'docs', icon: '◈', label: 'Dokumenty' },
    { id: 'chat', icon: '◎', label: 'Chat' },
    { id: 'profile', icon: '◉', label: 'Profil' },
    ...(isAdmin ? [{ id: 'admin', icon: '⚙', label: 'Admin' }] : []),
  ]

  const pageTitle = NAV.find(n => n.id === page)?.label || ''

  return (
    <>
      <style>{css}</style>
      <div className="app-wrap">
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-text">[<span>CTRL</span>]</div>
            <div className="sidebar-logo-sub">Members Portal</div>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(profile.name)}</div>
            <div className="sidebar-name">{profile.name}</div>
            <div className="sidebar-role">{profile.role}</div>
          </div>
          <nav className="sidebar-nav">
            {NAV.map(n => (
              <div key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
                <span className="nav-icon">{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={handleLogout}>ODHLÁSIT SE</button>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <span className="topbar-title">[CTRL] · {pageTitle}</span>
            {page === 'tasks' && <span className="topbar-badge">{tasks.filter(t => !t.done).length} OTEVŘENÝCH</span>}
            {isAdmin && <span className="topbar-badge" style={{ background: G.danger, marginLeft: 'auto' }}>ADMIN</span>}
          </div>
          <div className="content">
            {page === 'dashboard' && <Dashboard profile={profile} tasks={tasks} news={news} />}
            {page === 'tasks' && <Tasks profile={profile} tasks={tasks} setTasks={setTasks} />}
            {page === 'docs' && <Docs />}
            {page === 'chat' && <Chat profile={profile} />}
            {page === 'profile' && <Profile profile={profile} />}
            {page === 'admin' && <Admin profile={profile} />}
          </div>
        </div>
      </div>
    </>
  )
}
