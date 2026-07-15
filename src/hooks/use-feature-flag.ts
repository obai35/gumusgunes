'use client'

import { useState, useEffect } from 'react'

export function useFeatureFlag(key: string): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/system/feature-flags?key=${encodeURIComponent(key)}`)
      .then(r => r.json())
      .then(data => setEnabled(data.enabled ?? false))
      .catch(() => setEnabled(false))
  }, [key])

  return enabled
}
