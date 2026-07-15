import { Skeleton, SkeletonChart, SkeletonStatsGrid } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonStatsGrid count={4} />
      <SkeletonChart />
      <SkeletonChart />
    </div>
  )
}
