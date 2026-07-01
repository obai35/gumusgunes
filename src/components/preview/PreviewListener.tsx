'use client'

import { useEffect } from 'react'

const CSS_VAR_MAP: Record<string, string> = {
  primaryColor: '--color-navy',
  accentColor: '--color-gold',
  bgColor: '--color-background',
  textColor: '--color-foreground',
  primaryFont: '--font-sans',
  headingFont: '--font-display',
}

export function PreviewListener() {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'settings-update') {
        const { key, value } = event.data
        const cssVar = CSS_VAR_MAP[key as string]
        if (cssVar) {
          document.documentElement.style.setProperty(cssVar, value as string)
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])
  return null
}
