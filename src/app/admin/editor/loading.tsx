import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-2 p-2">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[calc(100vh-8rem)] w-full rounded-lg" />
      </div>
      <Skeleton className="w-72 h-[calc(100vh-4rem)] rounded-lg" />
    </div>
  )
}
