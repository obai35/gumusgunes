'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { AdminAuthGuard } from './AdminAuthGuard'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'

  return (
    <AdminAuthGuard>
      {isLogin ? (
        <>{children}</>
      ) : (
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      )}
    </AdminAuthGuard>
  )
}
