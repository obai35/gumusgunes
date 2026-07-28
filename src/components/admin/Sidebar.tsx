'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { AdminChat } from './AdminChat'
import { DarkModeToggle } from './DarkModeToggle'
import { ShortcutCheatSheet } from './ShortcutCheatSheet'
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, CreditCard, Tag, LogOut, Sun, Receipt, Settings,
  Store, Users, Shield, Calculator, ArrowLeftRight, FolderTree, UserCircle, MessageSquareText, Mail,
  Truck, Share2, Headset, FileText, Image, HelpCircle, RefreshCw, ClipboardCheck, BarChart3,
  Activity, Webhook, Key, Database, Flag, HeartPulse,
} from 'lucide-react'

type LinkDef = { href: string; label: string; icon: any; permission?: string }
const links: LinkDef[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { href: '/admin/accounting', label: 'Accounting', icon: Calculator, permission: 'accounting' },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, permission: 'reports' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, permission: 'orders' },
  { href: '/admin/receipts', label: 'Receipts', icon: Receipt, permission: 'receipts' },
  { href: '/admin/products', label: 'Products', icon: Package, permission: 'products' },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse, permission: 'inventory' },
  { href: '/admin/discounts', label: 'Discounts', icon: Tag, permission: 'discounts' },
  { href: '/admin/stock-transfers', label: 'Stock Transfers', icon: ArrowLeftRight, permission: 'stock_transfers' },
  { href: '/admin/purchase-orders', label: 'Purchase Orders', icon: Package, permission: 'inventory' },
  { href: '/admin/warehouses', label: 'Warehouses', icon: Warehouse, permission: 'inventory' },
  { href: '/admin/branches', label: 'Branches', icon: Users, permission: 'branches' },
  { href: '/admin/customers', label: 'Customers', icon: UserCircle, permission: 'customers' },
  { href: '/admin/quality-control', label: 'Quality Control', icon: ClipboardCheck, permission: 'products' },
  { href: '/admin/customer-service', label: 'Customer Service', icon: Headset, permission: 'customer_service' },
  { href: '/admin/pos', label: 'POS', icon: ShoppingCart, permission: 'pos' },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck, permission: 'shipping' },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree, permission: 'categories' },
  { href: '/admin/brands', label: 'Brands', icon: Tag, permission: 'brands' },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquareText, permission: 'reviews' },
  { href: '/admin/returns', label: 'Returns', icon: RefreshCw, permission: 'orders' },
  { href: '/admin/social', label: 'Social', icon: Share2, permission: 'social' },
  { href: '/admin/system/audit-log', label: 'Audit Log', icon: Activity, permission: 'system' },
  { href: '/admin/system/webhooks', label: 'Webhooks', icon: Webhook, permission: 'system' },
  { href: '/admin/system/api-keys', label: 'API Keys', icon: Key, permission: 'system' },
  { href: '/admin/system/cache', label: 'Cache', icon: Database, permission: 'system' },
  { href: '/admin/system/feature-flags', label: 'Feature Flags', icon: Flag, permission: 'system' },
  { href: '/admin/system/health', label: 'System Health', icon: HeartPulse, permission: 'system' },
  { href: '/admin/editor', label: 'Site Editor', icon: Store, permission: 'editor' },
  { href: '/admin/admins', label: 'Admins', icon: Shield, permission: 'admins' },
  { href: '/admin/security', label: 'Security', icon: Shield, permission: 'security' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings' },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail, permission: 'newsletter' },
  { href: '/admin/content/blog', label: 'Blog', icon: FileText, permission: 'blog' },
  { href: '/admin/content/faq', label: 'FAQ', icon: HelpCircle, permission: 'faq' },
  { href: '/admin/content/banners', label: 'Banners', icon: Image, permission: 'banners' },
  { href: '/admin/content/pages', label: 'Pages', icon: FileText, permission: 'pages' },
  { href: '/admin/content/media', label: 'Media', icon: Image, permission: 'media' },
  { href: '/admin/currencies', label: 'Currencies', icon: CreditCard, permission: 'settings' },
  { href: '/admin/translations', label: 'Translations', icon: MessageSquareText, permission: 'settings' },
  { href: '/admin/tax-rates', label: 'Tax Rates', icon: Calculator, permission: 'settings' },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'payments' },
]

type SidebarProps = { open?: boolean; onClose?: () => void }

export const Sidebar = memo(function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAdminAuth()

  const isFullAccess = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'admin'
  const visibleLinks = links.filter((l) => !l.permission || isFullAccess || user?.permissions?.includes(l.permission))

  return (
    <>
      <aside className={`w-64 min-h-screen bg-navy-deep text-silver flex flex-col shrink-0 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-30 max-lg:transition-transform max-lg:duration-200 ${open ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}`}>
          <div className="px-6 py-6 border-b border-silver/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sun className="h-6 w-6 text-gold" />
              <span className="font-display text-lg font-semibold">Admin</span>
            </div>
            {onClose && (
              <button onClick={onClose} className="lg:hidden text-silver/60 hover:text-silver">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          {user?.storeName && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-silver/50">
              <Store className="h-3 w-3" />
              <span className="truncate">{user.storeName}</span>
            </div>
          )}
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
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
        <div className="px-3 py-4 border-t border-silver/10 space-y-1">
          <div className="flex items-center gap-1">
            <DarkModeToggle />
            <ShortcutCheatSheet />
          </div>
          <button
            onClick={() => { logout(); router.push('/admin/login') }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-silver/60 hover:text-silver hover:bg-silver/5 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
})
