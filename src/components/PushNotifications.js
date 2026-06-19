import { useCallback, useEffect, useState } from 'react'
import { cn } from '../lib/utils'
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

function PushDeviceCard({
  loading,
  unsupported,
  subscribed,
  busy,
  denied,
  iosNeedsPwa,
  message,
  error,
  onSubscribe,
  onUnsubscribe,
}) {
  if (loading) {
    return (
      <div className="mb-4 border border-ctrl-border bg-ctrl-bg2/30 py-3.5 px-4">
        <p className="font-mono text-[11px] text-ctrl-text2">Načítám stav push…</p>
      </div>
    )
  }

  if (unsupported) {
    return (
      <div className="mb-4 border border-ctrl-border bg-ctrl-bg2/30 py-3.5 px-4">
        <p className="text-xs text-ctrl-text2 leading-relaxed">
          Tento prohlížeč bohužel push oznámení nepodporuje.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mb-4 border py-3.5 px-4 transition-colors duration-200',
        subscribed
          ? 'border-ctrl-success/35 bg-[rgba(0,229,160,0.06)]'
          : 'border-ctrl-border bg-ctrl-bg2/30',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[13px] font-medium text-ctrl-text">Push na tomto zařízení</span>
            <span
              className={cn(
                'font-mono text-[8px] tracking-[1.5px] uppercase py-0.5 px-1.5 border',
                subscribed
                  ? 'border-ctrl-success/40 text-ctrl-success bg-ctrl-success/10'
                  : 'border-ctrl-border text-ctrl-text2 bg-ctrl-bg2/50',
              )}
            >
              {subscribed ? 'Zapnuto' : 'Vypnuto'}
            </span>
          </div>
          <p className="text-xs text-ctrl-text2 leading-relaxed">
            {subscribed
              ? 'Upozornění ti budou chodit i mimo portál. Platí jen pro tento prohlížeč a zařízení.'
              : 'Povol upozornění v prohlížeči — pak si níže vyber, o čem chceš push dostávat.'}
          </p>
        </div>

        <div className="shrink-0 pt-0.5">
          {subscribed ? (
            <button
              type="button"
              onClick={onUnsubscribe}
              disabled={busy}
              className="font-mono text-[10px] tracking-[1px] text-ctrl-text2 underline-offset-2 hover:text-ctrl-danger hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? 'Ukládám…' : 'Vypnout na tomto zařízení'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubscribe}
              disabled={busy || denied || iosNeedsPwa}
              className="border border-ctrl-accent bg-[rgba(42,107,255,0.08)] text-ctrl-accent py-2 px-3.5 text-[12px] font-semibold cursor-pointer font-sans transition-all duration-200 hover:bg-[rgba(42,107,255,0.14)] hover:border-ctrl-accent2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Čekám na prohlížeč…' : 'Povolit upozornění'}
            </button>
          )}
        </div>
      </div>

      {iosNeedsPwa && !subscribed && (
        <p className="text-xs text-ctrl-warning mt-3 leading-relaxed border border-ctrl-warning/30 bg-ctrl-warning/10 py-2 px-3">
          Na iPhonu nejdřív přidej portál na domovskou obrazovku (Safari → Sdílet → Přidat na
          plochu), pak upozornění zapni znovu.
        </p>
      )}

      {denied && !subscribed && (
        <p className="text-xs text-ctrl-danger mt-3 leading-relaxed">
          Prohlížeč upozornění blokuje. Povol je v nastavení stránky — ikona zámku v adresním
          řádku.
        </p>
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

export function PushNotifications({ userId, embedded = false, onPushActiveChange }) {
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

  useEffect(() => {
    if (loading) return
    onPushActiveChange?.(subscribed)
  }, [subscribed, loading, onPushActiveChange])

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
    setMessage('Hotovo — push jsou aktivní na tomto zařízení.')
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
    setMessage('Push jsou vypnutá na tomto zařízení.')
  }

  const unsupported = !isPushSupported()
  const iosNeedsPwa = isIosDevice() && !isStandalonePwa()
  const denied = permission === 'denied'

  const card = (
    <PushDeviceCard
      loading={loading}
      unsupported={unsupported}
      subscribed={subscribed}
      busy={busy}
      denied={denied}
      iosNeedsPwa={iosNeedsPwa}
      message={message}
      error={error}
      onSubscribe={handleSubscribe}
      onUnsubscribe={handleUnsubscribe}
    />
  )

  if (embedded) return card

  return (
    <div className="bg-ctrl-panel border border-ctrl-border p-5">
      <Sec>PUSH OZNÁMENÍ</Sec>
      <p className="text-xs text-ctrl-text2 mb-4 leading-relaxed">
        Dostávej systémová upozornění i když nemáš portál otevřený.
      </p>
      {card}
    </div>
  )
}
