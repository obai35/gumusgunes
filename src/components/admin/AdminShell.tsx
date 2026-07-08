'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { AdminAuthGuard } from './AdminAuthGuard'
import { Menu, X } from 'lucide-react'
import { PageTransition } from '@/components/ui/PageTransition'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AdminAuthGuard>
      {isLogin ? (
        <>{children}</>
      ) : (
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <main className="flex-1 p-6 overflow-auto min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
            >
              <Menu className="h-5 w-5" />
              Menu
            </button>
            <AnimatePresence mode="wait">
              <PageTransition key={pathname}>
                {children}
              </PageTransition>
            </AnimatePresence>
          </main>
        </div>
      )}
    </AdminAuthGuard>
  )
}
