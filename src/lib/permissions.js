import { ALL_BUCKETS, SPECIAL_BUCKETS, TEAM_BUCKETS, bucketOrganBadgeCls } from '../constants/buckets'
import { roleBadgeCls } from '../constants/roles'

/** Předsednictvo apod. v týmové buňce → štítek „Člen · {buňka}“ */
const LAYERS_WITH_CLEN_TEAM_MEMBERSHIP = [
  'admin',
  'developer',
  'predsednictvo',
  'zastupce_predsednictva',
]

export const getTeamBucketBadgeDisplay = (memberLayer, bucket) => {
  if (LAYERS_WITH_CLEN_TEAM_MEMBERSHIP.includes(memberLayer)) {
    return { label: `Člen · ${bucket}`, className: roleBadgeCls('clen') }
  }
  return { label: bucket, className: bucketOrganBadgeCls(bucket) }
}

export const canAddTasks = (role) => ['admin', 'vedouci'].includes(role)
export const canSeeAllBuckets = (role) => role === 'admin'
export const canObserveAll = (role) => ['admin', 'pozorovatel'].includes(role)
export const isAdmin = (role) => role === 'admin'
export const isDeveloper = (role) => role === 'developer'
export const canAccessAdminPanel = (role) => ['admin', 'developer'].includes(role)

/** Předsednictvo / zástupci / admin vidí organizační buňky na profilech ostatních */
export const canSeeMemberOrganBuckets = (layer) =>
  ['admin', 'developer', 'predsednictvo', 'zastupce_predsednictva'].includes(layer)

/** Textová role v buňce (profiles.role) — člen/vedoucí/pozorovatel jen u člena a vedoucího */
export const canSeeMemberBucketRole = (viewerLayer, memberLayer) => {
  if (canSeeMemberOrganBuckets(viewerLayer)) return true
  return ['clen', 'vedouci'].includes(memberLayer)
}

const profileBuckets = (p) =>
  [p?.bucket, p?.secondary_bucket].filter(Boolean)

export const memberSharesBucketWith = (viewer, member) => {
  const viewerBuckets = profileBuckets(viewer)
  const memberBuckets = profileBuckets(member)
  return viewerBuckets.some(b => memberBuckets.includes(b))
}

/** Textová role v buňce (profiles.role) — ne člen/pozorovatel; vedoucí jen ve své buňce */
export const canEditMemberBucketRole = (viewer, member) => {
  if (!viewer || !member || viewer.id === member.id) return false
  if (['clen', 'pozorovatel'].includes(viewer.layer)) return false
  if (['admin', 'developer', 'predsednictvo', 'zastupce_predsednictva'].includes(viewer.layer)) {
    return true
  }
  if (viewer.layer === 'vedouci') return memberSharesBucketWith(viewer, member)
  return false
}

export function getMemberBucketsForDisplay(member, viewerLayer) {
  const assigned = [member.bucket, member.secondary_bucket].filter(Boolean)
  const teamBuckets = assigned.filter(b => TEAM_BUCKETS.includes(b))
  const organBuckets = assigned.filter(b => SPECIAL_BUCKETS.includes(b))
  const showOrgan = canSeeMemberOrganBuckets(viewerLayer)
  const visibleOrgan = showOrgan ? organBuckets : []
  const visible = [...teamBuckets, ...visibleOrgan]

  const pickAvatarBucket = () => {
    if (teamBuckets.length) return teamBuckets[0]
    if (visibleOrgan.length) return visibleOrgan[0]
    const primary = member.bucket
    if (primary && !SPECIAL_BUCKETS.includes(primary)) return primary
    const secondary = member.secondary_bucket
    if (secondary && !SPECIAL_BUCKETS.includes(secondary)) return secondary
    return null
  }

  return {
    teamBuckets,
    organBuckets: visibleOrgan,
    hasVisibleBuckets: visible.length > 0,
    avatarBucket: pickAvatarBucket(),
  }
}

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
