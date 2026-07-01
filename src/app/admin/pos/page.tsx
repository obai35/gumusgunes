'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPOSRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/pos') }, [router])
  return (
    <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground text-sm">
      Redirecting to POS...
    </div>
  )
}
