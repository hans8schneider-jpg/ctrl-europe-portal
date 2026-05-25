import { ALL_BUCKETS } from '../constants/buckets'

const stripDiacritics = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const bucketToSlug = (bucket) =>
  stripDiacritics(bucket)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const slugToBucket = (slug, buckets = ALL_BUCKETS) =>
  buckets.find((b) => bucketToSlug(b) === slug) ?? null

export const bucketPath = (bucket) => `/bunka/${bucketToSlug(bucket)}`

export const bucketTaskPath = (bucket, taskId) => {
  const base = bucketPath(bucket)
  if (!taskId) return base
  return `${base}?task=${encodeURIComponent(taskId)}`
}
