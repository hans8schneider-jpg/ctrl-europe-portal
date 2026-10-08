import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { cn } from '../lib/utils'
import { formatDate } from '../lib/format'
import { Sec } from '../components/ui/Sec'
import {
  NewsletterTemplateEditor,
  WELCOME_TEMPLATE_HTML,
  WELCOME_TEMPLATE_SUBJECT,
} from '../components/NewsletterTemplateEditor'

const GROUPS = [
  { value: 'all', label: 'Všechny skupiny' },
  { value: 'workshops', label: 'Workshopy' },
  { value: 'summit', label: 'Summit' },
  { value: 'run', label: 'CTRL Run' },
  { value: 'partners', label: 'Partneři' },
  { value: 'media', label: 'Média' },
]

const GROUP_LABEL = {
  news: 'Aktuality',
  ...Object.fromEntries(GROUPS.map((group) => [group.value, group.label])),
}

const inputCls = 'w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]'

const primaryBtnCls = 'border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 disabled:opacity-50 disabled:cursor-not-allowed'

const secondaryBtnCls = 'border border-ctrl-border py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text disabled:opacity-50 disabled:cursor-not-allowed'

async function callNewsletter(body) {
  const { data, error } = await supabase.functions.invoke('send-newsletter', { body })
  if (!error) return data ?? { error: 'request_failed' }
  const context = error.context
  if (context && typeof context.json === 'function') {
    try {
      return await context.json()
    } catch {
      return { error: 'request_failed' }
    }
  }
  return { error: 'request_failed' }
}

function sendFailureText(code) {
  if (code === 'missing_unsubscribe') return 'V mailu chybí odkaz pro odhlášení.'
  if (code === 'not_in_group') return 'Tahle adresa v této skupině není přihlášená.'
  return 'Nepodařilo se odeslat. Zkuste to znovu.'
}

