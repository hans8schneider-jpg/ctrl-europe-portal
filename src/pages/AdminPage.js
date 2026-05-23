import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { cn, getInitials } from '../lib/utils'
import { formatDate, formatTime } from '../lib/format'
import { ALL_BUCKETS, bucketBarCls, bucketMemberAvCls } from '../constants/buckets'
import { ROLE_LABELS, roleBadgeCls } from '../constants/roles'
import { lastSeenCls } from '../constants/styles'
import { Sec } from '../components/ui/Sec'
import { isAdmin } from '../lib/permissions'
import { useAppData } from '../context/AppDataContext'

const REPORT_TYPE_LABELS = { bug: 'Chyba', idea: 'Nápad' }
const REPORT_TYPE_CLS = {
  bug: 'bg-ctrl-danger/20 text-ctrl-danger border-ctrl-danger/40',
  idea: 'bg-ctrl-warning/15 text-ctrl-warning border-ctrl-warning/40',
}

export function AdminPage() {
  const { members, profile } = useAppData()
  const fullAdmin = isAdmin(profile.layer)
  const [activeTab, setActiveTab] = useState('members')
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)

  useEffect(() => {
    if (activeTab !== 'reports') return
    setReportsLoading(true)
    supabase
      .from('member_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data || [])
        setReportsLoading(false)
      })
  }, [activeTab])

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
        {fullAdmin ? (
          <span className="bg-ctrl-danger text-white font-mono text-[9px] py-0.5 px-2 tracking-wide">POUZE ADMIN</span>
        ) : (
          <span className="bg-ctrl-info text-white font-mono text-[9px] py-0.5 px-2 tracking-wide">DEVELOPER</span>
        )}
      </div>

      <div className="flex gap-0 mb-5 border-b border-ctrl-border">
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', activeTab === 'members' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('members')}>ČLENOVÉ ({members.length})</div>
        {fullAdmin && (
          <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', activeTab === 'stats' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('stats')}>STATISTIKY</div>
        )}
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', activeTab === 'reports' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('reports')}>REPORTY</div>
        {fullAdmin && (
          <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', activeTab === 'add' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('add')}>PŘIDAT ČLENA</div>
        )}
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

      {fullAdmin && activeTab === 'stats' && (
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

      {activeTab === 'reports' && (
        <div>
          {reportsLoading && (
            <p className="font-mono text-[11px] text-ctrl-text2 tracking-wide">Načítám reporty...</p>
          )}
          {!reportsLoading && reports.length === 0 && (
            <p className="text-[13px] text-ctrl-text2">Zatím žádné reporty od členů.</p>
          )}
          {!reportsLoading &&
            reports.map(r => {
              const author = members.find(m => m.id === r.author_id)
              return (
                <div
                  key={r.id}
                  className="py-4 px-4 bg-ctrl-panel border border-ctrl-border mb-2 transition-all duration-200 hover:border-ctrl-border2"
                >
                  <div className="flex items-start gap-3 flex-wrap mb-2">
                    <span
                      className={cn(
                        'font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase border',
                        REPORT_TYPE_CLS[r.type] || 'border-ctrl-border text-ctrl-text2'
                      )}
                    >
                      {REPORT_TYPE_LABELS[r.type] || r.type}
                    </span>
                    {r.title && <span className="text-[13px] font-bold flex-1 min-w-0">{r.title}</span>}
                    <span className="font-mono text-[10px] text-ctrl-text2 ml-auto shrink-0">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] text-ctrl-text2 leading-relaxed whitespace-pre-wrap mb-2">
                    {r.message}
                  </p>
                  <div className="font-mono text-[10px] text-ctrl-text3 tracking-wide">
                    {author ? author.name : 'Neznámý člen'}
                    {author?.bucket && ` · ${author.bucket}`}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {fullAdmin && activeTab === 'add' && (
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
              Dostupné vrstvy: admin · developer · predsednictvo · zastupce_predsednictva · vedouci · clen · pozorovatel
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
