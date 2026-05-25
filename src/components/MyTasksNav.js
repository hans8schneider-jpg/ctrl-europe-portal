import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../lib/utils'
import { getMyAssignedOpenTasks } from '../lib/tasks'
import { useAppData } from '../context/AppDataContext'
import { IconTasks } from './icons/NavIcons'

export function MyTasksNav({ variant = 'sidebar', onNavigate, navLinkCls }) {
  const { profile, tasks } = useAppData()
  const count = useMemo(
    () => getMyAssignedOpenTasks(tasks, profile).length,
    [tasks, profile]
  )
  const isSidebar = variant === 'sidebar'

  const linkCls = ({ isActive }) =>
    navLinkCls
      ? navLinkCls({ isActive })
      : cn(
          'flex items-center gap-2.5 border-l-2 border-transparent transition-all duration-200 relative',
          isSidebar
            ? 'py-2.5 px-5 text-ctrl-text2 text-xs font-semibold tracking-wide uppercase hover:text-ctrl-text hover:bg-[rgba(255,184,0,0.06)] hover:translate-x-0.5'
            : 'py-3.5 px-3 rounded-lg text-[15px] font-semibold text-ctrl-text hover:bg-[rgba(255,184,0,0.06)] active:bg-[rgba(255,184,0,0.08)]',
          isActive &&
            (isSidebar
              ? 'text-ctrl-warning border-l-ctrl-warning bg-[rgba(255,184,0,0.08)]'
              : 'text-ctrl-warning bg-[rgba(255,184,0,0.08)]')
        )

  return (
    <NavLink
      to="/moje-ukoly"
      className={props => cn(isSidebar && 'relative', linkCls(props))}
      onClick={() => onNavigate?.()}
    >
      <IconTasks
        className={isSidebar ? 'w-[18px] h-[18px] shrink-0' : 'w-5 h-5 shrink-0 text-ctrl-warning'}
      />
      <span className={isSidebar ? '' : 'flex-1'}>Moje úkoly</span>
      {count > 0 && (
        <span
          className={cn(
            'font-mono tabular-nums shrink-0 flex items-center justify-center rounded-lg text-white bg-ctrl-warning',
            isSidebar
              ? 'absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] min-w-4 h-4 animate-badge-pop'
              : 'text-[9px] min-w-5 h-5 px-1'
          )}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </NavLink>
  )
}