export function NewsletterSendPage() {
  const editorRef = useRef(null)
  const sendEditorRef = useRef(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [templates, setTemplates] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [editorSession, setEditorSession] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const [compose, setCompose] = useState({
    key: 'start',
    subject: WELCOME_TEMPLATE_SUBJECT,
    html: WELCOME_TEMPLATE_HTML,
    templateId: '',
  })
  const [sendDirty, setSendDirty] = useState(false)
  const [group, setGroup] = useState('workshops')
  const [count, setCount] = useState(null)
  const [confirmSend, setConfirmSend] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [busy, setBusy] = useState(null)
  const [sendMessage, setSendMessage] = useState(null)
  const [history, setHistory] = useState([])

  const loadTemplates = useCallback(async () => {
    setListLoading(true)
    const data = await callNewsletter({ action: 'templates' })
    if (data?.ok && Array.isArray(data.templates)) {
      setTemplates(data.templates.map((row) => ({
        id: row.id,
        name: row.name,
        subject: row.subject,
        html: row.html,
        updated_at: row.updated_at,
      })))
    } else {
      setMessage({ tone: 'err', text: 'Šablony se nepodařilo načíst. Zkuste to znovu.' })
    }
    setListLoading(false)
  }, [])

  const loadHistory = useCallback(async () => {
    const data = await callNewsletter({ action: 'history' })
    if (data?.ok && Array.isArray(data.history)) {
      setHistory(data.history.map((row) => ({
        created_at: row.created_at,
        mode: row.mode,
        group_key: row.group_key,
        subject: row.subject,
        template_name: row.template_name,
        recipient_count: row.recipient_count,
        sent_count: row.sent_count,
        failed_count: row.failed_count,
      })))
    }
  }, [])

  useEffect(() => {
    loadTemplates()
    loadHistory()
  }, [loadTemplates, loadHistory])

  const runPending = (action) => {
    if (editorRef.current?.isDirty() || dirty) {
      setPending(() => action)
      return
    }
    action()
  }

  const openTemplate = (item) => {
    runPending(() => {
      setMessage(null)
      setDirty(false)
      setEditorSession({
        key: `${item.id}-${item.updated_at}`,
        id: item.id,
        name: item.name,
        subject: item.subject,
        html: item.html,
      })
    })
  }

  const openNew = () => {
    runPending(() => {
      setMessage(null)
      setDirty(false)
      setEditorSession({
        key: `new-${Date.now()}`,
        id: null,
        name: '',
        subject: '',
        html: WELCOME_TEMPLATE_HTML,
      })
    })
  }

  const rememberCompose = () => {
    const snap = sendEditorRef.current?.getSnapshot()
    if (!snap) return
    setCompose((prev) => ({ ...prev, subject: snap.subject, html: snap.html }))
    setSendDirty(false)
  }

  const openTemplates = () => {
    rememberCompose()
    setPending(null)
    setTemplatesOpen(true)
  }

  const closeTemplates = () => {
    runPending(() => {
      setTemplatesOpen(false)
      setEditorSession(null)
      setDirty(false)
      setMessage(null)
      setPending(null)
    })
  }

  const handleSave = async (snapshot) => {
    const name = snapshot.name.trim()
    const subject = snapshot.subject.trim()
    const html = snapshot.html || ''
    if (!name || !subject || !html.trim()) {
      setMessage({ tone: 'err', text: 'Vyplň název, předmět a obsah šablony.' })
      return false
    }
    if (name.length > 80 || subject.length > 120 || html.length > 100000) {
      setMessage({ tone: 'err', text: 'Vyplň název, předmět a obsah šablony.' })
      return false
    }

    setSaving(true)
    setMessage(null)
    const isUpdate = Boolean(editorSession?.id)
    const data = await callNewsletter(isUpdate
      ? { action: 'template_update', id: editorSession.id, name, subject, html }
      : { action: 'template_create', name, subject, html })
    setSaving(false)

    if (!data?.ok || !data.template?.id) {
      setMessage({ tone: 'err', text: 'Nepodařilo se uložit. Zkuste to znovu.' })
      return false
    }

    const saved = {
      id: data.template.id,
      name: data.template.name,
      subject: data.template.subject,
      html: data.template.html,
      updated_at: data.template.updated_at,
    }
    setTemplates((prev) => {
      const rest = prev.filter((item) => item.id !== saved.id)
      return [saved, ...rest].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
    })
    setDirty(false)
    setEditorSession({
      key: `${saved.id}-${saved.updated_at}`,
      id: saved.id,
      name: saved.name,
      subject: saved.subject,
      html: saved.html,
    })
    setMessage({ tone: 'ok', text: 'Šablona uložena.' })
    return true
  }

  const handleDelete = async () => {
    if (!editorSession?.id) return
    const snapshot = editorRef.current?.getSnapshot()
    const label = (snapshot?.name || editorSession.name).trim()
    if (!window.confirm(`Smazat šablonu ${label}?`)) return
    setSaving(true)
    setMessage(null)
    const data = await callNewsletter({ action: 'template_delete', id: editorSession.id })
    setSaving(false)
    if (!data?.ok) {
      setMessage({ tone: 'err', text: 'Nepodařilo se smazat. Zkuste to znovu.' })
      return
    }
    setTemplates((prev) => prev.filter((item) => item.id !== editorSession.id))
    setEditorSession(null)
    setDirty(false)
    setMessage({ tone: 'ok', text: 'Šablona smazána.' })
    if (compose.templateId === editorSession.id) {
      setCompose((prev) => ({ ...prev, templateId: '' }))
    }
  }

  const saveAndContinue = async () => {
    const snapshot = editorRef.current?.getSnapshot()
    if (!snapshot) return
    const ok = await handleSave(snapshot)
    if (!ok) return
    const next = pending
    setPending(null)
    next?.()
  }

  const discardAndContinue = () => {
    editorRef.current?.reset()
    setDirty(false)
    const next = pending
    setPending(null)
    next?.()
  }

  const changeTemplate = (value) => {
    if (!value) {
      setCompose((prev) => ({ ...prev, templateId: '' }))
      return
    }
    const item = templates.find((row) => row.id === value)
    if (!item) return
    if ((sendEditorRef.current?.isDirty() || sendDirty) && !window.confirm('Nahradit rozepsaný mail touto šablonou?')) {
      return
    }
    setCompose({
      key: `${item.id}-${item.updated_at}-${Date.now()}`,
      subject: item.subject,
      html: item.html,
      templateId: item.id,
    })
    setSendDirty(false)
    setSendMessage(null)
  }

  const changeGroup = (value) => {
    setGroup(value)
    setCount(null)
    setConfirmSend(false)
    setSendMessage(null)
  }

  const mailDraft = () => {
    const snapshot = sendEditorRef.current?.getSnapshot()
    const subject = snapshot?.subject.trim() || ''
    const html = snapshot?.html || ''
    if (!subject || !html.trim() || subject.length > 120 || html.length > 100000) {
      setSendMessage({ tone: 'err', text: 'Vyplň předmět a obsah mailu.' })
      return null
    }
    if (!html.includes('{{unsubscribe_url}}')) {
      setSendMessage({ tone: 'err', text: 'V mailu chybí odkaz pro odhlášení.' })
      return null
    }
    return { subject, html }
  }

  const countRecipients = async () => {
    if (busy) return
    setBusy('count')
    setSendMessage(null)
    const data = await callNewsletter({ action: 'count', group })
    setBusy(null)
    if (!data?.ok || typeof data.count !== 'number') {
      setCount(null)
      setConfirmSend(false)
      setSendMessage({ tone: 'err', text: 'Počet se nepodařilo zjistit. Zkuste to znovu.' })
      return
    }
    setCount(data.count)
    setConfirmSend(false)
  }

  const sendTest = async () => {
    if (busy) return
    const draft = mailDraft()
    if (!draft) return
    setBusy('test')
    setSendMessage(null)
    const data = await callNewsletter({
      action: 'test',
      group,
      testEmail,
      subject: draft.subject,
      html: draft.html,
      ...(compose.templateId ? { templateId: compose.templateId } : {}),
    })
    setBusy(null)
    if (data?.error === 'missing_unsubscribe' || data?.error === 'not_in_group' || !data?.ok) {
      setSendMessage({ tone: 'err', text: sendFailureText(data?.error) })
      return
    }
    if (data.failed > 0) {
      setSendMessage({ tone: 'err', text: 'Nepodařilo se odeslat. Zkuste to znovu.' })
    } else {
      setSendMessage({ tone: 'ok', text: 'Zkouška odeslána.' })
    }
    loadHistory()
  }

  const sendGroup = async () => {
    if (busy || count === null || !confirmSend) return
    const draft = mailDraft()
    if (!draft) return
    setBusy('send')
    setSendMessage(null)
    const data = await callNewsletter({
      action: 'send',
      group,
      confirm: true,
      subject: draft.subject,
      html: draft.html,
      ...(compose.templateId ? { templateId: compose.templateId } : {}),
    })
    setBusy(null)
    if (!data?.ok) {
      setSendMessage({ tone: 'err', text: sendFailureText(data?.error) })
      return
    }
    if (data.failed > 0) {
      setSendMessage({
        tone: 'err',
        text: 'Odesláno. Část se nepodařila.',
        sent: data.sent,
        failed: data.failed,
      })
    } else {
      setSendMessage({ tone: 'ok', text: 'Odesláno.' })
    }
    setCount(null)
    setConfirmSend(false)
    loadHistory()
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-5">
        <Sec className="!mb-0">Newsletter</Sec>
        <button type="button" className={secondaryBtnCls} onClick={openTemplates}>
          Šablony
        </button>
      </div>

      <div className="bg-ctrl-panel border border-ctrl-border p-5 mb-4 max-[900px]:p-3.5">
        <label className="block">
          <span className="block font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Šablona</span>
          <select className={inputCls} value={compose.templateId} onChange={(event) => changeTemplate(event.target.value)}>
            <option value="">Bez šablony</option>
            {templates.map((item) => (
              <option key={item.id} value={item.id}>{item.name} — {item.subject}</option>
            ))}
          </select>
          <span className="block mt-2 text-sm text-ctrl-text2">Volitelná. Jen předvyplní mail, poslat jde i bez ní.</span>
        </label>
      </div>

      {!templatesOpen && (
        <div className="mb-4">
          <NewsletterTemplateEditor
            key={compose.key}
            ref={sendEditorRef}
            compose
            name=""
            subject={compose.subject}
            html={compose.html}
            canDelete={false}
            saving={false}
            onDirtyChange={setSendDirty}
          />
        </div>
      )}

      <div className="bg-ctrl-panel border border-ctrl-border p-5 max-[900px]:p-3.5">
        <label className="block mb-4">
          <span className="block font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Skupina</span>
          <select className={inputCls} value={group} onChange={(event) => changeGroup(event.target.value)}>
            {GROUPS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <button type="button" className={secondaryBtnCls} disabled={Boolean(busy)} onClick={countRecipients}>
          Spočítat příjemce
        </button>

        {count !== null && (
          <div className="mt-4">
            <p className="text-sm mb-3">
              {group === 'all'
                ? `Ve všech skupinách je ${count} přihlášených.`
                : `V této skupině je ${count} přihlášených.`}
            </p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={confirmSend}
                onChange={(event) => setConfirmSend(event.target.checked)}
              />
              {group === 'all'
                ? 'Odesílám tento mail všem skupinám.'
                : 'Odesílám tento mail celé skupině.'}
            </label>
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            className={primaryBtnCls}
            disabled={count === null || !confirmSend || Boolean(busy)}
            onClick={sendGroup}
          >
            Odeslat skupině
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-ctrl-border">
          <label className="block mb-3">
            <span className="block font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Zkušební adresa</span>
            <input
              type="email"
              className={inputCls}
              value={testEmail}
              maxLength={254}
              onChange={(event) => setTestEmail(event.target.value)}
            />
          </label>
          <button
            type="button"
            className={secondaryBtnCls}
            disabled={!testEmail.trim() || Boolean(busy)}
            onClick={sendTest}
          >
            Poslat zkoušku
          </button>
        </div>

        {sendMessage && (
          <div className={cn('mt-4 text-sm', sendMessage.tone === 'ok' ? 'text-ctrl-success' : 'text-ctrl-danger')}>
            <p>{sendMessage.text}</p>
            {sendMessage.text === 'Odesláno. Část se nepodařila.' && (
              <p className="mt-1 font-mono text-[12px]">{sendMessage.sent} / {sendMessage.failed}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Sec>Poslední odeslání</Sec>
        <div className="bg-ctrl-panel border border-ctrl-border overflow-x-auto">
          {history.length === 0 ? (
            <p className="p-4 text-sm text-ctrl-text2">Zatím se nic neodesílalo.</p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 border-b border-ctrl-border">
                  <th className="p-3 font-normal">Datum</th>
                  <th className="p-3 font-normal">Šablona</th>
                  <th className="p-3 font-normal">Skupina</th>
                  <th className="p-3 font-normal">Předmět</th>
                  <th className="p-3 font-normal">Režim</th>
                  <th className="p-3 font-normal">Počty</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, index) => (
                  <tr key={`${row.created_at}-${index}`} className="border-b border-ctrl-border last:border-b-0">
                    <td className="p-3 whitespace-nowrap">{formatDate(row.created_at)}</td>
                    <td className="p-3">{row.template_name}</td>
                    <td className="p-3">{GROUP_LABEL[row.group_key] || row.group_key}</td>
                    <td className="p-3">{row.subject}</td>
                    <td className="p-3">{row.mode === 'test' ? 'Zkouška' : 'Skupina'}</td>
                    <td className="p-3 font-mono text-[12px] whitespace-nowrap">
                      příjemců {row.recipient_count} · odesláno {row.sent_count} · selhalo {row.failed_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {templatesOpen && (
        <div
          className="fixed inset-0 z-[350] flex justify-end bg-[rgba(0,0,0,0.55)] backdrop-blur-sm animate-fade-in max-[900px]:bottom-[62px]"
          onClick={closeTemplates}
        >
          <div
            className="w-full max-w-[920px] h-full bg-ctrl-bg border-l border-ctrl-border overflow-y-auto animate-fade-in shadow-[-24px_0_80px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-ctrl-panel border-b border-ctrl-border max-[900px]:px-4">
              <Sec className="!mb-0">Šablony</Sec>
              <button type="button" className={secondaryBtnCls} onClick={closeTemplates}>
                Zavřít
              </button>
            </div>

            <div className="p-5 max-[900px]:p-3.5">
              {pending && (
                <div className="mb-4 bg-ctrl-panel border border-ctrl-border p-4">
                  <p className="text-sm mb-3">Máš neuložené změny.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={primaryBtnCls} disabled={saving} onClick={saveAndContinue}>Uložit</button>
                    <button type="button" className={secondaryBtnCls} disabled={saving} onClick={discardAndContinue}>Zahodit změny</button>
                  </div>
                </div>
              )}

              {message && (
                <p className={cn('mb-4 text-sm', message.tone === 'ok' ? 'text-ctrl-success' : 'text-ctrl-danger')}>
                  {message.text}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm text-ctrl-text2">Uložené šablony pro rychlé předvyplnění mailu.</p>
                <button type="button" className={primaryBtnCls} onClick={openNew}>Nová šablona</button>
              </div>

              {listLoading ? (
                <p className="font-mono text-[11px] tracking-[2px] uppercase text-ctrl-text2">Načítám…</p>
              ) : (
                <div className="bg-ctrl-panel border border-ctrl-border mb-4">
                  {templates.length === 0 ? (
                    <p className="p-4 text-sm text-ctrl-text2">Zatím tu není žádná šablona.</p>
                  ) : templates.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-ctrl-border last:border-b-0 bg-transparent cursor-pointer hover:bg-[rgba(42,107,255,0.05)]',
                        editorSession?.id === item.id && 'bg-[rgba(42,107,255,0.08)]',
                      )}
                      onClick={() => openTemplate(item)}
                    >
                      <div className="text-[14px] font-bold">{item.name}</div>
                      <div className="text-[13px] text-ctrl-text2 mt-0.5">{item.subject}</div>
                      <div className="font-mono text-[10px] text-ctrl-text3 mt-1">{formatDate(item.updated_at)}</div>
                    </button>
                  ))}
                </div>
              )}

              {editorSession && (
                <NewsletterTemplateEditor
                  key={editorSession.key}
                  ref={editorRef}
                  name={editorSession.name}
                  subject={editorSession.subject}
                  html={editorSession.html}
                  canDelete={Boolean(editorSession.id)}
                  saving={saving}
                  onDirtyChange={setDirty}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
