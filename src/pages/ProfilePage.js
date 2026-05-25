import { useState } from 'react'
import { supabase } from '../supabase'
import { cn, getInitials } from '../lib/utils'
import { bucketAvCls } from '../constants/buckets'
import { ROLE_LABELS, roleBadgeCls } from '../constants/roles'
import { STATUS_OPT_CLS } from '../constants/styles'
import { STATUS_CONFIG } from '../constants/status'
import { canAccessAdminPanel, canAddTasks, canManageNews, isAdmin } from '../lib/permissions'
import { Sec } from '../components/ui/Sec'
import { PasswordChange } from '../components/PasswordChange'
import { useAppData } from '../context/AppDataContext'

export function ProfilePage() {
  const { profile, setProfile, patchMember } = useAppData()
  const [status, setStatus] = useState(profile.status || 'active')

  const updateStatus = async (newStatus) => {
    setStatus(newStatus)
    setProfile(prev => (prev ? { ...prev, status: newStatus } : prev))
    patchMember(profile.id, { status: newStatus })
    await supabase.from('profiles').update({ status: newStatus }).eq('id', profile.id)
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
              <span className="text-[13px]">{STATUS_CONFIG[status].label}</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-2 max-[900px]:flex-row max-[900px]:flex-wrap max-[900px]:items-start max-[900px]:gap-1.5 max-[900px]:mt-1.5">
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <div key={key} className={cn('w-full box-border py-1.5 px-2.5 font-mono text-[9px] tracking-wide uppercase cursor-pointer border transition-all duration-200 hover:border-ctrl-accent text-center max-[900px]:w-auto max-[900px]:py-1 max-[900px]:px-2 max-[900px]:text-left', status === key ? STATUS_OPT_CLS[key] : 'border-ctrl-border text-ctrl-text2')}
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
              'Dashboard',
              canManageNews(profile.layer) && 'Správa oznámení',
              profile.layer !== 'pozorovatel' && 'Chat v buňce',
              profile.layer !== 'pozorovatel' && 'Označování úkolů',
              canAddTasks(profile.layer) && 'Přidávání úkolů',
              isAdmin(profile.layer) && 'Admin panel',
              canAccessAdminPanel(profile.layer) && !isAdmin(profile.layer) && 'Admin panel — reporty a členové',
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
              <div key={doc.name} className="flex items-center gap-3 py-3 border-b border-ctrl-border cursor-default">
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
