'use client'

import { useEffect, useState, createContext, useContext } from 'react'

const DEFAULTS: Record<string, string> = {
  primaryFont: "'Inter', sans-serif",
  headingFont: "'Playfair Display', serif",
  primaryColor: '#0a1628',
  accentColor: '#c9a84c',
  bgColor: '#ffffff',
  textColor: '#1a1a2e',
}

type SettingsContext = { settings: Record<string, string> }
const SiteSettingsContext = createContext<SettingsContext>({ settings: {} })
export const useSiteSettings = () => useContext(SiteSettingsContext)

export function DesignProvider({ children, settings: preset }: { children: React.ReactNode; settings?: Record<string, string> }) {
  const [settings, setSettings] = useState<Record<string, string>>(preset || {})

  useEffect(() => {
    if (preset) {
      setSettings(preset)
      applySettings(preset)
      return
    }
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(d => { if (d.ok) { setSettings(d.settings); applySettings(d.settings) } })
      .catch(() => {})
  }, [preset])

  return <SiteSettingsContext.Provider value={{ settings }}>{children}</SiteSettingsContext.Provider>
}

function applySettings(s: Record<string, string>) {
  const root = document.documentElement
  root.style.setProperty('--font-sans', s.primaryFont || DEFAULTS.primaryFont)
  root.style.setProperty('--font-display', s.headingFont || DEFAULTS.headingFont)
  root.style.setProperty('--color-navy', s.primaryColor || DEFAULTS.primaryColor)
  root.style.setProperty('--color-gold', s.accentColor || DEFAULTS.accentColor)
  root.style.setProperty('--color-background', s.bgColor || DEFAULTS.bgColor)
  root.style.setProperty('--color-foreground', s.textColor || DEFAULTS.textColor)
}
