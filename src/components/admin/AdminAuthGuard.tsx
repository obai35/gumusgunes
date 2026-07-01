'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { token } = useAdminAuth()
  const [hydrated, setHydrated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (useAdminAuth.persist.hasHydrated()) {
      setHydrated(true)
    } else {
      const unsub = useAdminAuth.persist.onFinishHydration(() => setHydrated(true))
      return () => unsub()
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (pathname === '/admin/login') {
      setChecking(false)
      return
    }
    if (!token) {
      router.replace('/admin/login')
    } else {
      setChecking(false)
    }
  }, [token, router, pathname, hydrated])

  if (checking) return null

  return <>{children}</>
}
