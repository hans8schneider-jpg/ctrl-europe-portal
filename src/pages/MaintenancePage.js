export function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-ctrl-bg [background:radial-gradient(ellipse_100%_80%_at_50%_-10%,rgba(42,107,255,0.15)_0%,transparent_60%),#050508]">
      <div className="w-full max-w-[440px] bg-ctrl-panel border border-ctrl-border py-12 px-10 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-0.5 animate-glow bg-gradient-to-r from-transparent via-ctrl-accent to-transparent" aria-hidden />
        <div className="absolute bottom-5 right-5 font-mono text-[10px] text-ctrl-text3 tracking-[2px] opacity-50 pointer-events-none" aria-hidden>[CTRL]</div>
        <img src="/ctrl_logo_bez_pozadi.png" alt="CTRL" className="h-14 w-auto mb-6" />
        <div className="font-mono text-[10px] tracking-[3px] text-ctrl-text2 uppercase mb-4">Members Portal · CEE Youth Platform</div>
        <div className="font-mono text-[22px] font-bold tracking-wide text-ctrl-text mb-3">Dočasně nedostupné</div>
        <p className="text-sm text-ctrl-text2 leading-relaxed mb-6">
          Portál je teď v údržbě. Přihlášení i zbytek webu budou zase k dispozici, jakmile údržba skončí.
        </p>
        <div className="font-mono text-[10px] tracking-[2px] uppercase text-ctrl-accent">
          // maintenance in progress
        </div>
      </div>
    </div>
  )
}
