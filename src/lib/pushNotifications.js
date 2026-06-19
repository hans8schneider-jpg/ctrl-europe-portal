import { supabase } from '../supabase'

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function getPushPermission() {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

async function getServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js')
  if (existing) return existing
  return navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

function subscriptionPayload(subscription, userId) {
  const json = subscription.toJSON()
  return {
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString(),
  }
}

export async function getCurrentPushSubscription() {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

export async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    return { error: new Error('Push notifikace tento prohlížeč nepodporuje') }
  }
  if (!VAPID_PUBLIC_KEY) {
    return { error: new Error('Chybí REACT_APP_VAPID_PUBLIC_KEY v konfiguraci') }
  }
  if (isIosDevice() && !isStandalonePwa()) {
    return {
      error: new Error(
        'Na iPhonu přidej portál na domovskou obrazovku (Sdílet → Přidat na plochu), pak push zapni znovu.'
      ),
    }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { error: new Error('Oprávnění k oznámením nebylo uděleno') }
  }

  const registration = await getServiceWorkerRegistration()
  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const row = subscriptionPayload(subscription, userId)
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(row, { onConflict: 'user_id,endpoint' })

  if (error) {
    return { error }
  }

  return { subscription, error: null }
}

export async function unsubscribeFromPush(userId) {
  if (!isPushSupported()) {
    return { error: new Error('Push notifikace tento prohlížeč nepodporuje') }
  }

  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = registration
    ? await registration.pushManager.getSubscription()
    : null

  if (subscription) {
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
  } else {
    await supabase.from('push_subscriptions').delete().eq('user_id', userId)
  }

  return { error: null }
}

export async function hasActivePushSubscription(userId) {
  const subscription = await getCurrentPushSubscription()
  if (!subscription) return false

  const { data } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('endpoint', subscription.endpoint)
    .maybeSingle()

  return Boolean(data)
}
