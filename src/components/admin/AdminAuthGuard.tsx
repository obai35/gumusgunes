'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAdminAuth()
  const isLogin = pathname === '/admin/login'

  useEffect(() => {
    if (isLogin) return
    if (loading) return
    if (!user) {
      router.replace('/admin/login')
    }
  }, [user, router, pathname, loading, isLogin])

  if (isLogin) return <>{children}</>
  if (loading || !user) return null
  return <>{children}</>
}
