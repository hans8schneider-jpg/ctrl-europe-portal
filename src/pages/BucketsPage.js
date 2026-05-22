import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn, getInitials } from '../lib/utils'
import { bucketBarCls, bucketMemberAvCls, bucketOrganBadgeCls, SPECIAL_BUCKETS } from '../constants/buckets'
import { bucketPath } from '../lib/bucketSlug'
import { getAccessibleBuckets } from '../lib/permissions'
import { Sec } from '../components/ui/Sec'
import { MemberModal } from '../components/MemberModal'
import { useAppData } from '../context/AppDataContext'

export function BucketsPage() {
  const navigate = useNavigate()
  const { profile, tasks, members } = useAppData()
  const accessible = getAccessibleBuckets(profile)
  const [selectedMember, setSelectedMember] = useState(null)
  const onSelectBucket = (b) => navigate(bucketPath(b))

  return (
    <div className="animate-fade-in">
      <Sec>BUŇKY PROJEKTU</Sec>
      <div className="grid grid-cols-3 gap-3 mb-5 max-[900px]:grid-cols-2 max-[900px]:gap-2">
        {accessible.map(bucket => {
          const bucketTasks = tasks.filter(t => (t.bucket_target === bucket || t.bucket_target === 'all') && !t.done)
          const bucketMembers = members.filter(m => m.bucket === bucket || m.secondary_bucket === bucket)
          const isSpecial = SPECIAL_BUCKETS.includes(bucket)

          return (
            <div key={bucket} className="p-5 cursor-pointer bg-ctrl-panel border border-ctrl-border relative overflow-hidden transition-all duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
              onClick={() => onSelectBucket(bucket)}>
              <div className={cn('absolute top-0 left-0 right-0 h-[3px]', bucketBarCls(bucket))} />
              <div className="flex items-start justify-between mb-2">
                <div className="text-[13px] font-bold mb-1">{bucket}</div>
                {isSpecial && (
                  <span className={cn('font-mono text-[8px] py-0.5 px-1.5 tracking-wide uppercase', bucketOrganBadgeCls(bucket))}>
                    ORGÁN
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] text-ctrl-text2">{bucketTasks.length} otevřených úkolů · {bucketMembers.length} členů</div>
              <div className="flex gap-1 mt-2.5 flex-wrap">
                {bucketMembers.slice(0, 5).map(m => (
                  <div key={m.id} className={cn('w-6 h-6 flex items-center justify-center text-[9px] font-bold font-mono cursor-pointer transition-transform duration-200 hover:scale-[1.15] hover:z-[1]', bucketMemberAvCls(bucket))}
                    onClick={e => { e.stopPropagation(); setSelectedMember(m); }} title={m.name}>
                    {getInitials(m.name)}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {selectedMember && <MemberModal member={selectedMember} tasks={tasks} onClose={() => setSelectedMember(null)} />}
    </div>
  )
}
