'use client'

import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('admin-theme')
    if (stored === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else if (stored === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('admin-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('admin-theme', 'light')
      }
      return next
    })
  }

  return { isDark, toggle, mounted }
}
