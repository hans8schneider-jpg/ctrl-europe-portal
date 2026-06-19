import { useCallback, useEffect, useState } from 'react'
import { Sec } from './ui/Sec'
import {
  getPushPermission,
  hasActivePushSubscription,
  isIosDevice,
  isPushSupported,
  isStandalonePwa,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/pushNotifications'

export function PushNotifications({ userId }) {
  const [permission, setPermission] = useState(() => getPushPermission())
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setPermission(getPushPermission())
    if (!isPushSupported() || !userId) {
      setSubscribed(false)
      setLoading(false)
      return
    }
    const active = await hasActivePushSubscription(userId)
    setSubscribed(active)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSubscribe = async () => {
    setBusy(true)
    setMessage('')
    setError('')
    const { error: subscribeError } = await subscribeToPush(userId)
    setBusy(false)
    if (subscribeError) {
      setError(subscribeError.message || 'Nepodařilo se zapnout push oznámení')
      setPermission(getPushPermission())
      return
    }
    setSubscribed(true)
    setPermission('granted')
    setMessage('Push oznámení jsou zapnutá na tomto zařízení.')
  }

  const handleUnsubscribe = async () => {
    setBusy(true)
    setMessage('')
    setError('')
    const { error: unsubscribeError } = await unsubscribeFromPush(userId)
    setBusy(false)
    if (unsubscribeError) {
      setError(unsubscribeError.message || 'Nepodařilo se vypnout push oznámení')
      return
    }
    setSubscribed(false)
    setMessage('Push oznámení jsou vypnutá.')
  }

  const unsupported = !isPushSupported()
  const iosNeedsPwa = isIosDevice() && !isStandalonePwa()
  const denied = permission === 'denied'

  return (
    <div className="bg-ctrl-panel border border-ctrl-border p-5">
      <Sec>PUSH OZNÁMENÍ</Sec>
      <p className="text-xs text-ctrl-text2 mb-4 leading-relaxed">
        Dostávej systémová upozornění i když nemáš portál otevřený. Funguje pro nové
        notifikace v portálu (úkoly, zmínky, oznámení a další).
      </p>

      {loading ? (
        <p className="font-mono text-[11px] text-ctrl-text2">Načítám stav…</p>
      ) : unsupported ? (
        <p className="font-mono text-[11px] text-ctrl-text2">
          Tento prohlížeč push oznámení nepodporuje.
        </p>
      ) : (
        <>
          {iosNeedsPwa && !subscribed && (
            <p className="text-xs text-ctrl-warning mb-3 leading-relaxed border border-ctrl-warning/30 bg-ctrl-warning/10 py-2 px-3">
              Na iPhonu nejdřív přidej portál na domovskou obrazovku (Safari → Sdílet →
              Přidat na plochu), pak push zapni znovu.
            </p>
          )}

          {denied && (
            <p className="text-xs text-ctrl-danger mb-3 leading-relaxed">
              Oznámení jsou v prohlížeči zablokovaná. Povol je v nastavení stránky
              (ikona zámku v adresním řádku).
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {subscribed ? (
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={busy}
                className="border border-ctrl-border bg-transparent text-ctrl-text2 py-1.5 px-3 text-[10px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 hover:border-ctrl-danger hover:text-ctrl-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'UKLÁDÁM…' : 'VYPNOUT PUSH'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={busy || denied || iosNeedsPwa}
                className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'ZAPÍNÁM…' : 'ZAPNOUT PUSH OZNÁMENÍ'}
              </button>
            )}
            {subscribed && (
              <span className="font-mono text-[10px] text-ctrl-success tracking-wide">
                ✓ Aktivní na tomto zařízení
              </span>
            )}
          </div>
        </>
      )}

      {message && (
        <div className="text-ctrl-success font-mono text-[11px] mt-3">✓ {message}</div>
      )}
      {error && (
        <div className="text-ctrl-danger font-mono text-[11px] mt-3">// {error}</div>
      )}
    </div>
  )
}
