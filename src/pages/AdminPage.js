import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { cn, getInitials, getLastSeenKind } from '../lib/utils'
import { formatDate, formatTime } from '../lib/format'
import { ALL_BUCKETS, bucketBarCls, bucketMemberAvCls } from '../constants/buckets'
import { ROLE_LABELS, roleBadgeCls } from '../constants/roles'
import { lastSeenCls } from '../constants/styles'
import { Sec } from '../components/ui/Sec'
import { MemberModal } from '../components/MemberModal'
import { isAdmin } from '../lib/permissions'
import {
  computeMemberWorkStats,
  computePresenceSummary,
  computeTaskSummary,
  getWarningMembers,
  sortByLoginAsc,
  sortByProductivityDesc,
} from '../lib/adminStats'
import { useAppData } from '../context/AppDataContext'

const REPORT_TYPE_LABELS = { bug: 'Chyba', idea: 'Nápad' }
const REPORT_TYPE_CLS = {
  bug: 'bg-ctrl-danger/20 text-ctrl-danger border-ctrl-danger/40',
  idea: 'bg-ctrl-warning/15 text-ctrl-warning border-ctrl-warning/40',
}

const LAYER_FILTER_ORDER = [
  'admin',
  'developer',
  'predsednictvo',
  'zastupce_predsednictva',
  'vedouci',
  'clen',
  'pozorovatel',
]

const filterInputCls =
  'bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]'

const filterSelectCls =
  'bg-ctrl-bg2 border border-ctrl-border text-ctrl-text2 py-[9px] px-3 text-xs font-sans outline-none cursor-pointer transition-colors duration-200 focus:border-ctrl-accent min-w-[140px]'

