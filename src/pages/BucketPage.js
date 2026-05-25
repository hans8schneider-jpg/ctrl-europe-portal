import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { bucketBarCls } from '../constants/buckets'
import { slugToBucket } from '../lib/bucketSlug'
import { getAccessibleBuckets } from '../lib/permissions'
import { BucketMemberStrip } from '../components/BucketMemberStrip'
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
      <div className="flex items-start gap-3.5 mb-5">
        <div className={cn('w-1 h-9 shrink-0', bucketBarCls(bucket))} />
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-sans font-bold tracking-normal normal-case">{bucket}</div>
          <div className="font-mono text-[10px] text-ctrl-text2 tracking-[2px] uppercase">
            {bucketMembers.length} členů
          </div>
        </div>
        <BucketMemberStrip
          members={bucketMembers}
          bucket={bucket}
          onMemberClick={setSelectedMember}
        />
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
