import { Skeleton, SkeletonList } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonList rows={8} />
    </div>
  )
}
