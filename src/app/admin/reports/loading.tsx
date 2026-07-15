import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="flex gap-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
