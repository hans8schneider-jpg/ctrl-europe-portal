import { useState } from 'react'
import { supabase } from '../supabase'
import { Sec } from './ui/Sec'

export function PasswordChange() {
  const [open, setOpen] = useState(false)
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = async () => {
    setMsg(''); setError('')
    if (!oldPass || !newPass || !confirm) return setError('Vyplň všechna pole')
    if (newPass.length < 6) return setError('Nové heslo musí mít alespoň 6 znaků')
    if (newPass !== confirm) return setError('Hesla se neshodují')
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: session.user.email, password: oldPass
    })
    if (signInErr) { setError('Původní heslo je nesprávné'); setLoading(false); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPass })
    if (updateErr) setError('Chyba: ' + updateErr.message)
    else { setMsg('Heslo bylo úspěšně změněno!'); setOldPass(''); setNewPass(''); setConfirm(''); setOpen(false) }
    setLoading(false)
  }

  return (
    <div className="bg-ctrl-panel border border-ctrl-border p-5">
      <div className="flex justify-between items-center">
        <Sec className="!mb-0">ZMĚNIT HESLO</Sec>
        <button className="border-0 py-1.5 px-3 text-[10px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text" onClick={() => { setOpen(v => !v); setMsg(''); setError('') }}>
          {open ? 'ZRUŠIT' : 'ZMĚNIT'}
        </button>
      </div>
      {msg && <div className="text-ctrl-success font-mono text-[11px] mt-2.5">✓ {msg}</div>}
      {open && (
        <div className="mt-3.5 animate-fade-in">
          <div className="mb-2.5">
            <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Původní heslo</div>
            <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" type="password" placeholder="Původní heslo..." value={oldPass} onChange={e => setOldPass(e.target.value)} />
          </div>
          <div className="mb-2.5">
            <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Nové heslo</div>
            <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" type="password" placeholder="Nové heslo (min. 6 znaků)..." value={newPass} onChange={e => setNewPass(e.target.value)} />
          </div>
          <div className="mb-3.5">
            <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Potvrdit nové heslo</div>
            <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]" type="password" placeholder="Zopakuj nové heslo..." value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChange()} />
          </div>
          {error && <div className="text-ctrl-danger font-mono text-[11px] mb-2.5">// {error}</div>}
          <button className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px" onClick={handleChange} disabled={loading}>
            {loading ? 'MĚNÍM...' : 'ULOŽIT NOVÉ HESLO'}
          </button>
        </div>
      )}
    </div>
  )
}
