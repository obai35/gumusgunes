'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setLoading(true)
    setProgress(20)
    const fast = setTimeout(() => setProgress(70), 100)
    const slow = setTimeout(() => setProgress(85), 400)

    const done = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 200)
    }, 600)

    return () => { clearTimeout(fast); clearTimeout(slow); clearTimeout(done) }
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-muted">
      <div
        className="h-full bg-gradient-to-r from-gold to-navy transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
