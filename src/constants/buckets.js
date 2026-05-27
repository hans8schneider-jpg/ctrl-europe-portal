export const TEAM_BUCKETS = [
  'PR a komunikace', 'Sociální sítě', 'Podcast', 'Research',
  'Grafika', 'Video', 'Mezinárodní', 'Eventy', 'TikTok',
]

export const SPECIAL_BUCKETS = ['Rada zástupců', 'Předsednictvo', 'Developeři']

export const ALL_BUCKETS = [...TEAM_BUCKETS, ...SPECIAL_BUCKETS]

export const BUCKET_AV_CLS = {
  'PR a komunikace': 'bg-[rgba(42,107,255,0.15)] border border-[rgba(42,107,255,0.31)] text-[#2A6BFF]',
  'Sociální sítě': 'bg-[rgba(255,184,0,0.15)] border border-[rgba(255,184,0,0.31)] text-[#ffb800]',
  'Podcast': 'bg-[rgba(180,79,255,0.15)] border border-[rgba(180,79,255,0.31)] text-[#b44fff]',
  'Research': 'bg-[rgba(0,201,255,0.15)] border border-[rgba(0,201,255,0.31)] text-[#00c9ff]',
  'Grafika': 'bg-[rgba(255,107,53,0.15)] border border-[rgba(255,107,53,0.31)] text-[#ff6b35]',
  'Video': 'bg-[rgba(255,51,102,0.15)] border border-[rgba(255,51,102,0.31)] text-ctrl-danger',
  'Mezinárodní': 'bg-[rgba(0,229,160,0.15)] border border-[rgba(0,229,160,0.31)] text-ctrl-success',
  'Eventy': 'bg-[rgba(0,229,160,0.15)] border border-[rgba(0,229,160,0.31)] text-ctrl-success',
  'TikTok': 'bg-[rgba(37,244,238,0.15)] border border-[rgba(37,244,238,0.31)] text-[#25f4ee]',
  'Developeři': 'bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.31)] text-ctrl-info',
  'Rada zástupců': 'bg-[rgba(255,184,0,0.15)] border border-[rgba(255,184,0,0.31)] text-[#ffb800]',
  'Předsednictvo': 'bg-[rgba(180,79,255,0.15)] border border-[rgba(180,79,255,0.31)] text-[#b44fff]',
}

export const bucketAvCls = (bucket) =>
  BUCKET_AV_CLS[bucket] || 'bg-[rgba(42,107,255,0.15)] border border-[rgba(42,107,255,0.31)] text-ctrl-accent'

export const BUCKET_DOT_CLS = {
  'PR a komunikace': 'bg-[#2A6BFF]',
  'Sociální sítě': 'bg-[#ffb800]',
  'Podcast': 'bg-[#b44fff]',
  'Research': 'bg-[#00c9ff]',
  'Grafika': 'bg-[#ff6b35]',
  'Video': 'bg-[#ff3366]',
  'Mezinárodní': 'bg-[#00e5a0]',
  'Eventy': 'bg-[#00e5a0]',
  'TikTok': 'bg-[#25f4ee]',
  'Developeři': 'bg-[#00d4ff]',
  'Rada zástupců': 'bg-[#ffb800]',
  'Předsednictvo': 'bg-[#b44fff]',
}

export const bucketDotCls = (bucket) => BUCKET_DOT_CLS[bucket] || 'bg-ctrl-accent'
export const bucketBarCls = (bucket) => BUCKET_DOT_CLS[bucket] || 'bg-ctrl-accent'

export const BUCKET_MEMBER_AV_CLS = {
  'PR a komunikace': 'bg-[rgba(42,107,255,0.13)] border border-[rgba(42,107,255,0.27)] text-[#2A6BFF]',
  'Sociální sítě': 'bg-[rgba(255,184,0,0.13)] border border-[rgba(255,184,0,0.27)] text-[#ffb800]',
  'Podcast': 'bg-[rgba(180,79,255,0.13)] border border-[rgba(180,79,255,0.27)] text-[#b44fff]',
  'Research': 'bg-[rgba(0,201,255,0.13)] border border-[rgba(0,201,255,0.27)] text-[#00c9ff]',
  'Grafika': 'bg-[rgba(255,107,53,0.13)] border border-[rgba(255,107,53,0.27)] text-[#ff6b35]',
  'Video': 'bg-[rgba(255,51,102,0.13)] border border-[rgba(255,51,102,0.27)] text-[#ff3366]',
  'Mezinárodní': 'bg-[rgba(0,229,160,0.13)] border border-[rgba(0,229,160,0.27)] text-[#00e5a0]',
  'Eventy': 'bg-[rgba(0,229,160,0.13)] border border-[rgba(0,229,160,0.27)] text-[#00e5a0]',
  'TikTok': 'bg-[rgba(37,244,238,0.13)] border border-[rgba(37,244,238,0.27)] text-[#25f4ee]',
  'Developeři': 'bg-[rgba(0,212,255,0.13)] border border-[rgba(0,212,255,0.27)] text-[#00d4ff]',
  'Rada zástupců': 'bg-[rgba(255,184,0,0.13)] border border-[rgba(255,184,0,0.27)] text-[#ffb800]',
  'Předsednictvo': 'bg-[rgba(180,79,255,0.13)] border border-[rgba(180,79,255,0.27)] text-[#b44fff]',
}

