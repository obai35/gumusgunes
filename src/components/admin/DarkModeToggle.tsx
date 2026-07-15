'use client'

import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '@/hooks/useDarkMode'

export function DarkModeToggle() {
  const { isDark, toggle, mounted } = useDarkMode()

  if (!mounted) {
    return <div className="h-9 w-9 rounded-lg bg-silver/5" />
  }

  return (
    <button
      onClick={toggle}
      className="h-9 w-9 rounded-lg flex items-center justify-center text-silver/60 hover:text-silver hover:bg-silver/5 transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
