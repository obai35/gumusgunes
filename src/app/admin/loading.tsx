import { SkeletonChart, SkeletonStatsGrid } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SkeletonChart />
      </div>
      <SkeletonStatsGrid count={4} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  )
}
