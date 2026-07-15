'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { AdminAuthGuard } from './AdminAuthGuard'
import { Menu } from 'lucide-react'
import { PageTransition } from '@/components/ui/PageTransition'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { KeyboardShortcutProvider } from './KeyboardShortcutProvider'
import { AdminShortcuts } from './AdminShortcuts'
import { MobileBottomNav } from './MobileBottomNav'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AdminAuthGuard>
      <KeyboardShortcutProvider>
        {isLogin ? (
          <>{children}</>
        ) : (
          <div className="flex min-h-screen bg-background">
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
              <main className="flex-1 p-6 overflow-auto min-w-0 pb-16 lg:pb-0">
                <div className="lg:hidden mb-4">
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      Menu
                    </Button>
                  </SheetTrigger>
                </div>
                <AnimatePresence mode="wait">
                  <PageTransition key={pathname}>
                    {children}
                  </PageTransition>
                </AnimatePresence>
              </main>
            </Sheet>
            {!isLogin && <MobileBottomNav />}
          </div>
        )}
        <AdminShortcuts />
      </KeyboardShortcutProvider>
    </AdminAuthGuard>
  )
}
