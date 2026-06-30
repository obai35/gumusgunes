'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const EditModeOverlay = dynamic(() => import('./EditModeOverlay'), { ssr: false })

function EditModeChecker() {
  const sp = useSearchParams()
  if (sp?.get('edit') !== 'true') return null
  return <EditModeOverlay />
}

export default function EditModeGate() {
  return (
    <Suspense fallback={null}>
      <EditModeChecker />
    </Suspense>
  )
}
