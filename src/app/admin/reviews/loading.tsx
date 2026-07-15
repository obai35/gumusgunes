import { Skeleton, SkeletonReviewCard } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonReviewCard key={i} />
        ))}
      </div>
    </div>
  )
}
