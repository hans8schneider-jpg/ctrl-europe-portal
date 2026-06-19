export const NOTIFICATION_PREF_DEFAULTS = {
  notify_push_tasks: true,
  notify_push_news: true,
  notify_push_events: true,
  notify_push_mentions: true,
  notify_push_chat: false,
  notify_inapp_tasks: true,
  notify_inapp_news: true,
  notify_inapp_events: true,
  notify_inapp_mentions: true,
}

export const NOTIFICATION_TYPE_OPTIONS = [
  {
    pushKey: 'notify_push_tasks',
    inappKey: 'notify_inapp_tasks',
    label: 'Nové úkoly',
    description: 'Nový úkol ve tvé buňce.',
  },
  {
    pushKey: 'notify_push_news',
    inappKey: 'notify_inapp_news',
    label: 'Oznámení na dashboardu',
    description: 'Nové oznámení na dashboardu.',
  },
  {
    pushKey: 'notify_push_events',
    inappKey: 'notify_inapp_events',
    label: 'Nové akce',
    description: 'Nová akce v kalendáři.',
  },
  {
    pushKey: 'notify_push_mentions',
    inappKey: 'notify_inapp_mentions',
    label: 'Zmínky v chatu (@)',
    description: 'Když tě někdo zmíní nebo napíše @všichni.',
  },
  {
    pushKey: 'notify_push_chat',
    inappKey: null,
    label: 'Zprávy v chatu',
    description: 'Každá nová zpráva v buňce. Pouze push — ve zvonečku se nezobrazí.',
    pushOnly: true,
  },
]

const PUSH_PREF_BY_TYPE = {
  task: 'notify_push_tasks',
  news: 'notify_push_news',
  event: 'notify_push_events',
  mention: 'notify_push_mentions',
  chat: 'notify_push_chat',
}

const INAPP_PREF_BY_TYPE = {
  task: 'notify_inapp_tasks',
  news: 'notify_inapp_news',
  event: 'notify_inapp_events',
  mention: 'notify_inapp_mentions',
}

export function readNotificationPref(profile, key) {
  if (!profile || profile[key] === undefined || profile[key] === null) {
    return NOTIFICATION_PREF_DEFAULTS[key]
  }
  return Boolean(profile[key])
}

export function pushAllowedForProfile(notification, profile) {
  if (!profile || !notification) return false
  const prefKey = PUSH_PREF_BY_TYPE[notification.type]
  if (!prefKey) return true
  if (prefKey === 'notify_push_chat') {
    return profile.notify_push_chat === true
  }
  return profile[prefKey] !== false
}

export function inAppAllowedForProfile(notification, profile) {
  if (!profile || !notification) return false
  if (notification.push_only) return false
  const prefKey = INAPP_PREF_BY_TYPE[notification.type]
  if (!prefKey) return true
  return profile[prefKey] !== false
}

export function notificationVisibleInApp(notification, profile) {
  return inAppAllowedForProfile(notification, profile)
}
