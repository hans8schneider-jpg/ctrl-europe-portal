import { ALL_BUCKETS, SPECIAL_BUCKETS, TEAM_BUCKETS } from '../constants/buckets'

export const canAddTasks = (role) => ['admin', 'vedouci'].includes(role)
export const canSeeAllBuckets = (role) => role === 'admin'
export const canObserveAll = (role) => ['admin', 'pozorovatel'].includes(role)
export const isAdmin = (role) => role === 'admin'
export const isDeveloper = (role) => role === 'developer'
export const canAccessAdminPanel = (role) => ['admin', 'developer'].includes(role)

export const getAccessibleBuckets = (profile) => {
  if (!profile) return []
  const { layer, bucket, secondary_bucket } = profile
  if (layer === 'admin') return ALL_BUCKETS
  if (layer === 'pozorovatel') return TEAM_BUCKETS
  const buckets = [bucket]
  if (secondary_bucket) buckets.push(secondary_bucket)
  if (layer === 'vedouci') buckets.push('Rada zástupců')
  if (layer === 'predsednictvo' || layer === 'zastupce_predsednictva') buckets.push('Předsednictvo')
  return [...new Set(buckets)]
}
