import { useState } from 'react'
import { supabase } from '../supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return setError('// Vyplň email a heslo')
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError('// ' + (err.message.includes('Invalid') ? 'Chybný email nebo heslo' : err.message))
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-ctrl-bg [background:radial-gradient(ellipse_100%_80%_at_50%_-10%,rgba(42,107,255,0.15)_0%,transparent_60%),#050508]">
      <div className="w-full max-w-[400px] bg-ctrl-panel border border-ctrl-border py-12 px-10 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-0.5 animate-glow bg-gradient-to-r from-transparent via-ctrl-accent to-transparent" aria-hidden />
        <div className="absolute bottom-5 right-5 font-mono text-[10px] text-ctrl-text3 tracking-[2px] opacity-50 pointer-events-none" aria-hidden>[CTRL]</div>
        <div className="font-mono text-[44px] font-bold tracking-[-2px] mb-1">[<span className="text-ctrl-accent [text-shadow:0_0_20px_rgba(42,107,255,0.5)]">CTRL</span>]</div>
        <div className="font-mono text-[10px] tracking-[3px] text-ctrl-text2 uppercase mb-10">Members Portal · CEE Youth Platform</div>
        <div className="font-mono text-[10px] text-ctrl-text2 mb-8 tracking-wide italic">
          "Take control before someone else does."
        </div>
        <div className="font-mono text-[10px] tracking-[2px] uppercase text-ctrl-text2 mb-2">Email</div>
        <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[13px] px-4 text-sm font-sans outline-none transition-all duration-[250ms] mb-5 block focus:border-ctrl-accent focus:shadow-[0_0_0_3px_rgba(42,107,255,0.1)]" type="email" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="tvuj@email.cz" autoComplete="email" />
        <div className="font-mono text-[10px] tracking-[2px] uppercase text-ctrl-text2 mb-2">Heslo</div>
        <input className="w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[13px] px-4 text-sm font-sans outline-none transition-all duration-[250ms] mb-5 block focus:border-ctrl-accent focus:shadow-[0_0_0_3px_rgba(42,107,255,0.1)]" type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" autoComplete="current-password" />
        <button className="w-full bg-ctrl-accent text-white border-0 py-[15px] text-[13px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 mt-1 hover:bg-ctrl-accent2 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleLogin} disabled={loading}>
          {loading ? 'PŘIHLAŠUJI...' : 'PŘIHLÁSIT SE →'}
        </button>
        {error && <div className="text-ctrl-danger text-[11px] mt-2.5 font-mono">{error}</div>}
      </div>
    </div>
  )
}
