import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabase'
import { cn } from '../lib/utils'
import { formatDate } from '../lib/format'
import { tagCls, priorityCls } from '../constants/styles'
import {
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  assigneePayload,
  canManageTasks,
  getBucketMembers,
  normalizeTaskTag,
  resolveAssigneeName,
  sortBucketMembers,
} from '../lib/tasks'

function DetailRow({ label, children }) {
  if (children == null || children === '') return null
  return (
    <div>
      <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase">{label}</div>
      <div className="text-[13px] font-medium mt-0.5 text-ctrl-text leading-relaxed">{children}</div>
    </div>
  )
}

const fieldSelectCls =
  'w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-2 px-2.5 text-[13px] font-sans rounded outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)] cursor-pointer'

export function TaskModal({
  task,
  members,
  profile,
  activeBucket,
  onClose,
  onToggle,
  onTaskUpdated,
}) {
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const [commentError, setCommentError] = useState(null)

  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [metaSaving, setMetaSaving] = useState(false)
  const [metaError, setMetaError] = useState(null)

  const canManage = canManageTasks(profile?.layer, task?.bucket_target || activeBucket)
  const canComment = profile?.layer !== 'pozorovatel'
  const canToggle = canComment

  const bucketMembers = sortBucketMembers(
    getBucketMembers(members, task?.bucket_target || activeBucket),
    task?.bucket_target || activeBucket
  )

  const loadComments = useCallback(async () => {
    if (!task?.id) return
    setCommentsLoading(true)
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
    if (!error && data) setComments(data)
    setCommentsLoading(false)
  }, [task?.id])

  useEffect(() => {
    if (!task) return
    setAssigneeId(task.assignee_id ? String(task.assignee_id) : '')
    setPriority(task.priority || 'normal')
    setCommentDraft('')
    setMetaError(null)
    setCommentError(null)
    loadComments()
  }, [task, loadComments])

  useEffect(() => {
    if (!task?.id) return
    const taskId = task.id
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        payload => {
          const row = payload.new
          if (!row?.id) return
          setComments(prev => {
            if (prev.some(c => String(c.id) === String(row.id))) return prev
            return [...prev, row]
          })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [task?.id])

  if (!task) return null

  const creator = members?.find(m => m.id === task.created_by)
  const completor = members?.find(m => m.id === task.completed_by)
  const assigneeName = resolveAssigneeName(task, members)
  const tagLabel = normalizeTaskTag(task.tag)
  const priorityLabel = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.normal

  const createdLabel = task.created_at
    ? new Date(task.created_at).toLocaleString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const saveMetadata = async () => {
    if (!canManage) return
    setMetaSaving(true)
    setMetaError(null)
    const payload = {
      priority,
      ...assigneePayload(assigneeId || null, members),
    }
    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', task.id)
      .select()
      .single()
    setMetaSaving(false)
    if (error) {
      setMetaError(
        error.message?.includes('assignee_id') || error.message?.includes('priority')
          ? 'Chybí sloupce v databázi — spusť supabase/tasks-detail.sql.'
          : error.message || 'Uložení se nepovedlo.'
      )
      return
    }
    if (data) onTaskUpdated?.(data)
  }

  const addComment = async () => {
    const body = commentDraft.trim()
    if (!body || !canComment) return
    setCommentSaving(true)
    setCommentError(null)
    const { data, error } = await supabase
      .from('task_comments')
      .insert([{ task_id: task.id, author_id: profile.id, body }])
      .select()
      .single()
    setCommentSaving(false)
    if (error) {
      setCommentError(
        error.message?.includes('task_comments')
          ? 'Chybí tabulka komentářů — spusť supabase/tasks-detail.sql.'
          : error.message || 'Komentář se nepodařilo uložit.'
      )
      return
    }
    if (data) {
      setComments(prev => [...prev, data])
      setCommentDraft('')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-[rgba(0,0,0,0.75)] backdrop-blur-sm max-[900px]:bottom-[70px]"
      onClick={onClose}
    >
      <div
        className="bg-ctrl-panel border border-ctrl-border rounded-lg w-full max-w-[520px] max-h-[85vh] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-5 border-b border-ctrl-border bg-gradient-to-b from-ctrl-panel2/40 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded bg-transparent border border-ctrl-border text-ctrl-text2 text-lg leading-none cursor-pointer transition-colors hover:border-ctrl-text2 hover:text-ctrl-text"
            aria-label="Zavřít"
          >
            ×
          </button>

          <div className="pr-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={cn(
                  'font-mono text-[9px] py-1 px-2.5 tracking-[1.5px] uppercase',
                  task.done
                    ? 'bg-[rgba(0,229,160,0.12)] text-ctrl-success'
                    : 'bg-[rgba(42,107,255,0.12)] text-ctrl-accent'
                )}
              >
                {task.done ? 'Splněno' : 'Otevřený'}
              </span>
              {task.priority && task.priority !== 'normal' && (
                <span className={priorityCls[task.priority] || priorityCls.normal}>
                  {priorityLabel}
                </span>
              )}
              {tagLabel && (
                <span className={tagCls[task.tag] || tagCls.other}>{tagLabel}</span>
              )}
            </div>
            <h2
              className={cn(
                'font-sans text-xl font-bold leading-snug tracking-normal text-ctrl-text',
                task.done && 'line-through text-ctrl-text2'
              )}
            >
              {task.name}
            </h2>
            {task.bucket_target && task.bucket_target !== 'all' && (
              <p className="mt-2 text-[13px] text-ctrl-text2">{task.bucket_target}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          {task.description ? (
            <div className="mb-5">
              <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase mb-2">
                Popis
              </div>
              <p className="text-[14px] text-ctrl-text leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-ctrl-text3 italic mb-5">Bez popisu</p>
          )}

          <div className="py-4 px-4 bg-ctrl-bg2/60 border border-ctrl-border rounded-md flex flex-col gap-3.5 mb-5">
            {canManage ? (
              <>
                <div>
                  <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase mb-1.5">
                    Přiřazeno
                  </div>
                  <select
                    className={fieldSelectCls}
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                  >
                    <option value="">Nepřiřazeno</option>
                    {bucketMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.layer === 'vedouci' && m.bucket === (task.bucket_target || activeBucket)
                          ? ' · vedoucí'
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase mb-1.5">
                    Priorita
                  </div>
                  <select
                    className={fieldSelectCls}
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
                {metaError && (
                  <p className="text-[12px] text-ctrl-danger">{metaError}</p>
                )}
                <button
                  type="button"
                  disabled={metaSaving}
                  className="self-start border-0 py-2 px-4 text-[10px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 disabled:opacity-50"
                  onClick={saveMetadata}
                >
                  {metaSaving ? 'UKLÁDÁM…' : 'ULOŽIT PŘIŘAZENÍ'}
                </button>
              </>
            ) : (
              <>
                <DetailRow label="Přiřazeno">{assigneeName || '—'}</DetailRow>
                <DetailRow label="Priorita">{priorityLabel}</DetailRow>
              </>
            )}
            <DetailRow label="Termín">{task.due || '—'}</DetailRow>
            <div className="h-px bg-ctrl-border" />
            <DetailRow label="Vytvořeno">{createdLabel || '—'}</DetailRow>
            <DetailRow label="Vytvořil">{creator?.name || '—'}</DetailRow>
            {task.done && task.completed_at && (
              <>
                <div className="h-px bg-ctrl-border" />
                <DetailRow label="Splněno">
                  {formatDate(task.completed_at)}
                  {completor?.name && ` · ${completor.name}`}
                </DetailRow>
              </>
            )}
          </div>

          <div>
            <div className="font-mono text-[9px] text-ctrl-text2 tracking-[2px] uppercase mb-3">
              Interní komentáře
              {comments.length > 0 && (
                <span className="text-ctrl-text3 ml-2 tabular-nums">{comments.length}</span>
              )}
            </div>

            {commentsLoading ? (
              <p className="text-[12px] text-ctrl-text3 italic">Načítám…</p>
            ) : comments.length === 0 ? (
              <p className="text-[12px] text-ctrl-text3 italic mb-3">Zatím žádné komentáře.</p>
            ) : (
              <ul className="flex flex-col gap-2.5 mb-4 max-h-[200px] overflow-y-auto pr-1">
                {comments.map(c => {
                  const author = members?.find(m => String(m.id) === String(c.author_id))
                  const time = c.created_at
                    ? new Date(c.created_at).toLocaleString('cs-CZ', {
                        day: 'numeric',
                        month: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''
                  return (
                    <li
                      key={c.id}
                      className="py-2.5 px-3 bg-ctrl-bg2/50 border border-ctrl-border rounded"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-ctrl-text">
                          {author?.name || 'Člen'}
                        </span>
                        <span className="font-mono text-[9px] text-ctrl-text3 shrink-0">
                          {time}
                        </span>
                      </div>
                      <p className="text-[13px] text-ctrl-text2 leading-relaxed whitespace-pre-wrap">
                        {c.body}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}

            {canComment && (
              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-2 px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)] min-h-[72px] resize-y rounded"
                  placeholder="Napiš interní komentář…"
                  value={commentDraft}
                  onChange={e => setCommentDraft(e.target.value)}
                  rows={3}
                />
                {commentError && (
                  <p className="text-[12px] text-ctrl-danger">{commentError}</p>
                )}
                <button
                  type="button"
                  disabled={commentSaving || !commentDraft.trim()}
                  className="self-start border-0 py-2 px-4 text-[10px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text disabled:opacity-40"
                  onClick={addComment}
                >
                  {commentSaving ? 'ODESÍLÁM…' : 'PŘIDAT KOMENTÁŘ'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-ctrl-border bg-ctrl-bg2/30 flex gap-2.5 justify-end">
          {canToggle && (
            <button
              type="button"
              className={cn(
                'border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200',
                task.done
                  ? 'bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text'
                  : 'bg-ctrl-success text-black hover:opacity-90'
              )}
              onClick={() => onToggle?.(task)}
            >
              {task.done ? 'OZNAČIT JAKO OTEVŘENÝ' : 'OZNAČIT JAKO SPLNĚNÝ'}
            </button>
          )}
          <button
            type="button"
            className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text"
            onClick={onClose}
          >
            ZAVŘÍT
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
