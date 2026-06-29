'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { AdminChat } from './AdminChat'
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, Tag, LogOut, Sun, Receipt, Settings,
  Store, Users, Shield, Calculator, ArrowLeftRight,
} from 'lucide-react'

type LinkDef = { href: string; label: string; icon: any; permission?: string }
const links: LinkDef[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { href: '/admin/accounting', label: 'Accounting', icon: Calculator, permission: 'accounting' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, permission: 'orders' },
  { href: '/admin/receipts', label: 'Receipts', icon: Receipt, permission: 'receipts' },
  { href: '/admin/products', label: 'Products', icon: Package, permission: 'products' },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse, permission: 'inventory' },
  { href: '/admin/discounts', label: 'Discounts', icon: Tag, permission: 'discounts' },
  { href: '/admin/stock-transfers', label: 'Stock Transfers', icon: ArrowLeftRight, permission: 'stock_transfers' },
  { href: '/admin/branches', label: 'Branches', icon: Users, permission: 'branches' },
  { href: '/admin/pos', label: 'POS', icon: ShoppingCart, permission: 'pos' },
  { href: '/admin/editor', label: 'Site Editor', icon: Store, permission: 'editor' },
  { href: '/admin/admins', label: 'Admins', icon: Shield, permission: 'admins' },
  { href: '/admin/security', label: 'Security', icon: Shield, permission: 'security' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings' },
]

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAdminAuth()

  const visibleLinks = links.filter((l) => !l.permission || user?.permissions?.includes(l.permission))

  return (
    <aside className="w-64 min-h-screen bg-navy-deep text-silver flex flex-col">
      <div className="flex items-center gap-2 px-6 py-6 border-b border-silver/10">
        <Sun className="h-6 w-6 text-gold" />
        <span className="font-display text-lg font-semibold">Admin</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleLinks.map((link) => {
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
      <AdminChat />
      <div className="px-3 py-4 border-t border-silver/10">
        <button
          onClick={() => { logout(); router.push('/admin/login') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-silver/60 hover:text-silver hover:bg-silver/5 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
})
