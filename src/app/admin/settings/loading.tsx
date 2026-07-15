import { Skeleton, SkeletonForm } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <Skeleton className="h-8 w-48" />
      <SkeletonForm fields={4} />
    </div>
  )
}
