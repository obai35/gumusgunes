'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }

    setLoading(true)
    setProgress(20)

    const ids: ReturnType<typeof setTimeout>[] = []

    ids.push(setTimeout(() => setProgress(70), 100))
    ids.push(setTimeout(() => setProgress(85), 400))
    ids.push(setTimeout(() => {
      setProgress(100)
      ids.push(setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 200))
    }, 600))

    return () => { ids.forEach(clearTimeout) }
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
