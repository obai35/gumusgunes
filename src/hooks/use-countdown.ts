'use client'

import { useState, useEffect } from 'react'

export function useCountdown(target: Date | number) {
  const targetTime = typeof target === 'number' ? target : target.getTime()
  const [now, setNow] = useState<number>(0)

  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const diff = Math.max(0, targetTime - now)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  const isExpired = diff === 0

  return { days, hours, minutes, seconds, isExpired, diff }
}
