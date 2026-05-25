import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sec } from '../components/ui/Sec'
import { cn } from '../lib/utils'
import { bucketTaskPath } from '../lib/bucketSlug'
import {
  PRIORITY_LABELS,
  getMyAssignedOpenTasks,
  getTaskBucket,
} from '../lib/tasks'
import { tagCls, priorityCls } from '../constants/styles'
import { useAppData } from '../context/AppDataContext'

const TAG_LABELS = {
  other: 'Obecné',
  podcast: 'Podcast',
  research: 'Research',
  social: 'Social',
  event: 'Event',
}

function MyTaskRow({ task, profile, onOpen }) {
  const tagLabel = TAG_LABELS[task.tag] || task.tag
  const priorityLabel = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.normal
  const bucket = getTaskBucket(task, profile.bucket)

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group py-4 px-5 flex items-start gap-3.5 mb-2.5 rounded-md border transition-all duration-200 cursor-pointer',
        'bg-ctrl-panel border-ctrl-border border-l-[3px] border-l-ctrl-warning hover:border-ctrl-border2',
        'hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
      )}
      onClick={() => onOpen(task)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(task)
        }
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold leading-snug text-ctrl-text group-hover:text-white transition-colors duration-200 mb-1">
          {task.name}
        </div>
        {task.description && (
          <p className="text-[12px] leading-relaxed text-ctrl-text2 line-clamp-2 mb-2">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-ctrl-text2 tracking-wide">
          {bucket && (
            <span>
              <span className="text-ctrl-text3 uppercase text-[9px] mr-1">Buňka</span>
              {bucket}
            </span>
          )}
          {task.due && (
            <span>
              <span className="text-ctrl-text3 uppercase text-[9px] mr-1">Termín</span>
              {task.due}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0 mt-0.5">
        {task.priority && task.priority !== 'normal' && (
          <span className={priorityCls[task.priority] || priorityCls.normal}>{priorityLabel}</span>
        )}
        <span className={tagCls[task.tag] || tagCls.other}>{tagLabel}</span>
      </div>
    </div>
  )
}

export function MyTasksPage() {
  const navigate = useNavigate()
  const { profile, tasks } = useAppData()
  const myOpenTasks = useMemo(
    () => getMyAssignedOpenTasks(tasks, profile),
    [tasks, profile]
  )

  const openTask = (task) => {
    const bucket = getTaskBucket(task, profile.bucket)
    if (!bucket) return
    navigate(bucketTaskPath(bucket, task.id))
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <Sec className="!mb-2">Moje úkoly</Sec>
      <p className="text-[13px] text-ctrl-text2 mb-6">
        Otevřené úkoly přiřazené tobě. Kliknutím otevřeš detail v buňce.
      </p>

      {myOpenTasks.length > 0 ? (
        <>
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-ctrl-text3 mb-4">
            {myOpenTasks.length}{' '}
            {myOpenTasks.length === 1 ? 'úkol' : myOpenTasks.length < 5 ? 'úkoly' : 'úkolů'}
          </div>
          {myOpenTasks.map(task => (
            <MyTaskRow key={task.id} task={task} profile={profile} onOpen={openTask} />
          ))}
        </>
      ) : (
        <div className="py-12 px-6 text-center rounded-md border border-dashed border-ctrl-warning/30 bg-[rgba(255,184,0,0.04)]">
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-ctrl-warning mb-2">
            Žádné přiřazené úkoly
          </div>
          <p className="text-[13px] text-ctrl-text2">
            Vedoucí ti zatím nepřiřadil žádný otevřený úkol.
          </p>
        </div>
      )}
    </div>
  )
}
