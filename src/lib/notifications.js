import { supabase } from '../supabase'

export function notificationVisibleToProfile(notification, profile) {
  if (!profile || !notification) return false
  const target = notification.bucket_target
  if (!target || target === 'all') return true
  const buckets = [profile.bucket, profile.secondary_bucket].filter(Boolean)
  return buckets.includes(target)
}

export async function createNotification({ type, title, body, bucket_target, ref_id, created_by }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      type,
      title,
      body: body || null,
      bucket_target: bucket_target || null,
      ref_id: ref_id != null ? String(ref_id) : null,
      created_by: created_by || null,
    }])
    .select()
    .single()

  if (error) {
    console.error('[notifications] insert failed:', error.message, error)
    return { data: null, error }
  }

  if (data && created_by) {
    const { error: readError } = await markNotificationsRead([data.id], created_by)
    if (readError) console.error('[notifications] mark read failed:', readError.message, readError)
  }

  return { data, error: null }
}

export async function markNotificationsRead(notificationIds, userId) {
  if (!notificationIds?.length || !userId) return { error: null }
  const rows = notificationIds.map(notification_id => ({
    notification_id,
    user_id: userId,
    read_at: new Date().toISOString(),
  }))
  return supabase
    .from('notification_reads')
    .upsert(rows, { onConflict: 'notification_id,user_id' })
}

export async function fetchNotificationsForUser(userId) {
  const [{ data: rows, error: notificationsError }, { data: reads, error: readsError }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', userId),
  ])

  if (notificationsError) {
    console.error('[notifications] fetch failed:', notificationsError.message, notificationsError)
    return { data: [], error: notificationsError }
  }
  if (readsError) {
    console.error('[notifications] reads fetch failed:', readsError.message, readsError)
  }

  const readIds = new Set((reads || []).map(r => String(r.notification_id)))
  const mapped = (rows || []).map(notification => ({
    ...notification,
    read: readIds.has(String(notification.id)),
  }))

  return { data: mapped, error: null }
}

export function buildTaskNotification(task) {
  return {
    type: 'task',
    title: `Nový úkol: ${task.name}`,
    body: task.bucket_target && task.bucket_target !== 'all'
      ? `Buňka ${task.bucket_target}`
      : 'Nový úkol v portálu',
    bucket_target: task.bucket_target === 'all' ? null : task.bucket_target,
    ref_id: task.id != null ? String(task.id) : null,
  }
}

export function buildNewsNotification(news) {
  return {
    type: 'news',
    title: `Nové oznámení: ${news.title}`,
    body: news.body,
    bucket_target: null,
    ref_id: news.id != null ? String(news.id) : null,
  }
}

export function buildEventNotification(event) {
  const when = [event.date, event.time].filter(Boolean).join(' · ')
  return {
    type: 'event',
    title: `Nová akce: ${event.title}`,
    body: when || event.description || null,
    bucket_target: null,
    ref_id: event.id != null ? String(event.id) : null,
  }
}
