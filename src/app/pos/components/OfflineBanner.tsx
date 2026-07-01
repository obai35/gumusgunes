'use client'
import { useState, useEffect } from 'react'
import { isOnline, onOnlineChange } from '@/lib/offline'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!isOnline())
    return onOnlineChange((online) => setOffline(!online))
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-center py-1.5 text-xs font-medium">
      You are offline. Orders will be queued and synced when back online.
    </div>
  )
}
