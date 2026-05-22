import { useState } from 'react'
import { supabase } from '../supabase'
import { Sec } from './ui/Sec'
import { cn } from '../lib/utils'
import { formatDate } from '../lib/format'
import { canAddTasks, isAdmin } from '../lib/permissions'
import { tagCls } from '../constants/styles'
import { ALL_BUCKETS } from '../constants/buckets'

export function Tasks({ profile, tasks, setTasks, activeBucket }) {
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
