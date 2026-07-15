'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, Settings,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/pos', label: 'POS', icon: ShoppingCart },
]

export const MobileBottomNav = memo(function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 transition-colors ${
                isActive
                  ? 'text-gold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate max-w-full">{item.label}</span>
            </Link>
          )
        })}
        <Link
          href="/admin/settings"
          className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 transition-colors ${
            pathname.startsWith('/admin/settings')
              ? 'text-gold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </Link>
      </div>
    </nav>
  )
})