export function AdminPage() {
  const { members, profile, tasks } = useAppData()
  const fullAdmin = isAdmin(profile.layer)
  const [activeTab, setActiveTab] = useState('members')
  const [nameQuery, setNameQuery] = useState('')
  const [bucketFilter, setBucketFilter] = useState('')
  const [layerFilter, setLayerFilter] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
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

    const channel = supabase
      .channel('admin-reports-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'member_reports' }, payload => {
        const row = payload.new
        if (!row?.id) return
        setReports(prev => {
          if (prev.some(r => String(r.id) === String(row.id))) return prev
          return [row, ...prev]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeTab])

  const bucketStats = ALL_BUCKETS.map(bucket => {
    const bucketMembers = members.filter(m => m.bucket === bucket)
    const active = bucketMembers.filter(m => m.last_seen && new Date() - new Date(m.last_seen) < 86400000 * 7)
    return { bucket, total: bucketMembers.length, active: active.length }
  }).filter(s => s.total > 0)

  const maxActive = Math.max(...bucketStats.map(s => s.active), 1)

  const presenceSummary = useMemo(() => computePresenceSummary(members), [members])
  const taskSummary = useMemo(() => computeTaskSummary(tasks), [tasks])
  const memberWorkStats = useMemo(() => computeMemberWorkStats(members, tasks), [members, tasks])
  const inactiveByLogin = useMemo(() => sortByLoginAsc(memberWorkStats), [memberWorkStats])
  const topByProductivity = useMemo(() => sortByProductivityDesc(memberWorkStats), [memberWorkStats])
  const warningMembers = useMemo(() => getWarningMembers(members), [members])

  const membersFiltersActive = Boolean(nameQuery.trim() || bucketFilter || layerFilter)

  const filteredMembers = useMemo(() => {
    const q = nameQuery.trim().toLowerCase()
    return members.filter(m => {
      if (q && !m.name?.toLowerCase().includes(q)) return false
      if (bucketFilter && m.bucket !== bucketFilter && m.secondary_bucket !== bucketFilter) return false
      if (layerFilter && m.layer !== layerFilter) return false
      return true
    })
  }, [members, nameQuery, bucketFilter, layerFilter])

  const clearMembersFilters = () => {
    setNameQuery('')
    setBucketFilter('')
    setLayerFilter('')
  }

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

      <div className="flex gap-0 mb-5 border-b border-ctrl-border max-[900px]:overflow-x-auto max-[900px]:-mx-4 max-[900px]:px-4 max-[900px]:scrollbar-none">
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text shrink-0 max-[900px]:py-2 max-[900px]:px-3 max-[900px]:text-[9px] max-[900px]:tracking-[1px] whitespace-nowrap', activeTab === 'members' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('members')}>ČLENOVÉ ({members.length})</div>
        {fullAdmin && (
          <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text shrink-0 max-[900px]:py-2 max-[900px]:px-3 max-[900px]:text-[9px] max-[900px]:tracking-[1px] whitespace-nowrap', activeTab === 'stats' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('stats')}>STATISTIKY</div>
        )}
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text shrink-0 max-[900px]:py-2 max-[900px]:px-3 max-[900px]:text-[9px] max-[900px]:tracking-[1px] whitespace-nowrap', activeTab === 'reports' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('reports')}>REPORTY</div>
        {fullAdmin && (
          <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text shrink-0 max-[900px]:py-2 max-[900px]:px-3 max-[900px]:text-[9px] max-[900px]:tracking-[1px] whitespace-nowrap', activeTab === 'add' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setActiveTab('add')}>PŘIDAT ČLENA</div>
        )}
      </div>

      {activeTab === 'members' && (
        <div>
          <div className="flex flex-wrap gap-2.5 mb-3 items-end">
            <input
              type="search"
              className={cn(filterInputCls, 'flex-1 min-w-[180px]')}
              placeholder="Hledat podle jména..."
              value={nameQuery}
              onChange={e => setNameQuery(e.target.value)}
            />
            <select
              className={filterSelectCls}
              value={bucketFilter}
              onChange={e => setBucketFilter(e.target.value)}
            >
              <option value="">Všechny buňky</option>
              {ALL_BUCKETS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              className={filterSelectCls}
              value={layerFilter}
              onChange={e => setLayerFilter(e.target.value)}
            >
              <option value="">Všechny vrstvy</option>
              {LAYER_FILTER_ORDER.map(layer => (
                <option key={layer} value={layer}>{ROLE_LABELS[layer]}</option>
              ))}
            </select>
            {membersFiltersActive && (
              <button
                type="button"
                className="font-mono text-[10px] tracking-[1px] uppercase text-ctrl-text2 py-[9px] px-3 border border-ctrl-border bg-transparent cursor-pointer transition-colors duration-200 hover:text-ctrl-text hover:border-ctrl-border2 shrink-0"
                onClick={clearMembersFilters}
              >
                Zrušit filtry
              </button>
            )}
          </div>
          <div className="font-mono text-[10px] tracking-[1px] uppercase text-ctrl-text3 mb-3">
            {membersFiltersActive
              ? `${filteredMembers.length} z ${members.length} členů`
              : `${members.length} členů`}
          </div>
          {filteredMembers.length === 0 && (
            <p className="text-[13px] text-ctrl-text2 py-6 text-center">
              {membersFiltersActive ? 'Žádný člen neodpovídá filtrům.' : 'Zatím žádní členové.'}
            </p>
          )}
          {filteredMembers.map(m => (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              className="py-3 px-4 flex items-center gap-3 bg-ctrl-panel border border-ctrl-border mb-2 transition-all duration-200 hover:border-ctrl-border2 cursor-pointer max-[900px]:flex-col max-[900px]:items-stretch max-[900px]:gap-2.5 max-[900px]:py-3.5 max-[900px]:px-3.5"
              onClick={() => setSelectedMember(m)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedMember(m)
                }
              }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 max-[900px]:w-full">
                <div className={cn('w-[34px] h-[34px] flex items-center justify-center text-xs font-bold font-mono shrink-0', bucketMemberAvCls(m.bucket))}>
                  {getInitials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold leading-snug max-[900px]:text-sm">{m.name}</div>
                  <div className="font-mono text-[10px] text-ctrl-text2 mt-0.5 leading-relaxed max-[900px]:text-[11px] max-[900px]:mt-1">
                    {m.role} · {m.bucket}{m.secondary_bucket && ` + ${m.secondary_bucket}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 max-[900px]:w-full max-[900px]:justify-between max-[900px]:pt-2.5 max-[900px]:border-t max-[900px]:border-ctrl-border">
                <span className={cn('font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase max-[900px]:text-[10px] max-[900px]:px-2', roleBadgeCls(m.layer))}>
                  {ROLE_LABELS[m.layer] || m.layer}
                </span>
                <div className={cn('font-mono text-[10px] min-w-[120px] text-right max-[900px]:min-w-0 max-[900px]:text-[11px]', lastSeenCls(getLastSeenKind(m.last_seen)))}>
                  {formatTime(m.last_seen)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {fullAdmin && activeTab === 'stats' && (
        <div>
          <div className="grid grid-cols-4 gap-3 mb-3 max-[900px]:grid-cols-2 max-[900px]:gap-2">
            <div className="p-4 bg-ctrl-panel border border-ctrl-border border-b-2 border-b-ctrl-success">
              <div className="font-mono text-3xl font-bold leading-none mb-1 text-ctrl-success">{presenceSummary.online}</div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Online teď</div>
            </div>
            <div className="p-4 bg-ctrl-panel border border-ctrl-border border-b-2 border-b-ctrl-accent">
              <div className="font-mono text-3xl font-bold leading-none mb-1 text-ctrl-accent">{presenceSummary.activeWeek}</div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Přihlášení 7 dní</div>
            </div>
            <div className="p-4 bg-ctrl-panel border border-ctrl-border border-b-2 border-b-ctrl-danger">
              <div className="font-mono text-3xl font-bold leading-none mb-1 text-ctrl-danger">{presenceSummary.inactive7d}</div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Neaktivní 7+ dní</div>
            </div>
            <div className="p-4 bg-ctrl-panel border border-ctrl-border border-b-2 border-b-ctrl-warning">
              <div className="font-mono text-3xl font-bold leading-none mb-1 text-ctrl-warning">{presenceSummary.neverLoggedIn}</div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Nikdy se nepřihlásili</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3 max-[900px]:grid-cols-2 max-[900px]:gap-2">
            <div className="p-4 bg-ctrl-panel border border-ctrl-border">
              <div className="font-mono text-2xl font-bold leading-none mb-1 text-ctrl-success">{taskSummary.completed7d}</div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Splněno za 7 dní</div>
            </div>
            <div className="p-4 bg-ctrl-panel border border-ctrl-border">
              <div className="font-mono text-2xl font-bold leading-none mb-1 text-ctrl-text2">{taskSummary.completed30d}</div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Splněno za 30 dní</div>
            </div>
            <div className="p-4 bg-ctrl-panel border border-ctrl-border">
              <div className="font-mono text-2xl font-bold leading-none mb-1 text-ctrl-accent">{taskSummary.created7d}</div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Nových úkolů 7 dní</div>
            </div>
            <div className="p-4 bg-ctrl-panel border border-ctrl-border">
              <div className="font-mono text-2xl font-bold leading-none mb-1 text-ctrl-warning">{taskSummary.openTotal}</div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2">Otevřených úkolů</div>
            </div>
          </div>

          {warningMembers.length > 0 && (
            <div className="bg-ctrl-panel border border-ctrl-danger/40 p-5 mb-3">
              <Sec>VYŽADUJE POZORNOST — SLABÉ NEBO ŽÁDNÉ PŘIHLÁŠENÍ</Sec>
              <p className="text-xs text-ctrl-text2 mb-3 leading-relaxed">
                Členové, kteří se 3+ dní nepřihlásili nebo portál nikdy neotevřeli.
              </p>
              {warningMembers.map(m => (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  className="flex items-center gap-3 py-2.5 border-b border-ctrl-border last:border-b-0 cursor-pointer hover:bg-ctrl-bg2/40 transition-colors duration-200 max-[900px]:flex-wrap"
                  onClick={() => setSelectedMember(m)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedMember(m)
                    }
                  }}
                >
                  <div className={cn('w-[30px] h-[30px] flex items-center justify-center text-[11px] font-bold font-mono shrink-0', bucketMemberAvCls(m.bucket))}>
                    {getInitials(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold">{m.name}</div>
                    <div className="font-mono text-[10px] text-ctrl-text2 mt-0.5">
                      {m.bucket}{m.secondary_bucket && ` + ${m.secondary_bucket}`} · {ROLE_LABELS[m.layer] || m.layer}
                    </div>
                  </div>
                  <div className={cn('font-mono text-[10px] shrink-0', lastSeenCls(getLastSeenKind(m.last_seen)))}>
                    {formatTime(m.last_seen)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-ctrl-panel border border-ctrl-border p-5 mb-3 overflow-x-auto">
            <Sec>PŘIHLÁŠENÍ ČLENŮ — OD NEJMÉNĚ AKTIVNÍCH</Sec>
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="font-mono text-[9px] tracking-[1.5px] uppercase text-ctrl-text3 text-left border-b border-ctrl-border">
                  <th className="py-2 pr-3 font-normal">Člen</th>
                  <th className="py-2 pr-3 font-normal">Buňka</th>
                  <th className="py-2 pr-3 font-normal">Naposledy</th>
                  <th className="py-2 pr-3 font-normal text-right">Splněno 7d</th>
                  <th className="py-2 pr-3 font-normal text-right">Splněno 30d</th>
                  <th className="py-2 pr-3 font-normal text-right">Otevřené</th>
                </tr>
              </thead>
              <tbody>
                {inactiveByLogin.map(({ member: m, completed7d, completed30d, openAssigned }) => (
                  <tr
                    key={m.id}
                    className="border-b border-ctrl-border last:border-b-0 cursor-pointer hover:bg-ctrl-bg2/40 transition-colors duration-200"
                    onClick={() => setSelectedMember(m)}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="text-[13px] font-bold">{m.name}</div>
                      <div className="font-mono text-[9px] text-ctrl-text3 mt-0.5">{ROLE_LABELS[m.layer] || m.layer}</div>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-ctrl-text2">{m.bucket}</td>
                    <td className={cn('py-2.5 pr-3 font-mono text-[11px]', lastSeenCls(getLastSeenKind(m.last_seen)))}>
                      {formatTime(m.last_seen)}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-success">{completed7d}</td>
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-text2">{completed30d}</td>
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-warning">{openAssigned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-ctrl-panel border border-ctrl-border p-5 mb-3 overflow-x-auto">
            <Sec>PRODUKTIVITA — NEJVÍCE SPLNĚNÝCH ÚKOLŮ (7 DNÍ)</Sec>
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="font-mono text-[9px] tracking-[1.5px] uppercase text-ctrl-text3 text-left border-b border-ctrl-border">
                  <th className="py-2 pr-3 font-normal">Člen</th>
                  <th className="py-2 pr-3 font-normal">Buňka</th>
                  <th className="py-2 pr-3 font-normal text-right">Splněno 7d</th>
                  <th className="py-2 pr-3 font-normal text-right">Splněno 30d</th>
                  <th className="py-2 pr-3 font-normal text-right">Celkem</th>
                  <th className="py-2 pr-3 font-normal text-right">Vytvořeno 7d</th>
                  <th className="py-2 pr-3 font-normal">Naposledy</th>
                </tr>
              </thead>
              <tbody>
                {topByProductivity
                  .filter(row => row.completed7d > 0 || row.completed30d > 0 || row.created7d > 0)
                  .slice(0, 15)
                  .map(({ member: m, completed7d, completed30d, completedTotal, created7d }) => (
                    <tr
                      key={m.id}
                      className="border-b border-ctrl-border last:border-b-0 cursor-pointer hover:bg-ctrl-bg2/40 transition-colors duration-200"
                      onClick={() => setSelectedMember(m)}
                    >
                      <td className="py-2.5 pr-3">
                        <div className="text-[13px] font-bold">{m.name}</div>
                        <div className="font-mono text-[9px] text-ctrl-text3 mt-0.5">{ROLE_LABELS[m.layer] || m.layer}</div>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-ctrl-text2">{m.bucket}</td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-success font-bold">{completed7d}</td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-text2">{completed30d}</td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-text3">{completedTotal}</td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-accent">{created7d}</td>
                      <td className={cn('py-2.5 pr-3 font-mono text-[11px]', lastSeenCls(getLastSeenKind(m.last_seen)))}>
                        {formatTime(m.last_seen)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {topByProductivity.every(row => row.completed7d === 0 && row.completed30d === 0 && row.created7d === 0) && (
              <p className="text-xs text-ctrl-text2 py-3">Za posledních 30 dní nikdo nesplnil ani nevytvořil úkol.</p>
            )}
          </div>

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
              profile_id se přiřadí automaticky (6 znaků). Pokud chybí, spusť supabase/profiles-profile-id.sql.
            </div>
            <div className="text-ctrl-text2 mt-1 text-[11px]">
              Dostupné vrstvy: admin · developer · predsednictvo · zastupce_predsednictva · vedouci · clen · pozorovatel
            </div>
          </div>
        </div>
      )}

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          tasks={tasks}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}
