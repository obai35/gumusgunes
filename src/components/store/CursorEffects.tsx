'use client'

import { GlowCursor } from './GlowCursor'
import { SparkleTrail } from './SparkleTrail'

export function CursorEffects() {
  if (typeof window !== 'undefined' && !matchMedia('(hover: hover)').matches) return null

  return (
    <>
      <GlowCursor />
      <SparkleTrail />
    </>
  )
}