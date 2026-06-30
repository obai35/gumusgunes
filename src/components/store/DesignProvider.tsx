'use client'

import { useEffect, useState } from 'react'

const DEFAULTS: Record<string, string> = {
  primaryFont: "'Inter', sans-serif",
  headingFont: "'Playfair Display', serif",
  primaryColor: '#0a1628',
  accentColor: '#c9a84c',
  bgColor: '#ffffff',
  textColor: '#1a1a2e',
}

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(d => {
        if (!d.ok) return
        const s = d.settings
        const root = document.documentElement
        root.style.setProperty('--font-sans', s.primaryFont || DEFAULTS.primaryFont)
        root.style.setProperty('--font-display', s.headingFont || DEFAULTS.headingFont)
        root.style.setProperty('--color-navy', s.primaryColor || DEFAULTS.primaryColor)
        root.style.setProperty('--color-gold', s.accentColor || DEFAULTS.accentColor)
        root.style.setProperty('--color-background', s.bgColor || DEFAULTS.bgColor)
        root.style.setProperty('--color-foreground', s.textColor || DEFAULTS.textColor)
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) return <>{children}</>
  return <>{children}</>
}
