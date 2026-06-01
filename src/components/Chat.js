import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

import { supabase } from '../supabase'

import { Sec } from './ui/Sec'
import { ChatUserAvatar } from './ChatUserAvatar'
import { ChatMessageAttachments } from './ChatMessageAttachments'
import { MemberModal } from './MemberModal'

import { cn, getInitials, isUserOnline } from '../lib/utils'
import { useAppData } from '../context/AppDataContext'

import { formatMessageTimestamp, parseTimestampCandidates } from '../lib/format'

import { isAdmin } from '../lib/permissions'
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  removeChatAttachments,
  uploadChatAttachments,
  validateChatAttachment,
} from '../lib/chatAttachments'
import { createNotification, buildMentionNotification } from '../lib/notifications'

const MESSAGE_EDIT_WINDOW_MS = 10 * 60 * 1000

function canEditMessage(msg) {
  const candidates = parseTimestampCandidates(msg?.created_at)
  if (!candidates.length) return false
  const now = Date.now()
  return candidates.some(t => {
    const elapsed = now - t
    return elapsed >= 0 && elapsed < MESSAGE_EDIT_WINDOW_MS
  })
}

function currentUserMentionKey(name) {
  return name.replace(/\s/g, '').toLowerCase()
}

function messageMentionsUser(text, profileName) {
  if (!text || !profileName) return false
  const me = currentUserMentionKey(profileName)
  return text.split(/(@\S+)/g).some(part => {
    if (!/^@\S+$/.test(part)) return false
    const key = part.slice(1).toLowerCase()
    return key === 'všichni' || key === me
  })
}

function renderMentionText(text, memberNameSet, profileName, memberByMentionKey, onMemberClick) {
  if (!text) return null
  const me = profileName ? currentUserMentionKey(profileName) : null
  const parts = text.split(/(@\S+)/g)
  return parts.map((part, i) => {
    if (/^@\S+$/.test(part)) {
      const key = part.slice(1).toLowerCase()
      if (key === 'všichni' || memberNameSet.has(key)) {
        const mentionsMe = me && (key === 'všichni' || key === me)
        const mentionCls = cn(
          'font-semibold',
          mentionsMe
            ? 'text-ctrl-warning bg-[rgba(255,184,0,0.22)] px-0.5 rounded-sm'
            : 'text-ctrl-accent'
        )
        const member = key !== 'všichni' ? memberByMentionKey.get(key) : null
        if (member && onMemberClick) {
          return (
            <button
              key={i}
              type="button"
              className={cn(
                mentionCls,
                'inline cursor-pointer hover:underline border-0 bg-transparent p-0 font-sans text-[13px] leading-normal align-baseline'
              )}
              onClick={() => onMemberClick(member)}
            >
              {part}
            </button>
          )
        }
        return (
          <span key={i} className={mentionCls}>
            {part}
          </span>
        )
      }
    }
    return part
  })
}

