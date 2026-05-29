import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Sec } from './ui/Sec'
import { TaskModal } from './TaskModal'
import { cn } from '../lib/utils'
import { formatDate } from '../lib/format'
import { canAddTasks, isAdmin } from '../lib/permissions'
import {
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  assigneePayload,
  canViewerSeeTask,
  filterTasksForViewer,
  getBucketMembers,
  normalizeTaskTag,
  resolveAssigneeName,
  sortBucketMembers,
} from '../lib/tasks'
import { tagCls, priorityCls } from '../constants/styles'
import { useAppData } from '../context/AppDataContext'

const emptyTask = {
  name: '',
  description: '',
  assignee_id: '',
  due: '',
  tag: '',
  priority: 'normal',
}

function TaskRow({ task, isDoneTab, canToggle, members, onSelect, onToggle }) {
  const completor = members?.find(m => m.id === task.completed_by)
  const assigneeName = resolveAssigneeName(task, members)
  const tagLabel = normalizeTaskTag(task.tag)
  const priorityLabel = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.normal

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group py-4 px-5 flex items-start gap-3.5 mb-2.5 rounded-md border transition-all duration-200 cursor-pointer',
        'hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
        isDoneTab
          ? 'bg-ctrl-bg2/40 border-ctrl-border border-l-[3px] border-l-ctrl-success/60 hover:border-ctrl-border2'
          : 'bg-ctrl-panel border-ctrl-border border-l-[3px] border-l-ctrl-accent hover:border-ctrl-border2'
      )}
      onClick={() => onSelect(task)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(task)
        }
      }}
    >
      {canToggle && (
        <button
          type="button"
          aria-label={task.done ? 'Označit jako otevřený' : 'Označit jako splněný'}
          className={cn(
            'mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ctrl-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ctrl-panel',
            task.done
              ? 'bg-ctrl-success border-ctrl-success text-black'
              : 'border-ctrl-border2 bg-transparent group-hover:border-ctrl-accent'
          )}
          onClick={e => {
            e.stopPropagation()
            onToggle(task)
          }}
        >
          {task.done && <span className="text-[11px] font-bold leading-none">✓</span>}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-2 gap-y-1 mb-1">
          <div
            className={cn(
              'text-[14px] font-semibold leading-snug transition-colors duration-200',
              task.done ? 'line-through text-ctrl-text2' : 'text-ctrl-text group-hover:text-white'
            )}
          >
            {task.name}
          </div>
        </div>

        {task.description && (
          <p
            className={cn(
              'text-[12px] leading-relaxed line-clamp-2 mb-2',
              task.done ? 'text-ctrl-text3' : 'text-ctrl-text2'
            )}
          >
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {assigneeName && (
            <span className="font-mono text-[10px] text-ctrl-text2 tracking-wide">
              <span className="text-ctrl-text3 uppercase text-[9px] mr-1">Přiřazeno</span>
              {assigneeName}
            </span>
          )}
          {task.due && (
            <span className="font-mono text-[10px] text-ctrl-text2 tracking-wide">
              <span className="text-ctrl-text3 uppercase text-[9px] mr-1">Termín</span>
              {task.due}
            </span>
          )}
        </div>

        {task.done && task.completed_at && (
          <div className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] text-ctrl-success bg-[rgba(0,229,160,0.08)] py-1 px-2 rounded">
            <span className="font-bold">✓</span>
            <span>
              Splněno {formatDate(task.completed_at)}
              {completor?.name && ` · ${completor.name}`}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0 mt-0.5">
        {task.priority && task.priority !== 'normal' && (
          <span className={priorityCls[task.priority] || priorityCls.normal}>{priorityLabel}</span>
        )}
        {tagLabel && (
          <span className={tagCls[task.tag] || tagCls.other}>{tagLabel}</span>
        )}
      </div>
    </div>
  )
}

export function Tasks({
  profile,
  tasks,
  setTasks,
  activeBucket,
  highlightTaskId,
  onHighlightTaskConsumed,
}) {
  const { members, profile: ctxProfile, loadNotifications } = useAppData()
  const [showAdd, setShowAdd] = useState(false)
  const [activeTab, setActiveTab] = useState('open')
  const [newTask, setNewTask] = useState(emptyTask)
  const [selectedTask, setSelectedTask] = useState(null)
  const admin = isAdmin(profile.layer)

  const bucketScope = admin
    ? activeBucket && activeBucket !== 'all'
      ? activeBucket
      : null
    : activeBucket || profile.bucket

  const canAdd = canAddTasks(profile.layer, bucketScope || activeBucket)

  const visibleTasks = filterTasksForViewer(tasks, profile, {
    bucket: bucketScope,
    includeAll: !admin || Boolean(activeBucket),
  })

  const openTasks = visibleTasks.filter(t => !t.done)
  const doneTasks = visibleTasks
    .filter(t => t.done)
    .sort((a, b) => String(b.completed_at || '').localeCompare(String(a.completed_at || '')))
  const displayTasks = activeTab === 'open' ? openTasks : doneTasks
  const canToggle = profile.layer !== 'pozorovatel'
  const bucketMembers = sortBucketMembers(
    getBucketMembers(members, activeBucket),
    activeBucket
  )

  const handleTaskUpdated = (updated) => {
    setTasks(prev => prev.map(t => (t.id === updated.id ? { ...t, ...updated } : t)))
    setSelectedTask(prev => {
      if (prev?.id !== updated.id) return prev
      const merged = { ...prev, ...updated }
      return canViewerSeeTask(merged, profile) ? merged : null
    })
  }

  useEffect(() => {
    if (selectedTask && !canViewerSeeTask(selectedTask, profile)) {
      setSelectedTask(null)
    }
  }, [selectedTask, profile])

  useEffect(() => {
    if (!highlightTaskId) return
    const task = tasks.find(t => String(t.id) === String(highlightTaskId))
    if (!task || !canViewerSeeTask(task, profile)) return
    setSelectedTask(task)
    setActiveTab(task.done ? 'done' : 'open')
  }, [highlightTaskId, tasks, profile])

  const closeTaskModal = () => {
    setSelectedTask(null)
    if (highlightTaskId) onHighlightTaskConsumed?.()
  }

  const toggleTask = async (task) => {
    if (profile.layer === 'pozorovatel') return
    const updates = {
      done: !task.done,
      completed_by: !task.done ? profile.id : null,
      completed_at: !task.done ? new Date().toISOString() : null
    }
    const { error } = await supabase.from('tasks').update(updates).eq('id', task.id)
    if (!error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t))
      setSelectedTask(prev => (prev?.id === task.id ? { ...prev, ...updates } : prev))
    }
  }

  const addTask = async () => {
    if (!newTask.name.trim()) return
    const bucket_target = activeBucket || profile.bucket
    if (!bucket_target) return
    const { assignee_id, assignee, priority, tag, ...rest } = newTask
    const { data } = await supabase.from('tasks').insert([{
      ...rest,
      tag: normalizeTaskTag(tag),
      description: newTask.description.trim() || null,
      bucket_target,
      created_by: profile.id,
      priority: priority || 'normal',
      ...assigneePayload(assignee_id || null, members),
    }]).select()
    if (data) {
      const task = data[0]
      setTasks(prev => [...prev, task])
      setNewTask(emptyTask)
      setShowAdd(false)
      if (ctxProfile) {
        await loadNotifications(profile.id, ctxProfile)
      }
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <Sec className="!mb-0">
          ÚKOLY
          {activeBucket && (
            <>
              <span className="text-ctrl-text3 normal-case">·</span>
              <span className="font-sans text-sm font-bold tracking-normal normal-case text-ctrl-text">
                {activeBucket}
              </span>
            </>
          )}
        </Sec>
        {canAdd && profile.layer !== 'pozorovatel' && (
          <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={() => setShowAdd(v => !v)}>+ PŘIDAT ÚKOL</button>
        )}
      </div>

      {showAdd && canAdd && (
        <div className="bg-ctrl-panel border border-ctrl-accent p-4 mb-3.5 animate-fade-in">
          <div className="flex gap-2.5 mb-2.5 flex-wrap">
            <input className="flex-1 min-w-[140px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Název úkolu..." value={newTask.name} onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))} />
            <select
              className="flex-1 min-w-[140px] max-w-[180px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text2 py-[9px] px-3 text-xs font-sans outline-none cursor-pointer transition-colors duration-200 focus:border-ctrl-accent"
              value={newTask.assignee_id}
              onChange={e => setNewTask(p => ({ ...p, assignee_id: e.target.value }))}
            >
              <option value="">Přiřadit člena…</option>
              {bucketMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.layer === 'vedouci' && m.bucket === activeBucket ? ' · vedoucí' : ''}
                </option>
              ))}
            </select>
            <input className="flex-1 min-w-[140px] max-w-[120px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" placeholder="Termín..." value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))} />
          </div>
          <textarea
            className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)] min-h-[80px] resize-y mb-2.5"
            placeholder="Popis úkolu..."
            value={newTask.description}
            onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
            rows={3}
          />
          <div className="flex gap-2.5 mb-2.5 flex-wrap">
            <input
              className="flex-1 min-w-[120px] max-w-[200px] bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]"
              placeholder="Štítek (volitelné)…"
              value={newTask.tag}
              onChange={e => setNewTask(p => ({ ...p, tag: e.target.value }))}
            />
            <select className="bg-ctrl-bg2 border border-ctrl-border text-ctrl-text2 py-[9px] px-3 text-xs font-sans outline-none cursor-pointer transition-colors duration-200 focus:border-ctrl-accent" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
            <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={addTask}>PŘIDAT</button>
            <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text" onClick={() => setShowAdd(false)}>ZRUŠIT</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-5 p-1 bg-ctrl-bg2/50 border border-ctrl-border rounded-md w-fit max-w-full">
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 py-2 px-4 font-mono text-[10px] tracking-[2px] uppercase rounded transition-all duration-200',
            activeTab === 'open'
              ? 'bg-[rgba(42,107,255,0.15)] text-ctrl-accent shadow-sm'
              : 'text-ctrl-text2 hover:text-ctrl-text'
          )}
          onClick={() => setActiveTab('open')}
        >
          Otevřené
          <span
            className={cn(
              'tabular-nums py-0.5 px-1.5 text-[9px] rounded',
              activeTab === 'open' ? 'bg-ctrl-accent/20 text-ctrl-accent' : 'bg-ctrl-panel text-ctrl-text3'
            )}
          >
            {openTasks.length}
          </span>
        </button>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 py-2 px-4 font-mono text-[10px] tracking-[2px] uppercase rounded transition-all duration-200',
            activeTab === 'done'
              ? 'bg-[rgba(0,229,160,0.12)] text-ctrl-success shadow-sm'
              : 'text-ctrl-text2 hover:text-ctrl-text'
          )}
          onClick={() => setActiveTab('done')}
        >
          Splněné
          <span
            className={cn(
              'tabular-nums py-0.5 px-1.5 text-[9px] rounded',
              activeTab === 'done' ? 'bg-ctrl-success/20 text-ctrl-success' : 'bg-ctrl-panel text-ctrl-text3'
            )}
          >
            {doneTasks.length}
          </span>
        </button>
      </div>

      {displayTasks.map(t => (
        <TaskRow
          key={t.id}
          task={t}
          isDoneTab={activeTab === 'done'}
          canToggle={canToggle}
          members={members}
          onSelect={setSelectedTask}
          onToggle={toggleTask}
        />
      ))}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={members}
          profile={profile}
          activeBucket={activeBucket}
          onClose={closeTaskModal}
          onToggle={toggleTask}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
      {displayTasks.length === 0 && (
        <div
          className={cn(
            'py-10 px-6 text-center rounded-md border border-dashed',
            activeTab === 'open'
              ? 'border-ctrl-accent/30 bg-[rgba(42,107,255,0.04)]'
              : 'border-ctrl-success/25 bg-[rgba(0,229,160,0.04)]'
          )}
        >
          <div
            className={cn(
              'font-mono text-[10px] tracking-[2px] uppercase mb-2',
              activeTab === 'open' ? 'text-ctrl-accent' : 'text-ctrl-success'
            )}
          >
            {activeTab === 'open' ? 'Vše hotovo' : 'Zatím prázdné'}
          </div>
          <p className="text-[13px] text-ctrl-text2">
            {activeTab === 'open'
              ? 'Žádné otevřené úkoly v této buňce.'
              : 'Žádná historie splněných úkolů.'}
          </p>
        </div>
      )}
    </div>
  )
}
