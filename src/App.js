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

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: ${G.bg}; color: ${G.text}; font-family: 'Syne', sans-serif; overflow-x: hidden; }
  
  /* SCANLINES */
  body::before {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9998;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,20,0.05) 2px, rgba(0,0,20,0.05) 4px);
  }

  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-thumb { background: ${G.border2}; border-radius: 2px; }

  /* ANIMATIONS */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 8px rgba(42,107,255,0.3); } 50% { box-shadow: 0 0 20px rgba(42,107,255,0.6); } }
  @keyframes glitch {
    0% { clip-path: inset(0 0 98% 0); transform: translate(-2px, 0); }
    20% { clip-path: inset(30% 0 50% 0); transform: translate(2px, 0); }
    40% { clip-path: inset(60% 0 20% 0); transform: translate(-1px, 0); }
    60% { clip-path: inset(80% 0 5% 0); transform: translate(1px, 0); }
    80% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 0); }
    100% { clip-path: inset(0 0 98% 0); transform: translate(0, 0); }
  }
  @keyframes badgePop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .slide-in { animation: slideIn 0.25s ease forwards; }

  /* LOGIN */
  .login-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(ellipse 100% 80% at 50% -10%, rgba(42,107,255,0.15) 0%, transparent 60%), ${G.bg};
    padding: 20px;
  }
  .login-box {
    width: 100%; max-width: 400px; background: ${G.panel};
    border: 1px solid ${G.border}; padding: 48px 40px; position: relative; overflow: hidden;
    animation: fadeIn 0.4s ease;
  }
  .login-box::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, ${G.accent}, transparent);
    animation: glow 2s infinite;
  }
  .login-box::after {
    content: '[CTRL]'; position: absolute; bottom: 20px; right: 20px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${G.text3};
    letter-spacing: 2px; opacity: 0.5;
  }
  .login-logo { font-family: 'JetBrains Mono', monospace; font-size: 44px; font-weight: 700; letter-spacing: -2px; margin-bottom: 4px; }
  .login-logo span { color: ${G.accent}; text-shadow: 0 0 20px rgba(42,107,255,0.5); }
  .login-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 3px; color: ${G.text2}; text-transform: uppercase; margin-bottom: 40px; }
  .login-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: ${G.text2}; margin-bottom: 8px; }
  .login-input {
    width: 100%; background: ${G.bg2}; border: 1px solid ${G.border}; color: ${G.text};
    padding: 13px 16px; font-size: 14px; font-family: 'Syne', sans-serif; outline: none;
    transition: all 0.25s; margin-bottom: 20px; display: block;
  }
  .login-input:focus { border-color: ${G.accent}; box-shadow: 0 0 0 3px rgba(42,107,255,0.1); }
  .login-btn {
    width: 100%; background: ${G.accent}; color: #fff; border: none; padding: 15px;
    font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    cursor: pointer; font-family: 'Syne', sans-serif; transition: all 0.2s; margin-top: 4px;
    position: relative; overflow: hidden;
  }
  .login-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transform: translateX(-100%); transition: transform 0.4s;
  }
  .login-btn:hover { background: ${G.accent2}; }
  .login-btn:hover::after { transform: translateX(100%); }
  .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .login-err { color: ${G.danger}; font-size: 11px; margin-top: 10px; font-family: 'JetBrains Mono', monospace; }

  /* APP LAYOUT */
  .app { display: flex; min-height: 100vh; }

  /* SIDEBAR */
  .sidebar {
    width: 230px; min-height: 100vh; background: ${G.panel}; border-right: 1px solid ${G.border};
    display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; z-index: 200;
    transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .sidebar-logo { padding: 24px 20px 16px; border-bottom: 1px solid ${G.border}; position: relative; overflow: hidden; }
  .sidebar-logo-glitch {
    font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; letter-spacing: -1px;
    position: relative; display: inline-block;
  }
  .sidebar-logo-glitch span { color: ${G.accent}; }
  .sidebar-logo-glitch::before {
    content: '[CTRL]'; position: absolute; inset: 0; color: ${G.danger}; opacity: 0;
    animation: glitch 4s infinite; clip-path: inset(0 0 98% 0);
  }
  .sidebar-logo-sub { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px; color: ${G.text2}; text-transform: uppercase; margin-top: 3px; }
  .sidebar-user { padding: 14px 20px; border-bottom: 1px solid ${G.border}; }
  .sidebar-av {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-bottom: 8px;
    transition: transform 0.2s;
  }
  .sidebar-av:hover { transform: scale(1.05); }
  .sidebar-name { font-size: 13px; font-weight: 700; }
  .sidebar-role-badge {
    display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 9px;
    padding: 2px 7px; letter-spacing: 1px; text-transform: uppercase; margin-top: 3px;
  }
  .sidebar-status { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .status-active { background: ${G.success}; box-shadow: 0 0 6px ${G.success}; }
  .status-away { background: ${G.warning}; }
  .status-help { background: ${G.danger}; animation: pulse 1s infinite; }
  .status-text { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${G.text2}; letter-spacing: 1px; cursor: pointer; }
  .status-text:hover { color: ${G.text}; }

  .sidebar-nav { flex: 1; padding: 10px 0; overflow-y: auto; }
  .nav-section { padding: 10px 20px 4px; font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 3px; color: ${G.text3}; text-transform: uppercase; }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 20px; cursor: pointer;
    color: ${G.text2}; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
    border-left: 2px solid transparent; transition: all 0.2s; position: relative;
  }
  .nav-item:hover { background: rgba(42,107,255,0.05); color: ${G.text}; transform: translateX(2px); }
  .nav-item.active { background: rgba(42,107,255,0.1); color: ${G.accent}; border-left-color: ${G.accent}; }
  .nav-icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
  .nav-badge {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: ${G.danger}; color: #fff; font-size: 9px; min-width: 16px; height: 16px;
    display: flex; align-items: center; justify-content: center; border-radius: 8px;
    font-family: 'JetBrains Mono', monospace; animation: badgePop 0.3s ease;
  }
  .nav-bucket-color { width: 6px; height: 6px; flex-shrink: 0; }

  .sidebar-bottom { padding: 14px 20px; border-top: 1px solid ${G.border}; }
  .logout-btn {
    width: 100%; background: transparent; border: 1px solid ${G.border}; color: ${G.text2};
    padding: 9px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
    font-family: 'JetBrains Mono', monospace; transition: all 0.2s;
  }
  .logout-btn:hover { border-color: ${G.danger}; color: ${G.danger}; background: rgba(255,51,102,0.05); }

  /* MAIN */
  .main { margin-left: 230px; flex: 1; min-height: 100vh; animation: fadeIn 0.3s ease; }
  .topbar {
    height: 54px; background: ${G.panel}; border-bottom: 1px solid ${G.border};
    display: flex; align-items: center; padding: 0 28px; gap: 12px;
    position: sticky; top: 0; z-index: 100; backdrop-filter: blur(8px);
  }
  .topbar-title { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: ${G.text2}; }
  .topbar-badge { font-size: 9px; padding: 2px 8px; font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
  .content { padding: 28px; animation: fadeIn 0.25s ease; }

  /* CARDS */
  .card {
    background: ${G.panel}; border: 1px solid ${G.border}; position: relative; overflow: hidden;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .card.hover:hover { border-color: ${G.accent}; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .card-top-line::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }

  /* STATS */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card { padding: 20px; background: ${G.panel}; border: 1px solid ${G.border}; position: relative; overflow: hidden; transition: all 0.25s; }
  .stat-card:hover { border-color: ${G.border2}; transform: translateY(-1px); }
  .stat-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
  .stat-val { font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
  .stat-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: ${G.text2}; }

  /* SECTION TITLE */
  .sec { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: ${G.text2}; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
  .sec::after { content: ''; flex: 1; height: 1px; background: ${G.border}; }

  /* TASKS */
  .task-item {
    padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
    background: ${G.panel}; border: 1px solid ${G.border}; transition: all 0.2s;
  }
  .task-item:hover { border-color: ${G.border2}; }
  .task-item.overdue { border-left: 3px solid ${G.danger}; }
  .task-item.due-soon { border-left: 3px solid ${G.warning}; }
  .task-check {
    width: 18px; height: 18px; border: 2px solid ${G.border2}; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  }
  .task-check:hover { border-color: ${G.accent}; }
  .task-check.done { background: ${G.success}; border-color: ${G.success}; }
  .task-check.done::after { content: '✓'; color: #000; font-size: 11px; font-weight: 700; }
  .task-name { font-size: 13px; font-weight: 600; transition: all 0.2s; }
  .task-item.is-done .task-name { text-decoration: line-through; color: ${G.text2}; }
  .task-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${G.text2}; margin-top: 2px; }
  .task-completor { font-size: 10px; color: ${G.success}; font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
  .tag { font-family: 'JetBrains Mono', monospace; font-size: 9px; padding: 3px 8px; letter-spacing: 1px; text-transform: uppercase; flex-shrink: 0; }
  .tag-podcast { background: rgba(180,79,255,0.12); color: #b44fff; }
  .tag-research { background: rgba(0,229,160,0.1); color: ${G.success}; }
  .tag-social { background: rgba(255,184,0,0.1); color: ${G.warning}; }
  .tag-event { background: rgba(255,51,102,0.1); color: ${G.danger}; }
  .tag-other { background: ${G.panel2}; color: ${G.text2}; }

  /* FORMS */
  .form-wrap { background: ${G.panel}; border: 1px solid ${G.accent}; padding: 16px; margin-bottom: 14px; animation: fadeIn 0.2s ease; }
  .form-row { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .fi {
    flex: 1; min-width: 140px; background: ${G.bg2}; border: 1px solid ${G.border}; color: ${G.text};
    padding: 9px 12px; font-size: 13px; font-family: 'Syne', sans-serif; outline: none; transition: all 0.2s;
  }
  .fi:focus { border-color: ${G.accent}; box-shadow: 0 0 0 2px rgba(42,107,255,0.1); }
  .fs { background: ${G.bg2}; border: 1px solid ${G.border}; color: ${G.text2}; padding: 9px 12px; font-size: 12px; font-family: 'Syne', sans-serif; outline: none; cursor: pointer; transition: border-color 0.2s; }
  .fs:focus { border-color: ${G.accent}; }
  .btn { border: none; padding: 9px 18px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; font-family: 'Syne', sans-serif; transition: all 0.2s; }
  .btn-p { background: ${G.accent}; color: #fff; }
  .btn-p:hover { background: ${G.accent2}; transform: translateY(-1px); }
  .btn-g { background: transparent; border: 1px solid ${G.border}; color: ${G.text2}; }
  .btn-g:hover { border-color: ${G.text2}; color: ${G.text}; }
  .btn-d { background: transparent; border: 1px solid ${G.danger}; color: ${G.danger}; }
  .btn-d:hover { background: rgba(255,51,102,0.1); }

  /* CHAT */
  .chat-wrap { display: flex; flex-direction: column; height: calc(100vh - 110px); }
  .chat-pinned { background: rgba(42,107,255,0.08); border: 1px solid rgba(42,107,255,0.2); padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px; }
  .chat-pinned-icon { color: ${G.accent}; font-size: 12px; flex-shrink: 0; margin-top: 1px; }
  .chat-pinned-text { font-size: 12px; color: ${G.text2}; flex: 1; }
  .chat-msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 12px; }
  .msg { display: flex; gap: 10px; align-items: flex-start; animation: fadeIn 0.2s ease; }
  .msg.own { flex-direction: row-reverse; }
  .msg-av {
    width: 30px; height: 30px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
    border: 1px solid ${G.border};
  }
  .msg-bubble { max-width: 68%; background: ${G.panel}; border: 1px solid ${G.border}; padding: 10px 14px; transition: border-color 0.2s; }
  .msg-bubble:hover { border-color: ${G.border2}; }
  .msg.own .msg-bubble { background: rgba(42,107,255,0.08); border-color: rgba(42,107,255,0.25); }
  .msg-author { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${G.accent}; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; display: flex; align-items: center; gap: 8px; }
  .msg.own .msg-author { flex-direction: row-reverse; }
  .msg-text { font-size: 13px; line-height: 1.5; }
  .msg-time { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${G.text3}; margin-top: 4px; }
  .msg.own .msg-time { text-align: right; }
  .pin-btn { font-size: 9px; color: ${G.text3}; cursor: pointer; opacity: 0; transition: opacity 0.2s; }
  .msg:hover .pin-btn { opacity: 1; }
  .pin-btn:hover { color: ${G.accent}; }
  .chat-input-row { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid ${G.border}; margin-top: 4px; }
  .chat-input {
    flex: 1; background: ${G.panel}; border: 1px solid ${G.border}; color: ${G.text};
    padding: 12px 16px; font-size: 13px; font-family: 'Syne', sans-serif; outline: none; transition: all 0.2s;
  }
  .chat-input:focus { border-color: ${G.accent}; }

  /* NEWS */
  .news-item { padding: 16px 20px; display: flex; gap: 12px; background: ${G.panel}; border: 1px solid ${G.border}; margin-bottom: 10px; transition: all 0.2s; animation: slideIn 0.25s ease; }
  .news-item:hover { border-color: ${G.border2}; }
  .news-dot { width: 7px; height: 7px; margin-top: 5px; flex-shrink: 0; }
  .news-title { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
  .news-body { font-size: 12px; color: ${G.text2}; line-height: 1.5; }
  .news-meta { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${G.text3}; margin-top: 5px; letter-spacing: 1px; }
  .news-delete { font-size: 11px; color: ${G.text3}; cursor: pointer; margin-left: auto; padding: 2px 6px; transition: color 0.2s; flex-shrink: 0; }
  .news-delete:hover { color: ${G.danger}; }

  /* CALENDAR */
  .event-item { padding: 12px 16px; display: flex; gap: 12px; background: ${G.panel}; border: 1px solid ${G.border}; margin-bottom: 8px; transition: all 0.2s; }
  .event-item:hover { border-color: ${G.border2}; transform: translateX(2px); }
  .event-date { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${G.accent}; min-width: 60px; }
  .event-title { font-size: 13px; font-weight: 600; }
  .event-desc { font-size: 11px; color: ${G.text2}; margin-top: 2px; }
  .event-type { font-family: 'JetBrains Mono', monospace; font-size: 9px; padding: 2px 7px; letter-spacing: 1px; text-transform: uppercase; margin-left: auto; flex-shrink: 0; }
  .type-event { background: rgba(42,107,255,0.12); color: ${G.accent}; }
  .type-deadline { background: rgba(255,51,102,0.1); color: ${G.danger}; }
  .type-meeting { background: rgba(0,229,160,0.1); color: ${G.success}; }

  /* BUCKET GRID */
  .bucket-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .bucket-card {
    padding: 20px; cursor: pointer; background: ${G.panel}; border: 1px solid ${G.border};
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden;
  }
  .bucket-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; transition: opacity 0.2s; }
  .bucket-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
  .bucket-card:hover::before { opacity: 1; }
  .bucket-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .bucket-count { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${G.text2}; }
  .bucket-members { display: flex; gap: 4px; margin-top: 10px; flex-wrap: wrap; }
  .bucket-member-av {
    width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
    border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s;
  }
  .bucket-member-av:hover { transform: scale(1.15); z-index: 1; }

  /* PROFILE */
  .profile-grid { display: grid; grid-template-columns: 260px 1fr; gap: 16px; }
  .profile-av-big {
    width: 72px; height: 72px; display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-bottom: 16px;
    transition: transform 0.2s;
  }
  .profile-av-big:hover { transform: scale(1.05); }

  /* ADMIN */
  .member-row { padding: 12px 16px; display: flex; align-items: center; gap: 12px; background: ${G.panel}; border: 1px solid ${G.border}; margin-bottom: 8px; transition: all 0.2s; }
  .member-row:hover { border-color: ${G.border2}; }
  .last-seen-good { color: ${G.success}; }
  .last-seen-ok { color: ${G.warning}; }
  .last-seen-bad { color: ${G.danger}; }
  .last-seen-never { color: ${G.text3}; }

  /* WEEKLY REPORT */
  .report-card { background: ${G.panel}; border: 1px solid ${G.border}; padding: 20px; margin-bottom: 12px; }
  .report-bucket { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid ${G.border}; }
  .report-bucket:last-child { border-bottom: none; }
  .report-bar { flex: 1; height: 4px; background: ${G.border}; position: relative; overflow: hidden; }
  .report-bar-fill { height: 100%; transition: width 0.6s ease; }

  /* STATUS PICKER */
  .status-picker { display: flex; gap: 8px; margin-top: 8px; }
  .status-opt { padding: 4px 10px; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; border: 1px solid ${G.border}; transition: all 0.2s; }
  .status-opt:hover { border-color: ${G.accent}; }
  .status-opt.selected { border-color: currentColor; }

  /* DIVIDER */
  .div { height: 1px; background: ${G.border}; margin: 20px 0; }

  /* LOADING */
  .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: ${G.bg}; gap: 16px; }
  .loading-logo { font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 700; letter-spacing: -1px; }
  .loading-logo span { color: ${G.accent}; }
  .loading-text { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 3px; color: ${G.text2}; text-transform: uppercase; animation: pulse 1.5s infinite; }

  /* MOTTO */
  .motto { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${G.accent}; letter-spacing: 2px; opacity: 0.6; margin-top: 4px; }

  /* TABS */
  .tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid ${G.border}; }
  .tab { padding: 10px 20px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; color: ${G.text2}; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; }
  .tab:hover { color: ${G.text}; }
  .tab.active { color: ${G.accent}; border-bottom-color: ${G.accent}; }

  @media (max-width: 900px) {
    .sidebar { display: none; }
    .main { margin-left: 0; padding-bottom: 70px; }
    .stats-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .bucket-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .profile-grid { grid-template-columns: 1fr; }
    .content { padding: 16px; }
    .topbar { padding: 0 16px; height: 50px; }
    .stat-val { font-size: 26px; }
    .stat-card { padding: 14px; }
    .bottom-nav { display: flex; }
    .chat-wrap { height: calc(100vh - 130px); }
  }

  .bottom-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0; height: 62px;
    background: #0f0f1a; border-top: 1px solid #1a1a30; z-index: 300;
    padding: 0 4px; align-items: center; justify-content: space-around;
    safe-area-inset-bottom: env(safe-area-inset-bottom);
  }
  @media (max-width: 900px) {
    .bottom-nav { display: flex !important; }
  }
  .bottom-nav-item {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; padding: 8px 10px; cursor: pointer; flex: 1;
    color: #7878a0; transition: all 0.15s; position: relative; border-radius: 8px;
  }
  .bottom-nav-item.active { color: #2A6BFF; background: rgba(42,107,255,0.1); }
  .bottom-nav-item:active { transform: scale(0.9); }
  .bottom-nav-icon { font-size: 20px; line-height: 1; }
  .bottom-nav-label { font-family: JetBrains Mono, monospace; font-size: 8px; letter-spacing: 1px; text-transform: uppercase; }
  .bottom-nav-badge {
    position: absolute; top: 5px; right: 8px;
    background: #ff3366; color: #fff; font-size: 8px; min-width: 14px; height: 14px;
    display: flex; align-items: center; justify-content: center; border-radius: 7px;
  }
  .bucket-drawer {
    display: none; position: fixed; inset: 0; z-index: 400;
    background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
  }
  .bucket-drawer.open { display: flex; align-items: flex-end; animation: fadeIn 0.2s ease; }
  .bucket-drawer-content {
    background: #0f0f1a; border-top: 1px solid #1a1a30;
    width: 100%; max-height: 78vh; overflow-y: auto; padding: 16px 16px 32px;
    border-radius: 16px 16px 0 0; animation: slideUp 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .drawer-handle { width: 36px; height: 4px; background: #222240; border-radius: 2px; margin: 0 auto 16px; }
  .drawer-bucket-item {
    display: flex; align-items: center; gap: 12px; padding: 14px 12px;
    cursor: pointer; border-radius: 8px; transition: background 0.15s; margin-bottom: 2px;
  }
  .drawer-bucket-item:active { background: rgba(42,107,255,0.1); }
  .drawer-bucket-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
  .drawer-bucket-name { font-size: 15px; font-weight: 600; }
  .drawer-bucket-count { font-family: JetBrains Mono, monospace; font-size: 10px; color: #7878a0; margin-left: auto; }
  .drawer-section { font-family: JetBrains Mono, monospace; font-size: 9px; letter-spacing: 3px; color: #3a3a60; text-transform: uppercase; padding: 12px 12px 4px; }
`

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
    const channel = supabase.channel(`chat-${bucket}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.bucket === bucket) {
          if (payload.new.pinned) setPinnedMsg(payload.new)
          else setMessages(prev => [...prev, payload.new])
        }
      }).subscribe()
    return () => supabase.removeChannel(channel)
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

function BucketView({ profile, bucket, tasks, setTasks, members }) {
  const [view, setView] = useState('tasks')
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
            <div key={m.id} className="bucket-member-av" style={{ background: color + '22', border: `1px solid ${color}44`, color }}>
              {getInitials(m.name)}
            </div>
          ))}
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
                  <div key={m.id} className="bucket-member-av" style={{ background: color + '20', border: `1px solid ${color}40`, color }}>
                    {getInitials(m.name)}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
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
    <>
      <style>{css}</style>
      <div className="loading">
        <div className="loading-logo">[<span>CTRL</span>]</div>
        <div className="loading-text">Načítám portál...</div>
      </div>
    </>
  )

  if (!session || !profile) return (
    <>
      <style>{css}</style>
      <LoginPage />
    </>
  )

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
    <>
      <style>{css}</style>
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
    </>
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
