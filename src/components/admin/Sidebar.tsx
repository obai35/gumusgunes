'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, Tag, LogOut, Sun,
} from 'lucide-react'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/pos', label: 'POS', icon: ShoppingCart },
  { href: '/admin/discounts', label: 'Discounts', icon: Tag },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-navy-deep text-silver flex flex-col">
      <div className="flex items-center gap-2 px-6 py-6 border-b border-silver/10">
        <Sun className="h-6 w-6 text-gold" />
        <span className="font-display text-lg font-semibold">Admin</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-gold/10 text-gold font-medium'
                  : 'text-silver/60 hover:text-silver hover:bg-silver/5'
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-silver/10">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-silver/60 hover:text-silver hover:bg-silver/5 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
