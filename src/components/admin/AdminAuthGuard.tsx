'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAdminAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (pathname === '/admin/login') {
      setChecking(false)
      return
    }
    if (!user) {
      router.replace('/admin/login')
    } else {
      setChecking(false)
    }
  }, [user, router, pathname])

  if (checking) return null

  return <>{children}</>
}
