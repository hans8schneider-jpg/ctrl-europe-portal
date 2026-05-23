import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabase'
import { cn } from '../lib/utils'
import { Sec } from './ui/Sec'

const REPORT_TYPES = [
  { value: 'bug', label: 'Chyba', desc: 'Něco nefunguje nebo je rozbité' },
  { value: 'idea', label: 'Nápad', desc: 'Návrh na vylepšení portálu' },
]

const inputCls =
  'w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]'

export function ReportModal({ profile, onClose }) {
  const [type, setType] = useState('bug')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!message.trim()) {
      setError('Popiš prosím chybu nebo nápad.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: insertErr } = await supabase.from('member_reports').insert([
      {
        type,
        title: title.trim() || null,
        message: message.trim(),
        author_id: profile.id,
      },
    ])
    setSubmitting(false)
    if (insertErr) {
      setError('Odeslání se nepodařilo. Zkus to znovu nebo kontaktuj admina.')
      return
    }
    setSuccess(true)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-[rgba(0,0,0,0.75)] backdrop-blur-sm max-[900px]:bottom-[70px]"
      onClick={onClose}
    >
      <div
        className="bg-ctrl-panel border border-ctrl-border rounded-lg w-full max-w-[480px] max-h-[90vh] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-4 border-b border-ctrl-border">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded bg-transparent border border-ctrl-border text-ctrl-text2 text-lg leading-none cursor-pointer transition-colors hover:border-ctrl-text2 hover:text-ctrl-text"
            aria-label="Zavřít"
          >
            ×
          </button>
          <Sec className="!mb-2">REPORT</Sec>
          <p className="text-[13px] text-ctrl-text2 leading-relaxed pr-8">
            Nahlás chybu na webu nebo navrhni změnu. Report uvidí administrátoři portálu.
          </p>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="font-mono text-4xl text-ctrl-success mb-3">✓</div>
            <div className="text-[15px] font-bold mb-2">Děkujeme za report</div>
            <p className="text-[13px] text-ctrl-text2 mb-6">
              Tvůj {type === 'bug' ? 'nahlášený problém' : 'nápad'} byl uložen. Admini ho projdou.
            </p>
            <button
              type="button"
              className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2"
              onClick={onClose}
            >
              ZAVŘÍT
            </button>
          </div>
        ) : (
          <form className="flex flex-col min-h-0 flex-1 overflow-y-auto" onSubmit={submit}>
            <div className="px-6 py-4 flex flex-col gap-4">
              <div>
                <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-2">
                  Typ reportu
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_TYPES.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={cn(
                        'text-left py-3 px-3 border cursor-pointer transition-all duration-200 bg-transparent',
                        type === opt.value
                          ? 'border-ctrl-accent bg-[rgba(42,107,255,0.08)] text-ctrl-text'
                          : 'border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2'
                      )}
                      onClick={() => setType(opt.value)}
                    >
                      <div className="text-[13px] font-bold mb-0.5">{opt.label}</div>
                      <div className="font-mono text-[9px] tracking-wide opacity-80">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5 block">
                  Nadpis (volitelné)
                </label>
                <input
                  className={inputCls}
                  placeholder="Krátký souhrn..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={120}
                />
              </div>

              <div>
                <label className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5 block">
                  Popis *
                </label>
                <textarea
                  className={cn(inputCls, 'min-h-[120px] resize-y')}
                  placeholder={
                    type === 'bug'
                      ? 'Co se stalo? Kde na portálu? Co jsi očekával/a?'
                      : 'Co bys na portálu změnil/a nebo přidal/a?'
                  }
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                />
              </div>

              {error && (
                <p className="font-mono text-[11px] text-ctrl-danger tracking-wide">{error}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-ctrl-border flex gap-2.5 shrink-0">
              <button
                type="submit"
                disabled={submitting}
                className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'ODESÍLÁM...' : 'ODESLAT REPORT'}
              </button>
              <button
                type="button"
                className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text"
                onClick={onClose}
              >
                ZRUŠIT
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