export const bucketMemberAvCls = (bucket) =>
  BUCKET_MEMBER_AV_CLS[bucket] || 'bg-[rgba(42,107,255,0.13)] border border-[rgba(42,107,255,0.27)] text-ctrl-accent'

/** Leader avatar highlight (border + glow) in menus */
export const BUCKET_LEADER_RING_CLS = {
  'PR a komunikace': 'border-[#2A6BFF] shadow-[0_0_0_1px_rgba(42,107,255,0.5)]',
  'Sociální sítě': 'border-[#ffb800] shadow-[0_0_0_1px_rgba(255,184,0,0.5)]',
  'Podcast': 'border-[#b44fff] shadow-[0_0_0_1px_rgba(180,79,255,0.5)]',
  'Research': 'border-[#00c9ff] shadow-[0_0_0_1px_rgba(0,201,255,0.5)]',
  'Grafika': 'border-[#ff6b35] shadow-[0_0_0_1px_rgba(255,107,53,0.55)]',
  'Video': 'border-[#ff3366] shadow-[0_0_0_1px_rgba(255,51,102,0.5)]',
  'Mezinárodní': 'border-[#00e5a0] shadow-[0_0_0_1px_rgba(0,229,160,0.45)]',
  'Eventy': 'border-[#00e5a0] shadow-[0_0_0_1px_rgba(0,229,160,0.45)]',
  'TikTok': 'border-[#25f4ee] shadow-[0_0_0_1px_rgba(37,244,238,0.45)]',
  'Developeři': 'border-[#00d4ff] shadow-[0_0_0_1px_rgba(0,212,255,0.45)]',
  'Rada zástupců': 'border-[#ffb800] shadow-[0_0_0_1px_rgba(255,184,0,0.5)]',
  'Předsednictvo': 'border-[#b44fff] shadow-[0_0_0_1px_rgba(180,79,255,0.5)]',
}

export const bucketLeaderRingCls = (bucket) =>
  BUCKET_LEADER_RING_CLS[bucket] || 'border-ctrl-accent shadow-[0_0_0_1px_rgba(42,107,255,0.5)]'

export const BUCKET_ORGAN_BADGE_CLS = {
  'PR a komunikace': 'bg-[rgba(42,107,255,0.13)] text-[#2A6BFF]',
  'Sociální sítě': 'bg-[rgba(255,184,0,0.13)] text-[#ffb800]',
  'Podcast': 'bg-[rgba(180,79,255,0.13)] text-[#b44fff]',
  'Research': 'bg-[rgba(0,201,255,0.13)] text-[#00c9ff]',
  'Grafika': 'bg-[rgba(255,107,53,0.13)] text-[#ff6b35]',
  'Video': 'bg-[rgba(255,51,102,0.13)] text-[#ff3366]',
  'Mezinárodní': 'bg-[rgba(0,229,160,0.13)] text-[#00e5a0]',
  'Eventy': 'bg-[rgba(0,229,160,0.13)] text-[#00e5a0]',
  'TikTok': 'bg-[rgba(37,244,238,0.13)] text-[#25f4ee]',
  'Developeři': 'bg-[rgba(0,212,255,0.13)] text-[#00d4ff]',
  'Rada zástupců': 'bg-[rgba(255,184,0,0.13)] text-[#ffb800]',
  'Předsednictvo': 'bg-[rgba(180,79,255,0.13)] text-[#b44fff]',
}

export const bucketOrganBadgeCls = (bucket) =>
  BUCKET_ORGAN_BADGE_CLS[bucket] || 'bg-[rgba(42,107,255,0.13)] text-ctrl-accent'
