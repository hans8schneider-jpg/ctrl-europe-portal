const iconCls = 'w-[18px] h-[18px] shrink-0'

function Icon({ children, className = iconCls }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IconDashboard({ className }) {
  return (
    <Icon className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  )
}

export function IconCells({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z" />
      <circle cx="12" cy="12" r="2.5" />
    </Icon>
  )
}

export function IconProfile({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" />
    </Icon>
  )
}

export function IconAdmin({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Icon>
  )
}

export function IconReport({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </Icon>
  )
}

export function IconArrowLeft({ className = 'w-4 h-4' }) {
  return (
    <Icon className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Icon>
  )
}

export function IconMenu({ className = 'w-5 h-5' }) {
  return (
    <Icon className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

export function IconTasks({ className }) {
  return (
    <Icon className={className}>
      <path d="M9 11l2 2 4-4" />
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
  )
}

export function IconBell({ className }) {
  return (
    <Icon className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </Icon>
  )
}
