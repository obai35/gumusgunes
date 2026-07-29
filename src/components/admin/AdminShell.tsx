'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { AdminAuthGuard } from './AdminAuthGuard'
import { AdminErrorBoundary } from './AdminErrorBoundary'
import { Menu } from 'lucide-react'
import { PageTransition } from '@/components/ui/PageTransition'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { KeyboardShortcutProvider } from './KeyboardShortcutProvider'
import { AdminShortcuts } from './AdminShortcuts'
import { MobileBottomNav } from './MobileBottomNav'
import { useLocale } from '@/lib/store'
import { LOCALES } from '@/lib/i18n/translations'
import { useTranslation } from '@/hooks/use-translation'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { locale } = useLocale()
  const { t } = useTranslation()

  useEffect(() => {
    const dir = LOCALES.find((l) => l.code === locale)?.dir ?? 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = locale
  }, [locale])

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
                      {t('admin.common.menu')}
                    </Button>
                  </SheetTrigger>
                </div>
                <AdminErrorBoundary key={pathname}>
                  <AnimatePresence mode="wait">
                    <PageTransition key={pathname}>
                      {children}
                    </PageTransition>
                  </AnimatePresence>
                </AdminErrorBoundary>
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
