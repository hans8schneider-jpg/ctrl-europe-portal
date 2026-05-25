import { useState, useEffect, useRef, useCallback } from 'react'

import { supabase } from '../supabase'

import { Sec } from './ui/Sec'
import { ChatUserAvatar } from './ChatUserAvatar'
import { ChatMessageAttachments } from './ChatMessageAttachments'
import { MemberModal } from './MemberModal'

import { cn, getInitials, isUserOnline } from '../lib/utils'
import { useAppData } from '../context/AppDataContext'

import { formatDate } from '../lib/format'

import { isAdmin } from '../lib/permissions'
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  removeChatAttachments,
  uploadChatAttachments,
  validateChatAttachment,
} from '../lib/chatAttachments'



export function Chat({ profile, activeBucket }) {
  const { members, touchLastSeen, tasks } = useAppData()
  const [selectedMember, setSelectedMember] = useState(null)

  const [messages, setMessages] = useState([])
  const [presenceByUserId, setPresenceByUserId] = useState({})
  const [, setPresenceTick] = useState(0)

  const [input, setInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const [loading, setLoading] = useState(true)

  const [pinnedMsg, setPinnedMsg] = useState(null)

  const [openMenuId, setOpenMenuId] = useState(null)

  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

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

      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `bucket=eq.${bucket}` }, payload => {

        setMessages(prev => prev.filter(m => m.id !== payload.old.id))

        setPinnedMsg(prev => (prev?.id === payload.old.id ? null : prev))

      })

      .subscribe()

    // Fallback polling every 5s in case realtime fails

    const poll = setInterval(loadMessages, 5000)

    return () => { supabase.removeChannel(channel); clearInterval(poll) }

  }, [loadMessages, bucket])

  useEffect(() => {
    const map = {}
    members.forEach(m => {
      map[String(m.id)] = { status: m.status || 'active', last_seen: m.last_seen }
    })
    setPresenceByUserId(map)
  }, [members])

  useEffect(() => {
    const channel = supabase
      .channel('chat-profile-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        const row = payload.new
        if (!row?.id) return
        setPresenceByUserId(prev => {
          const id = String(row.id)
          const cur = prev[id] || {}
          return {
            ...prev,
            [id]: {
              status: row.status ?? cur.status ?? 'active',
              last_seen: row.last_seen !== undefined ? row.last_seen : cur.last_seen,
            },
          }
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const tick = setInterval(() => setPresenceTick(t => t + 1), 60000)
    return () => clearInterval(tick)
  }, [])

  const openMemberProfile = (authorId) => {
    const member = members.find(m => String(m.id) === String(authorId))
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

    const close = () => setOpenMenuId(null)

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

  const sendMessage = async () => {
    if (!canWrite || uploading) return
    const text = input.trim()
    if (!text && !pendingFiles.length) return

    setUploading(true)
    setUploadError(null)
    let attachments = []
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
      touchLastSeen()
      setInput('')
      setPendingFiles([])
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

        {messages.map(m => {

          const isOwn = String(m.author_id) === String(profile.id)
          const { status, isOnline } = getAuthorPresence(m.author_id)

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

                    : 'bg-ctrl-panel border border-ctrl-border hover:border-ctrl-border2'

                )}

              >

                {isOwn && (

                  <div className="absolute top-1 right-1" onClick={e => e.stopPropagation()}>

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

                      <div className="absolute top-full right-0 mt-0.5 z-20 min-w-[120px] bg-ctrl-panel2 border border-ctrl-border shadow-[0_8px_24px_rgba(0,0,0,0.5)]">

                        <button

                          type="button"

                          className="w-full text-left py-2 px-3 text-[11px] font-mono text-ctrl-danger hover:bg-[rgba(255,51,102,0.1)] transition-colors duration-200"

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

                {m.text ? (
                  <div className={cn('text-[13px] leading-normal', isOwn ? 'text-ctrl-text pr-5' : 'text-ctrl-text2')}>{m.text}</div>
                ) : null}
                <ChatMessageAttachments attachments={m.attachments} isOwn={isOwn} />

                <div className={cn('font-mono text-[9px] text-ctrl-text2 mt-1', isOwn && 'text-right')}>{formatDate(m.created_at)}</div>

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
          <div className="flex gap-2">
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
              className="flex-1 bg-ctrl-panel border border-ctrl-border text-ctrl-text py-3 px-4 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent"
              placeholder="Napiš zprávu..."
              value={input}
              disabled={uploading}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
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


