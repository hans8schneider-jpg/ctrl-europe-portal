import { useState } from 'react'
import { useParams, Navigate, useSearchParams } from 'react-router-dom'
import { cn, isUserOnline } from '../lib/utils'
import { bucketBarCls } from '../constants/buckets'
import { slugToBucket } from '../lib/bucketSlug'
import { DEVELOPERS_BUCKET, getBrowsableBuckets } from '../lib/permissions'
import { BucketMemberStrip } from '../components/BucketMemberStrip'
import { MemberModal } from '../components/MemberModal'
import { Tasks } from '../components/Tasks'
import { Chat } from '../components/Chat'
import { useAppData } from '../context/AppDataContext'

export function BucketPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, tasks, setTasks, members } = useAppData()
  const browsable = getBrowsableBuckets(profile)
  const bucket = slugToBucket(slug, browsable)
  const highlightTaskId = searchParams.get('task')
  const [view, setView] = useState('tasks')
  const [selectedMember, setSelectedMember] = useState(null)

  const clearTaskParam = () => {
    if (!searchParams.has('task')) return
    const next = new URLSearchParams(searchParams)
    next.delete('task')
    setSearchParams(next, { replace: true })
  }

  if (!bucket) return <Navigate to="/bunky" replace />

  const bucketMembers = members.filter(m => {
    if (bucket === DEVELOPERS_BUCKET) {
      return m.layer === 'developer' || (m.memberships ?? []).some(mm => mm.bucket === bucket)
    }
    return (m.memberships ?? []).some(mm => mm.bucket === bucket)
  })
  const onlineCount = bucketMembers.filter(m => isUserOnline(m.last_seen)).length

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={cn('w-1 shrink-0 self-stretch min-h-9', bucketBarCls(bucket))} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col min-[901px]:flex-row min-[901px]:items-start min-[901px]:justify-between min-[901px]:gap-5">
              <div className="min-w-0 flex-1">
                <h1
                  className="text-xl min-[901px]:text-2xl font-sans font-bold tracking-normal normal-case leading-snug break-words [overflow-wrap:anywhere]"
                  title={bucket}
                >
                  {bucket}
                </h1>
                {bucketMembers.length > 0 && (
                  <div className="mt-2.5 flex items-center justify-between gap-3 w-full">
                    <div className="font-mono text-[10px] text-ctrl-text2 tracking-[2px] uppercase flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0">
                      <span>{bucketMembers.length} členů</span>
                      <span className="text-ctrl-text3/40">·</span>
                      <span className={onlineCount > 0 ? 'text-ctrl-success' : 'text-ctrl-text3'}>
                        {onlineCount} online
                      </span>
                    </div>
                    <BucketMemberStrip
                      variant="mobile"
                      members={bucketMembers}
                      bucket={bucket}
                      onMemberClick={setSelectedMember}
                    />
                  </div>
                )}
              </div>
              <BucketMemberStrip
                variant="desktop"
                members={bucketMembers}
                bucket={bucket}
                onMemberClick={setSelectedMember}
              />
            </div>
          </div>
        </div>
      </div>
      {selectedMember && <MemberModal member={selectedMember} tasks={tasks} onClose={() => setSelectedMember(null)} />}

      <div className="flex gap-0 mb-5 border-b border-ctrl-border">
        <div className={cn('py-2.5 px-3 min-[480px]:px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', view === 'tasks' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setView('tasks')}>ÚKOLY</div>
        <div className={cn('py-2.5 px-3 min-[480px]:px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text', view === 'chat' && 'text-ctrl-accent border-b-ctrl-accent')} onClick={() => setView('chat')}>CHAT</div>
      </div>

      {view === 'tasks' && (
        <Tasks
          profile={profile}
          tasks={tasks}
          setTasks={setTasks}
          activeBucket={bucket}
          highlightTaskId={highlightTaskId}
          onHighlightTaskConsumed={clearTaskParam}
        />
      )}
      {view === 'chat' && <Chat profile={profile} activeBucket={bucket} />}
    </div>
  )
}
