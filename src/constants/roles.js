export const ROLE_HIERARCHY = {
  admin: 6,
  developer: 5,
  predsednictvo: 5,
  zastupce_predsednictva: 4,
  vedouci: 3,
  clen: 2,
  pozorovatel: 1,
}

export const ROLE_LABELS = {
  admin: 'Admin',
  developer: 'Developer',
  predsednictvo: 'Předsednictvo',
  zastupce_predsednictva: 'Zástupce předsednictva',
  vedouci: 'Vedoucí buňky',
  clen: 'Člen',
  pozorovatel: 'Pozorovatel',
}

export const ROLE_BADGE_CLS = {
  admin: 'bg-[rgba(255,51,102,0.12)] text-ctrl-danger',
  developer: 'bg-[rgba(0,212,255,0.12)] text-ctrl-info',
  predsednictvo: 'bg-[rgba(180,79,255,0.12)] text-[#b44fff]',
  zastupce_predsednictva: 'bg-[rgba(119,68,255,0.12)] text-[#7744ff]',
  vedouci: 'bg-[rgba(42,107,255,0.12)] text-ctrl-accent',
  clen: 'bg-[rgba(0,229,160,0.12)] text-ctrl-success',
  pozorovatel: 'bg-ctrl-panel2 text-ctrl-text2',
}

export const roleBadgeCls = (layer) => ROLE_BADGE_CLS[layer] || ROLE_BADGE_CLS.clen
