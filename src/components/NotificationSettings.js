import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { cn } from '../lib/utils'
import { Sec } from './ui/Sec'
import { PushNotifications } from './PushNotifications'
import {
  NOTIFICATION_PREF_DEFAULTS,
  NOTIFICATION_TYPE_OPTIONS,
  readNotificationPref,
} from '../lib/notificationPreferences'
import { useAppData } from '../context/AppDataContext'

function NotificationHelpBox() {
  return (
    <div className="mb-4 border border-ctrl-border bg-ctrl-bg2/40 py-3.5 px-4">
      <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-accent mb-2.5">
        Co jsou push oznámení?
      </div>
      <p className="text-xs text-ctrl-text2 leading-relaxed mb-3">
        Push jsou systémová upozornění od portálu — podobně jako zprávy z mobilních aplikací.
        Přijdou i když nemáš portál otevřený, máš jinou záložku nebo je prohlížeč minimalizovaný.
        Prohlížeč tě na ně upozorní v rohu obrazovky (nebo na lock screenu u telefonu).
      </p>
      <div className="grid gap-2 sm:grid-cols-2 text-xs text-ctrl-text2 leading-relaxed">
        <div className="py-2 px-2.5 bg-ctrl-panel/60 border border-ctrl-border">
          <span className="block font-mono text-[8px] tracking-[1.5px] uppercase text-ctrl-text mb-1">
            Push
          </span>
          Upozornění mimo portál. Nejdřív klikni na{' '}
          <span className="text-ctrl-text">Povolit upozornění</span> v sekci níže a potvrď to
          v prohlížeči.
        </div>
        <div className="py-2 px-2.5 bg-ctrl-panel/60 border border-ctrl-border">
          <span className="block font-mono text-[8px] tracking-[1.5px] uppercase text-ctrl-text mb-1">
            In-app
          </span>
          Zobrazení ve zvonečku v hlavičce portálu, když jsi na webu přihlášený. Funguje
          nezávisle na push.
        </div>
      </div>
      <p className="text-[11px] text-ctrl-text3 mt-3 leading-relaxed font-mono tracking-wide">
        Tip: Nejdřív povol push na zařízení, pak si zapni konkrétní typy oznámení.
      </p>
    </div>
  )
}

function ToggleSwitch({ checked, disabled, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative shrink-0 w-10 h-[22px] rounded-full border transition-colors duration-200',
        checked
          ? 'bg-ctrl-accent border-ctrl-accent'
          : 'bg-ctrl-bg2 border-ctrl-border',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && 'cursor-pointer hover:border-ctrl-accent/60',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-[18px]',
        )}
      />
    </button>
  )
}

function NotificationTypeRow({
  label,
  description,
  pushOnly,
  pushChecked,
  inappChecked,
  pushDisabled,
  inappDisabled,
  onPushChange,
  onInappChange,
}) {
  return (
    <div className="py-3.5 border-b border-ctrl-border last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
        <div className="flex-1 min-w-[180px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-ctrl-text">{label}</span>
            {pushOnly && (
              <span className="font-mono text-[8px] tracking-[1.5px] uppercase py-0.5 px-1.5 border border-ctrl-accent/40 text-ctrl-accent bg-ctrl-accent/10">
                Jen push
              </span>
            )}
          </div>
          <p className="text-xs text-ctrl-text2 mt-1 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-5 shrink-0 pt-0.5">
          <div className="flex flex-col items-center gap-1.5 w-[52px]">
            <span
              className={cn(
                'font-mono text-[8px] tracking-[1.5px] uppercase',
                pushDisabled ? 'text-ctrl-text3' : 'text-ctrl-text2',
              )}
            >
              Push
            </span>
            <ToggleSwitch
              checked={pushChecked}
              disabled={pushDisabled}
              onChange={onPushChange}
              ariaLabel={`${label} — push`}
            />
          </div>

          <div className="flex flex-col items-center gap-1.5 w-[52px]">
            <span
              className={cn(
                'font-mono text-[8px] tracking-[1.5px] uppercase',
                inappDisabled ? 'text-ctrl-text3' : 'text-ctrl-text2',
              )}
            >
              In-app
            </span>
            {pushOnly ? (
              <span className="font-mono text-[11px] text-ctrl-text3 leading-[22px]">—</span>
            ) : (
              <ToggleSwitch
                checked={inappChecked}
                disabled={inappDisabled}
                onChange={onInappChange}
                ariaLabel={`${label} — in-app`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationSettings({ profile }) {
  const { setProfile } = useAppData()
  const [prefs, setPrefs] = useState(() =>
    Object.fromEntries(
      Object.keys(NOTIFICATION_PREF_DEFAULTS).map(key => [
        key,
        readNotificationPref(profile, key),
      ]),
    ),
  )
  const [savingKey, setSavingKey] = useState(null)
  const [error, setError] = useState('')
  const [pushActive, setPushActive] = useState(false)

  useEffect(() => {
    setPrefs(
      Object.fromEntries(
        Object.keys(NOTIFICATION_PREF_DEFAULTS).map(key => [
          key,
          readNotificationPref(profile, key),
        ]),
      ),
    )
  }, [profile])

  const updatePref = useCallback(
    async (key, nextValue) => {
      const prevValue = prefs[key]
      setPrefs(current => ({ ...current, [key]: nextValue }))
      setProfile(current => (current ? { ...current, [key]: nextValue } : current))
      setSavingKey(key)
      setError('')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [key]: nextValue })
        .eq('id', profile.id)

      setSavingKey(null)
      if (updateError) {
        setPrefs(current => ({ ...current, [key]: prevValue }))
        setProfile(current => (current ? { ...current, [key]: prevValue } : current))
        setError('Nepodařilo se uložit nastavení. Zkus to znovu.')
      }
    },
    [prefs, profile.id, setProfile],
  )

  const pushToggleDisabled = !pushActive

  return (
    <div className="bg-ctrl-panel border border-ctrl-border p-5">
      <Sec>OZNÁMENÍ</Sec>
      <p className="text-xs text-ctrl-text2 mb-4 leading-relaxed">
        Nastav si, o čem chceš být informovaný. U každého typu můžeš zapnout push (mimo portál)
        nebo in-app (zvoneček v hlavičce).
      </p>

      <NotificationHelpBox />

      <PushNotifications
        userId={profile.id}
        embedded
        onPushActiveChange={setPushActive}
      />

      <div className="h-px bg-ctrl-border my-4" />

      <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-3">
        Typy oznámení
      </div>

      <div>
        {NOTIFICATION_TYPE_OPTIONS.map(option => (
          <NotificationTypeRow
            key={option.pushKey}
            label={option.label}
            description={option.description}
            pushOnly={option.pushOnly}
            pushChecked={prefs[option.pushKey]}
            inappChecked={option.inappKey ? prefs[option.inappKey] : false}
            pushDisabled={pushToggleDisabled || savingKey === option.pushKey}
            inappDisabled={!option.inappKey || savingKey === option.inappKey}
            onPushChange={value => updatePref(option.pushKey, value)}
            onInappChange={
              option.inappKey ? value => updatePref(option.inappKey, value) : undefined
            }
          />
        ))}
      </div>

      {error && (
        <div className="text-ctrl-danger font-mono text-[11px] mt-3">// {error}</div>
      )}
    </div>
  )
}
