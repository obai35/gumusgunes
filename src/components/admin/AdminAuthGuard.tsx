'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, initialized } = useAdminAuth()
  const isLogin = pathname === '/admin/login'

  useEffect(() => {
    if (isLogin) return
    if (!initialized) return
    if (!user) {
      router.replace('/admin/login')
    }
  }, [user, router, pathname, initialized, isLogin])

  if (isLogin) return <>{children}</>
  if (!initialized && !user) return null
  if (!user) return null
  return <>{children}</>
}
