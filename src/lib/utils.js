export const cn = (...parts) => parts.filter(Boolean).join(' ')

export const getInitials = (n) =>
  n ? n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() : '??'
