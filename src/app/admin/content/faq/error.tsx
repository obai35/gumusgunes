'use client'
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="p-6 text-center"><p className="text-red-600 mb-4">Failed to load FAQ entries</p><button onClick={reset} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm">Retry</button></div>
}
