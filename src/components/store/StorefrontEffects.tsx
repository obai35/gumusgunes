'use client'

import { useEffect, useState } from 'react'
import { EnhancedAmbientMist } from '@/components/ui/EnhancedAmbientMist'
import { CursorEffects } from './CursorEffects'

export function StorefrontEffects() {
  const [isStorefront, setIsStorefront] = useState(false)

  useEffect(() => {
    const path = window.location.pathname
    setIsStorefront(!path.startsWith('/admin') && !path.startsWith('/pos'))
  }, [])

  if (!isStorefront) return null

  return (
    <>
      <EnhancedAmbientMist />
      <CursorEffects />
    </>
  )
}
