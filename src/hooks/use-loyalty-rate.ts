'use client'

import { useState, useEffect } from 'react'

const DEFAULT_RATE = 100

let cachedRate: number | null = null
let cachePromise: Promise<number> | null = null

function fetchRate(): Promise<number> {
  if (cachedRate !== null) return Promise.resolve(cachedRate)
  if (cachePromise) return cachePromise
  cachePromise = fetch('/api/site-settings?nocache=1')
    .then(r => r.json())
    .then(data => {
      cachedRate = parseInt(data.settings?.loyaltyPointsRate, 10) || DEFAULT_RATE
      return cachedRate
    })
    .catch(() => DEFAULT_RATE)
  return cachePromise
}

export function useLoyaltyRate(): number {
  const [rate, setRate] = useState(DEFAULT_RATE)

  useEffect(() => {
    if (cachedRate !== null) {
      setRate(cachedRate)
      return
    }
    fetchRate().then(setRate)
  }, [])

  return rate
}
