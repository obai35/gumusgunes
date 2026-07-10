'use client'

import { usePathname } from 'next/navigation'
import { EnhancedAmbientMist } from '@/components/ui/EnhancedAmbientMist'
import { CursorEffects } from './CursorEffects'

export function StorefrontEffects() {
  const pathname = usePathname()

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/pos') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout')
  ) return null

  return (
    <>
      <EnhancedAmbientMist />
      <CursorEffects />
    </>
  )
}
