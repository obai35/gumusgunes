'use client'

import { ReactNode, useEffect, useState } from 'react'

interface Props {
  setting: string
  children: ReactNode
}

export function VisibilityGate({ setting, children }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = document.getElementById('__PREVIEW_DATA')
    if (el) {
      try {
        const data = JSON.parse(el.textContent || '{}')
        setVisible(data[setting] !== 'hidden')
        return
      } catch {}
    }
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(data => {
        setVisible(data[setting] !== 'hidden')
      })
      .catch(() => {})
  }, [setting])

  if (!visible) return null
  return <>{children}</>
}
