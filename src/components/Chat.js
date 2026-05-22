import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabase'
import { Sec } from './ui/Sec'
import { cn, getInitials } from '../lib/utils'
import { formatDate } from '../lib/format'
import { isAdmin } from '../lib/permissions'

export function Chat({ profile, activeBucket }) {
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
    const channel = supabase.channel(`chat-${bucket}`, { config: { broadcast: { self: true } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `bucket=eq.${bucket}` }, payload => {
        if (payload.new.pinned) setPinnedMsg(payload.new)
        else setMessages(prev => [...prev, payload.new])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `bucket=eq.${bucket}` }, () => {
        loadMessages()
      })
      .subscribe()
    // Fallback polling every 5s in case realtime fails
    const poll = setInterval(loadMessages, 5000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
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

  if (loading) return <div className="text-ctrl-text2 text-[13px]">Načítám zprávy...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] max-[900px]:h-[calc(100vh-130px)] animate-fade-in">
      <Sec>CHAT · {bucket.toUpperCase()}</Sec>
      {pinnedMsg && (
        <div className="border border-[rgba(42,107,255,0.2)] py-2.5 px-3.5 mb-3 flex items-start gap-2.5 bg-[rgba(42,107,255,0.08)]">
          <div className="text-ctrl-accent text-xs shrink-0 mt-px">📌</div>
          <div className="text-xs text-ctrl-text2 flex-1"><strong>{pinnedMsg.author_name}:</strong> {pinnedMsg.text}</div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-3">
        {messages.map(m => {
          const isOwn = m.author_id === profile.id
          return (
            <div key={m.id} className={cn('flex gap-2.5 items-start animate-fade-in', isOwn && 'flex-row-reverse', "group")}>
              <div className={cn('w-[30px] h-[30px] shrink-0 flex items-center justify-center text-[11px] font-bold font-mono border border-ctrl-border', isOwn ? 'bg-ctrl-accent text-white' : 'bg-ctrl-panel2 text-ctrl-text')}>
                {m.author_initials}
              </div>
              <div className={cn('max-w-[68%] bg-ctrl-panel border border-ctrl-border py-2.5 px-3.5 transition-colors duration-200 hover:border-ctrl-border2', isOwn && 'bg-[rgba(42,107,255,0.08)] border-[rgba(42,107,255,0.25)]')}>
                <div className={cn('font-mono text-[9px] text-ctrl-accent tracking-wide uppercase mb-0.5 flex items-center gap-2', isOwn && 'flex-row-reverse')}>
                  {m.author_name}
                  {isAdmin(profile.layer) && !isOwn && (
                    <span className="text-[9px] text-ctrl-text3 cursor-pointer opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:text-ctrl-accent" onClick={() => pinMessage(m)}>📌 připnout</span>
                  )}
                </div>
                <div className="text-[13px] leading-normal">{m.text}</div>
                <div className={cn('font-mono text-[9px] text-ctrl-text3 mt-1', isOwn && 'text-right')}>{formatDate(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {canWrite ? (
        <div className="flex gap-2 pt-3 border-t border-ctrl-border mt-1">
          <input className="flex-1 bg-ctrl-panel border border-ctrl-border text-ctrl-text py-3 px-4 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent" placeholder="Napiš zprávu..." value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
          <button className="border-0 py-3 px-5 text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-mono transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={sendMessage}>→</button>
        </div>
      ) : (
        <div className="py-3 text-ctrl-text2 text-xs font-mono border-t border-ctrl-border">
          // Pozorovatel — pouze čtení
        </div>
      )}
    </div>
  )
}
