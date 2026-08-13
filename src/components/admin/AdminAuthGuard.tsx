'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { isPrivilegedAdmin } from '@/lib/admin-2fa'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, initialized } = useAdminAuth()
  const isLogin = pathname === '/admin/login'
  const isSecurity = pathname === '/admin/security'
  const isPublic = pathname === '/admin/recovery' || isLogin

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AdminAuthGuard] render:', { user: user?.email ?? null, initialized, isLogin, pathname })
    }
    if (isPublic) return
    if (!initialized) return
    if (!user) {
      router.replace('/admin/login')
      return
    }
    if (user.totpEnabled === false && isPrivilegedAdmin(user) && !isSecurity) {
      router.replace('/admin/security?2fa=required')
    }
  }, [user, router, pathname, initialized, isLogin, isSecurity, isPublic])

  if (isPublic) return <>{children}</>
  if (!initialized) {
    return (
      <div className="min-h-screen bg-navy-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    )
  }
  if (!user) return null
  return <>{children}</>
}