export function Chat({ profile, activeBucket }) {
  const { members, tasks } = useAppData()
  const [selectedMember, setSelectedMember] = useState(null)

  const [messages, setMessages] = useState([])
  const [presenceByUserId, setPresenceByUserId] = useState({})
  const [presenceTick, setPresenceTick] = useState(0)

  const [input, setInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const [loading, setLoading] = useState(true)

  const [pinnedMsg, setPinnedMsg] = useState(null)

  const [openMenuId, setOpenMenuId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  const [mentionSearch, setMentionSearch] = useState(null)
  const [pendingMentions, setPendingMentions] = useState([])

  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)

  const bucket = activeBucket || profile.bucket

  const canWrite = profile.layer !== 'pozorovatel'

  const memberNameSet = useMemo(
    () => new Set(members.map(m => m.name.replace(/\s/g, '').toLowerCase())),
    [members]
  )

  const memberByMentionKey = useMemo(() => {
    const map = new Map()
    for (const m of members) {
      map.set(m.name.replace(/\s/g, '').toLowerCase(), m)
    }
    return map
  }, [members])

  const mentionCandidates = useMemo(() => {
    if (mentionSearch === null) return []
    const q = mentionSearch.toLowerCase()
    const vsichni = { id: '__vsichni__', name: 'všichni' }
    const matched = members
      .filter(m => String(m.id) !== String(profile.id))
      .filter(m => !q || m.name.toLowerCase().includes(q) || m.name.replace(/\s/g, '').toLowerCase().includes(q))
      .map(m => ({ id: m.id, name: m.name }))
    const showVsichni = !q || 'všichni'.startsWith(q)
    return [...(showVsichni ? [vsichni] : []), ...matched].slice(0, 8)
  }, [mentionSearch, members, profile.id])



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

      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `bucket=eq.${bucket}` }, payload => {
        const updated = payload.new
        if (!updated?.id) return
        if (updated.pinned) {
          setPinnedMsg(updated)
          setMessages(prev => prev.filter(m => m.id !== updated.id))
        } else {
          setMessages(prev => prev.map(m => (m.id === updated.id ? { ...m, ...updated } : m)))
        }
      })

      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `bucket=eq.${bucket}` }, payload => {

        setMessages(prev => prev.filter(m => m.id !== payload.old.id))

        setPinnedMsg(prev => (prev?.id === payload.old.id ? null : prev))

      })

      .subscribe()

    return () => { supabase.removeChannel(channel) }

  }, [loadMessages, bucket])

  useEffect(() => {
    const map = {}
    members.forEach(m => {
      map[String(m.id)] = { status: m.status || 'active', last_seen: m.last_seen }
    })
    setPresenceByUserId(map)
  }, [members])

  useEffect(() => {
    const tick = setInterval(() => setPresenceTick(t => t + 1), 60000)
    return () => clearInterval(tick)
  }, [])

  const openMemberProfile = (authorId) => {
    const member = members.find(m => String(m.id) === String(authorId))
    if (member) setSelectedMember(member)
  }

  const openMemberFromMention = (member) => {
    if (member) setSelectedMember(member)
  }

  const getAuthorPresence = (authorId) => {
    const id = String(authorId)
    const fromMembers = presenceByUserId[id]
    if (id === String(profile.id)) {
      return {
        status: fromMembers?.status ?? profile.status ?? 'active',
        last_seen: fromMembers?.last_seen ?? profile.last_seen,
        isOnline: true,
      }
    }
    return {
      status: fromMembers?.status ?? 'active',
      last_seen: fromMembers?.last_seen,
      isOnline: isUserOnline(fromMembers?.last_seen),
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])



  useEffect(() => {
    if (openMenuId == null) return
    const close = (e) => {
      if (e.target.closest('[data-chat-message-actions]')) return
      setOpenMenuId(null)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenuId])



  const addPendingFiles = (fileList) => {
    if (!fileList?.length) return
    setUploadError(null)
    const next = [...pendingFiles]
    for (const file of fileList) {
      if (next.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
        setUploadError(`Max ${MAX_ATTACHMENTS_PER_MESSAGE} souborů na zprávu.`)
        break
      }
      const err = validateChatAttachment(file)
      if (err) {
        setUploadError(err)
        continue
      }
      next.push(file)
    }
    setPendingFiles(next)
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setInput(val)
    setPendingMentions(prev => prev.filter(m => {
      const tag = '@' + m.name.replace(/\s/g, '')
      return val.includes(tag)
    }))
    const caret = e.target.selectionStart ?? val.length
    const before = val.slice(0, caret)
    const atMatch = before.match(/@(\S*)$/)
    setMentionSearch(atMatch ? atMatch[1] : null)
  }

  const selectMention = (candidate) => {
    const tag = '@' + candidate.name.replace(/\s/g, '')
    const el = inputRef.current
    const caret = el?.selectionStart ?? input.length
    const newBefore = input.slice(0, caret).replace(/@(\S*)$/, tag + ' ')
    const newVal = newBefore + input.slice(caret)
    setInput(newVal)
    setMentionSearch(null)
    if (!pendingMentions.some(m => m.id === candidate.id)) {
      setPendingMentions(prev => [...prev, candidate])
    }
    setTimeout(() => {
      if (el) {
        el.focus()
        el.setSelectionRange(newBefore.length, newBefore.length)
      }
    }, 0)
  }

  const sendMessage = async () => {
    if (!canWrite || uploading) return
    const text = input.trim()
    if (!text && !pendingFiles.length) return

    setUploading(true)
    setUploadError(null)
    let attachments = []
    const mentionsSnapshot = [...pendingMentions]
    try {
      if (pendingFiles.length) {
        attachments = await uploadChatAttachments(supabase, bucket, profile.id, pendingFiles)
      }
      const { error } = await supabase.from('messages').insert([{
        text: text || null,
        attachments,
        author_id: profile.id,
        author_name: profile.name,
        author_initials: getInitials(profile.name),
        bucket,
        pinned: false,
      }])
      if (error) throw error
      setInput('')
      setPendingFiles([])
      setPendingMentions([])

      await Promise.allSettled(
        mentionsSnapshot.map(m =>
          createNotification({
            ...buildMentionNotification({
              authorName: profile.name,
              bucket,
              messageText: text || null,
              targetUserId: m.id === '__vsichni__' ? null : String(m.id),
            }),
            created_by: profile.id,
          })
        )
      )
    } catch (e) {
      if (attachments.length) await removeChatAttachments(supabase, attachments)
      setUploadError(e?.message || 'Nahrání se nezdařilo.')
    } finally {
      setUploading(false)
    }
  }



  const pinMessage = async (msg) => {

    if (!isAdmin(profile.layer)) return

    await supabase.from('messages').update({ pinned: true, pinned_by: profile.id }).eq('id', msg.id)

    setPinnedMsg(msg)

    setMessages(prev => prev.filter(m => m.id !== msg.id))

  }



  const deleteMessage = async (msg) => {
    await removeChatAttachments(supabase, msg.attachments)
    const { error } = await supabase.from('messages').delete().eq('id', msg.id).eq('author_id', profile.id)
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== msg.id))
      setOpenMenuId(null)
    }
  }

  const startEdit = (msg) => {
    if (!canEditMessage(msg)) return
    setEditError(null)
    setEditingId(msg.id)
    setEditText(msg.text || '')
    setOpenMenuId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
    setEditError(null)
  }

  const saveEdit = async (msg) => {
    if (!canEditMessage(msg) || editSaving) return
    const text = editText.trim()
    const hasAttachments = (msg.attachments?.length ?? 0) > 0
    if (!text && !hasAttachments) return

    setEditSaving(true)
    setEditError(null)
    const updatedAt = new Date().toISOString()
    const { data, error } = await supabase
      .from('messages')
      .update({ text: text || null, updated_at: updatedAt })
      .eq('id', msg.id)
      .eq('author_id', profile.id)
      .select('id, text, updated_at')
      .maybeSingle()
    setEditSaving(false)

    if (error || !data) {
      setEditError(
        error?.message?.includes('policy')
          ? 'Úpravu zablokovalo oprávnění v databázi — spusť supabase/messages-edit-rls.sql.'
          : 'Úpravu se nepodařilo uložit.'
      )
      return
    }

    setMessages(prev => prev.map(m => (
      m.id === msg.id ? { ...m, text: data.text, updated_at: data.updated_at } : m
    )))
    cancelEdit()
  }

  if (loading) return <div className="text-ctrl-text2 text-[13px]">Načítám zprávy...</div>



  return (

    <div className="flex flex-col h-[calc(100vh-110px)] max-[900px]:h-[calc(100vh-130px)] animate-fade-in">

      <Sec>CHAT · {bucket.toUpperCase()}</Sec>

      {pinnedMsg && (

        <div className="border border-[rgba(42,107,255,0.2)] py-2.5 px-3.5 mb-3 flex items-start gap-2.5 bg-[rgba(42,107,255,0.08)]">

          <div className="text-ctrl-accent text-xs shrink-0 mt-px">📌</div>

          <div className="text-xs text-ctrl-text2 flex-1">
            <strong>{pinnedMsg.author_name}:</strong> {pinnedMsg.text}
            <ChatMessageAttachments attachments={pinnedMsg.attachments} />
          </div>

        </div>

      )}

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-3">

        {messages.map((m, idx) => {
          void presenceTick

          const isOwn = String(m.author_id).toLowerCase() === String(profile.id).toLowerCase()
          const mentionedMe = !isOwn && messageMentionsUser(m.text, profile.name)
          const editable = isOwn && canEditMessage(m)
          const { status, isOnline } = getAuthorPresence(m.author_id)
          const dropdownOpensDown = idx < 3

          return (

            <div

              key={m.id}

              className={cn(

                'flex gap-2.5 items-end animate-fade-in group w-full',

                isOwn ? 'justify-end' : 'justify-start'

              )}

            >

              {!isOwn && (
                <ChatUserAvatar
                  initials={m.author_initials}
                  status={status}
                  isOnline={isOnline}
                  onClick={() => openMemberProfile(m.author_id)}
                />
              )}

              <div

                className={cn(

                  'relative max-w-[85%] py-2.5 px-3.5 transition-colors duration-200',

                  isOwn
                    ? 'bg-[rgba(42,107,255,0.18)] border border-[rgba(42,107,255,0.4)] hover:border-ctrl-accent'
                    : mentionedMe
                      ? 'bg-[rgba(255,184,0,0.12)] border border-[rgba(255,184,0,0.45)] hover:border-ctrl-warning'
                      : 'bg-ctrl-panel border border-ctrl-border hover:border-ctrl-border2'

                )}

              >

                {isOwn && editingId !== m.id && (

                  <div
                    className="absolute top-1 right-1"
                    data-chat-message-actions
                    onMouseDown={e => e.stopPropagation()}
                  >

                    <button

                      type="button"

                      className={cn(

                        'w-5 h-5 flex items-center justify-center text-[15px] leading-none cursor-pointer rounded-sm transition-all duration-200',

                        openMenuId === m.id

                          ? 'text-white bg-white/20'

                          : 'text-white hover:text-white hover:bg-white/15 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]'

                      )}

                      aria-label="Akce se zprávou"

                      onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}

                    >

                      ⋮

                    </button>

                    {openMenuId === m.id && (

                      <div className={cn("absolute right-0 z-20 min-w-[120px] bg-ctrl-panel2 border border-ctrl-border shadow-[0_8px_24px_rgba(0,0,0,0.5)]", dropdownOpensDown ? "top-full mt-0.5" : "bottom-full mb-0.5")}>

                        <button
                          type="button"
                          className={cn(
                            'w-full text-left py-2 px-3 text-[11px] font-mono transition-colors duration-200',
                            editable
                              ? 'text-ctrl-text hover:bg-ctrl-panel'
                              : 'text-ctrl-text3 cursor-not-allowed opacity-50'
                          )}
                          title={editable ? undefined : 'Úpravu lze provést do 10 minut od odeslání'}
                          disabled={!editable}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={() => startEdit(m)}
                        >
                          Upravit
                        </button>

                        <button

                          type="button"

                          className="w-full text-left py-2 px-3 text-[11px] font-mono text-ctrl-danger hover:bg-[rgba(255,51,102,0.1)] transition-colors duration-200"

                          onMouseDown={e => e.stopPropagation()}
                          onClick={() => deleteMessage(m)}

                        >

                          Smazat

                        </button>

                      </div>

                    )}

                  </div>

                )}

                {!isOwn && (

                  <div className="font-mono text-[9px] tracking-wide uppercase mb-0.5 flex items-center gap-1.5 text-ctrl-text2">

                    {m.author_name}

                    {isAdmin(profile.layer) && (

                      <span className="text-[9px] text-ctrl-text3 cursor-pointer opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:text-ctrl-accent" onClick={() => pinMessage(m)}>📌 připnout</span>

                    )}

                  </div>

                )}

                {editingId === m.id ? (
                  <div className="pr-5" onClick={e => e.stopPropagation()}>
                    {editError && (
                      <div className="text-ctrl-danger text-[10px] font-mono mb-2">{editError}</div>
                    )}
                    <textarea
                      className="w-full min-h-[60px] bg-ctrl-panel border border-ctrl-border text-ctrl-text py-2 px-2.5 text-[13px] font-sans outline-none resize-y focus:border-ctrl-accent"
                      value={editText}
                      disabled={editSaving}
                      autoFocus
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') cancelEdit()
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          saveEdit(m)
                        }
                      }}
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        type="button"
                        className="text-[10px] font-mono text-ctrl-text2 hover:text-ctrl-text transition-colors"
                        disabled={editSaving}
                        onClick={cancelEdit}
                      >
                        Zrušit
                      </button>
                      <button
                        type="button"
                        className="text-[10px] font-mono text-ctrl-accent hover:text-ctrl-accent2 transition-colors disabled:opacity-50"
                        disabled={editSaving || !canEditMessage(m) || (!editText.trim() && !(m.attachments?.length))}
                        onClick={() => saveEdit(m)}
                      >
                        {editSaving ? '…' : 'Uložit'}
                      </button>
                    </div>
                  </div>
                ) : m.text ? (
                  <div className={cn(
                    'text-[13px] leading-normal',
                    isOwn ? 'text-ctrl-text pr-5' : mentionedMe ? 'text-ctrl-text' : 'text-ctrl-text2'
                  )}>
                    {renderMentionText(m.text, memberNameSet, profile.name, memberByMentionKey, openMemberFromMention)}
                  </div>
                ) : null}
                <ChatMessageAttachments attachments={m.attachments} isOwn={isOwn} />

                <div className={cn('font-mono text-[9px] text-ctrl-text2 mt-1', isOwn && 'text-right')}>
                  {formatMessageTimestamp(m)}
                </div>

              </div>

              {isOwn && (
                <ChatUserAvatar
                  initials={m.author_initials}
                  isOwn
                  status={status}
                  isOnline={isOnline}
                  onClick={() => openMemberProfile(m.author_id)}
                />
              )}

            </div>

          )

        })}

        <div ref={bottomRef} />

      </div>

      {canWrite ? (
        <div className="pt-3 border-t border-ctrl-border mt-1">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingFiles.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono py-1 px-2 bg-ctrl-panel border border-ctrl-border text-ctrl-text2"
                >
                  📎 {f.name}
                  <button
                    type="button"
                    className="text-ctrl-text3 hover:text-ctrl-danger"
                    aria-label="Odebrat soubor"
                    onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {uploadError && (
            <div className="text-ctrl-danger text-[11px] font-mono mb-2">{uploadError}</div>
          )}
          <div className="flex gap-2 relative">
            {mentionCandidates.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-ctrl-panel2 border border-ctrl-border shadow-[0_-4px_16px_rgba(0,0,0,0.4)] z-50 max-h-[200px] overflow-y-auto">
                {mentionCandidates.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left py-2 px-3 text-[12px] font-mono text-ctrl-text hover:bg-ctrl-panel transition-colors duration-150 flex items-center gap-2"
                    onMouseDown={e => { e.preventDefault(); selectMention(c) }}
                  >
                    <span className="text-ctrl-accent font-bold">@</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={e => {
                addPendingFiles(Array.from(e.target.files || []))
                e.target.value = ''
              }}
            />
            <button
              type="button"
              className="shrink-0 border border-ctrl-border bg-ctrl-panel text-ctrl-text2 py-3 px-3.5 text-[13px] hover:border-ctrl-accent hover:text-ctrl-accent transition-all duration-200 disabled:opacity-50"
              title="Přiložit soubor"
              disabled={uploading || pendingFiles.length >= MAX_ATTACHMENTS_PER_MESSAGE}
              onClick={() => fileInputRef.current?.click()}
            >
              📎
            </button>
            <input
              ref={inputRef}
              className="flex-1 bg-ctrl-panel border border-ctrl-border text-ctrl-text py-3 px-4 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent"
              placeholder="Napiš zprávu… nebo @jméno pro zmínku"
              value={input}
              disabled={uploading}
              onChange={handleInputChange}
              onKeyDown={e => {
                if (mentionCandidates.length > 0) {
                  if (e.key === 'Escape') { e.preventDefault(); setMentionSearch(null); return }
                  if (e.key === 'Enter') { e.preventDefault(); selectMention(mentionCandidates[0]); return }
                }
                if (e.key === 'Enter' && !e.shiftKey) sendMessage()
              }}
            />
            <button
              type="button"
              className="border-0 py-3 px-5 text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-mono transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading || (!input.trim() && !pendingFiles.length)}
              onClick={sendMessage}
            >
              {uploading ? '…' : '→'}
            </button>
          </div>
        </div>
      ) : (

        <div className="py-3 text-ctrl-text2 text-xs font-mono border-t border-ctrl-border">

          // Pozorovatel — pouze čtení

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
