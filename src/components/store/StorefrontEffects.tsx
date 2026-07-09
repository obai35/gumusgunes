'use client'

import { usePathname } from 'next/navigation'
import { EnhancedAmbientMist } from '@/components/ui/EnhancedAmbientMist'
import { CursorEffects } from './CursorEffects'

export function StorefrontEffects() {
  const pathname = usePathname()
  const isAdminOrPos = pathname.startsWith('/admin') || pathname.startsWith('/pos')
  if (isAdminOrPos) return null
  return (
    <>
      <EnhancedAmbientMist />
      <CursorEffects />
    </>
  )
}
