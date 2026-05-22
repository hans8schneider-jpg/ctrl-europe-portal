import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { cn, getInitials } from '../lib/utils'
import { bucketBarCls, bucketMemberAvCls } from '../constants/buckets'
import { slugToBucket } from '../lib/bucketSlug'
import { getAccessibleBuckets } from '../lib/permissions'
import { MemberModal } from '../components/MemberModal'
import { Tasks } from '../components/Tasks'
import { Chat } from '../components/Chat'
import { useAppData } from '../context/AppDataContext'

export function BucketPage() {
  const { slug } = useParams()
  const { profile, tasks, setTasks, members } = useAppData()
  const accessible = getAccessibleBuckets(profile)
  const bucket = slugToBucket(slug, accessible)
  const [view, setView] = useState('tasks')
  const [selectedMember, setSelectedMember] = useState(null)

  if (!bucket) return <Navigate to="/bunky" replace />

  const bucketMembers = members.filter(m => m.bucket === bucket || m.secondary_bucket === bucket)
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3.5 mb-5">
        <div className={cn('w-1 h-9 shrink-0', bucketBarCls(bucket))} />
        <div>
          <div className="text-xl font-extrabold">{bucket}</div>
          <div className="font-mono text-[10px] text-ctrl-text2 tracking-[2px] uppercase">
            {bucketMembers.length} členů
          </div>
        </div>
        <div className="flex gap-1 ml-auto flex-wrap">
          {bucketMembers.slice(0, 6).map(m => (
            <div key={m.id} className={cn('w-6 h-6 flex items-center justify-center text-[9px] font-bold font-mono cursor-pointer transition-transform duration-200 hover:scale-[1.15] hover:z-[1]', bucketMemberAvCls(bucket))}
              onClick={() => setSelectedMember(m)} title={m.name}>
              {getInitials(m.name)}
            </div>
          ))}
        </div>
      </div>
      {selectedMember && <MemberModal member={selectedMember} tasks={tasks} onClose={() => setSelectedMember(null)} />}

      <div className="flex gap-0 mb-5 border-b border-ctrl-border">
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', view === 'tasks' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setView('tasks')}>ÚKOLY</div>
        <div className={cn('py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', view === 'chat' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setView('chat')}>CHAT</div>
      </div>

      {view === 'tasks' && <Tasks profile={profile} tasks={tasks} setTasks={setTasks} activeBucket={bucket} />}
      {view === 'chat' && <Chat profile={profile} activeBucket={bucket} />}
    </div>
  )
}
