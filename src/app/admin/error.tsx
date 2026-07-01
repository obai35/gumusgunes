'use client'

import { useEffect } from 'react'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Admin error caught by boundary:', error)
  }, [error])

  return (
    <div className="p-8 text-center">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"
      >
        Try again
      </button>
    </div>
  )
}
