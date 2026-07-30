'use client'

import { memo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { AdminChat } from './AdminChat'
import { DarkModeToggle } from './DarkModeToggle'
import { ShortcutCheatSheet } from './ShortcutCheatSheet'
import { useTranslation } from '@/hooks/use-translation'
import { useLocale } from '@/lib/store'
import { LOCALES } from '@/lib/i18n/translations'
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, CreditCard, Tag, LogOut, Sun, Receipt, Settings,
  Store, Users, Shield, Calculator, ArrowLeftRight, FolderTree, UserCircle, MessageSquareText, Mail,
  Truck, Share2, Headset, FileText, Image, HelpCircle, RefreshCw, ClipboardCheck, BarChart3,
  Activity, Webhook, Key, Database, Flag, HeartPulse, Factory, CircleDollarSign, GanttChartSquare,
  ChevronDown, Languages, type LucideIcon,
} from 'lucide-react'

type NavItem = { href: string; label: string; permission?: string }
type NavGroup = {
  label: string
  icon: LucideIcon
  permission: string
  children: NavItem[]
}

const groups: NavGroup[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard',
    children: [{ href: '/admin', label: 'Dashboard' }],
  },
  {
    label: 'Commerce',
    icon: ShoppingBag,
    permission: 'orders',
    children: [
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/returns', label: 'Returns', permission: 'orders' },
      { href: '/admin/receipts', label: 'Receipts', permission: 'receipts' },
      { href: '/admin/pos', label: 'POS', permission: 'pos' },
      { href: '/admin/shipping', label: 'Shipping', permission: 'shipping' },
      { href: '/admin/customer-service', label: 'Customer Service', permission: 'customer_service' },
      { href: '/admin/branches', label: 'Branches', permission: 'branches' },
    ],
  },
  {
    label: 'Products & Inventory',
    icon: Package,
    permission: 'products',
    children: [
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/categories', label: 'Categories', permission: 'categories' },
      { href: '/admin/brands', label: 'Brands', permission: 'brands' },
      { href: '/admin/reviews', label: 'Reviews', permission: 'reviews' },
      { href: '/admin/quality-control', label: 'Quality Control', permission: 'products' },
      { href: '/admin/inventory', label: 'Inventory', permission: 'inventory' },
      { href: '/admin/stock-transfers', label: 'Stock Transfers', permission: 'stock_transfers' },
      { href: '/admin/purchase-orders', label: 'Purchase Orders', permission: 'inventory' },
      { href: '/admin/warehouses', label: 'Warehouses', permission: 'inventory' },
      { href: '/admin/discounts', label: 'Discounts', permission: 'discounts' },
    ],
  },
  {
    label: 'Customers',
    icon: UserCircle,
    permission: 'customers',
    children: [{ href: '/admin/customers', label: 'Customers' }],
  },
  {
    label: 'Financial',
    icon: Calculator,
    permission: 'accounting',
    children: [
      { href: '/admin/accounting', label: 'Accounting' },
      { href: '/admin/reports', label: 'Reports', permission: 'reports' },
      { href: '/admin/tax-rates', label: 'Tax Rates', permission: 'settings' },
      { href: '/admin/payments', label: 'Payments', permission: 'payments' },
      { href: '/admin/currencies', label: 'Currencies', permission: 'settings' },
    ],
  },
  {
    label: 'Pricing',
    icon: CircleDollarSign,
    permission: 'pricing',
    children: [
      { href: '/admin/pricing', label: 'Pricing' },
      { href: '/admin/pricing/cost-pools', label: 'Cost Pools' },
      { href: '/admin/pricing/formulas', label: 'Formulas' },
      { href: '/admin/pricing/cost-cards', label: 'Cost Cards' },
      { href: '/admin/pricing/lists', label: 'Price Lists' },
    ],
  },
  {
    label: 'Manufacturing',
    icon: Factory,
    permission: 'manufacturing',
    children: [{ href: '/admin/manufacturing', label: 'Manufacturing' }],
  },
  {
    label: 'Marketing',
    icon: Share2,
    permission: 'marketing',
    children: [
      { href: '/admin/social', label: 'Social', permission: 'social' },
      { href: '/admin/newsletter', label: 'Newsletter', permission: 'newsletter' },
    ],
  },
  {
    label: 'Content',
    icon: FileText,
    permission: 'blog',
    children: [
      { href: '/admin/content/blog', label: 'Blog', permission: 'blog' },
      { href: '/admin/content/faq', label: 'FAQ', permission: 'faq' },
      { href: '/admin/content/banners', label: 'Banners', permission: 'banners' },
      { href: '/admin/content/pages', label: 'Pages', permission: 'pages' },
      { href: '/admin/content/media', label: 'Media', permission: 'media' },
    ],
  },
  {
    label: 'System',
    icon: Activity,
    permission: 'system',
    children: [
      { href: '/admin/system/audit-log', label: 'Audit Log' },
      { href: '/admin/system/webhooks', label: 'Webhooks' },
      { href: '/admin/system/api-keys', label: 'API Keys' },
      { href: '/admin/system/cache', label: 'Cache' },
      { href: '/admin/system/feature-flags', label: 'Feature Flags' },
      { href: '/admin/system/health', label: 'System Health' },
    ],
  },
  {
    label: 'Administration',
    icon: Shield,
    permission: 'admins',
    children: [
      { href: '/admin/admins', label: 'Admins' },
      { href: '/admin/security', label: 'Security', permission: 'security' },
      { href: '/admin/settings', label: 'Settings', permission: 'settings' },
      { href: '/admin/translations', label: 'Translations', permission: 'settings' },
      { href: '/admin/editor', label: 'Site Editor', permission: 'editor' },
    ],
  },
]

const STORAGE_KEY = 'admin-sidebar-collapsed'

const sidebarLabelKey: Record<string, string> = {
  'Dashboard': 'dashboard',
  'Commerce': 'commerce',
  'Products & Inventory': 'productsInventory',
  'Customers': 'customers',
  'Financial': 'financial',
  'Pricing': 'pricing',
  'Manufacturing': 'manufacturing',
  'Marketing': 'marketing',
  'Content': 'content',
  'System': 'system',
  'Administration': 'administration',
}

const sidebarItemKey: Record<string, string> = {
  'Orders': 'orders',
  'Returns': 'returns',
  'Receipts': 'receipts',
  'POS': 'pos',
  'Shipping': 'shipping',
  'Customer Service': 'customerService',
  'Branches': 'branches',
  'Products': 'products',
  'Categories': 'categories',
  'Brands': 'brands',
  'Reviews': 'reviews',
  'Quality Control': 'qualityControl',
  'Inventory': 'inventory',
  'Stock Transfers': 'stockTransfers',
  'Purchase Orders': 'purchaseOrders',
  'Warehouses': 'warehouses',
  'Discounts': 'discounts',
  'Accounting': 'accounting',
  'Reports': 'reports',
  'Tax Rates': 'taxRates',
  'Payments': 'payments',
  'Currencies': 'currencies',
  'Cost Pools': 'costPools',
  'Formulas': 'formulas',
  'Cost Cards': 'costCards',
  'Price Lists': 'priceLists',
  'Social': 'social',
  'Newsletter': 'newsletter',
  'Blog': 'blog',
  'FAQ': 'faq',
  'Banners': 'banners',
  'Pages': 'pages',
  'Media': 'media',
  'Audit Log': 'auditLog',
  'Webhooks': 'webhooks',
  'API Keys': 'apiKeys',
  'Cache': 'cache',
  'Feature Flags': 'featureFlags',
  'System Health': 'systemHealth',
  'Admins': 'admins',
  'Security': 'security',
  'Settings': 'settings',
  'Translations': 'translations',
  'Site Editor': 'siteEditor',
}

const childIcons: Record<string, LucideIcon> = {
  'Dashboard': LayoutDashboard,
  'Orders': ShoppingBag,
  'Returns': RefreshCw,
  'Receipts': Receipt,
  'POS': ShoppingCart,
  'Shipping': Truck,
  'Customer Service': Headset,
  'Branches': Store,
  'Products': Package,
  'Categories': FolderTree,
  'Brands': Tag,
  'Reviews': MessageSquareText,
  'Quality Control': ClipboardCheck,
  'Inventory': Warehouse,
  'Stock Transfers': ArrowLeftRight,
  'Purchase Orders': FileText,
  'Warehouses': Warehouse,
  'Discounts': Tag,
  'Customers': Users,
  'Accounting': Calculator,
  'Reports': BarChart3,
  'Tax Rates': CreditCard,
  'Payments': CreditCard,
  'Currencies': CircleDollarSign,
  'Pricing': CircleDollarSign,
  'Cost Pools': Database,
  'Formulas': GanttChartSquare,
  'Cost Cards': CreditCard,
  'Price Lists': FileText,
  'Manufacturing': Factory,
  'Social': Share2,
  'Newsletter': Mail,
  'Blog': FileText,
  'FAQ': HelpCircle,
  'Banners': Image,
  'Pages': FileText,
  'Media': Image,
  'Audit Log': ClipboardCheck,
  'Webhooks': Webhook,
  'API Keys': Key,
  'Cache': RefreshCw,
  'Feature Flags': Flag,
  'System Health': HeartPulse,
  'Admins': Shield,
  'Security': Shield,
  'Settings': Settings,
  'Translations': Languages,
  'Site Editor': FileText,
}

function loadCollapsed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch { /* ignore */ }
  return new Set()
}

function saveCollapsed(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

function LanguageToggle() {
  const { locale, setLocale } = useLocale()
  const next = LOCALES.find((l) => l.code !== locale) ?? LOCALES[0]
  return (
    <button
      onClick={() => setLocale(next.code)}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-silver/60 hover:text-silver hover:bg-silver/5 transition-colors"
      title={locale === 'en' ? 'العربية' : 'English'}
    >
      <Languages className="h-4 w-4" />
    </button>
  )
}

type SidebarProps = { open?: boolean; onClose?: () => void }

export const Sidebar = memo(function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAdminAuth()
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed)

  useEffect(() => { saveCollapsed(collapsed) }, [collapsed])

  const isFullAccess = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'admin'

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const visibleGroups = groups.filter((g) => isFullAccess || user?.permissions?.includes(g.permission))

  return (
    <aside className={`w-64 min-h-screen bg-navy-deep text-silver flex flex-col shrink-0 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-30 max-lg:transition-transform max-lg:duration-200 ${open ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}`}>
      <div className="px-6 py-6 border-b border-silver/10">
        <div className="flex items-center justify-between gap-2">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gold/15 flex items-center justify-center group-hover:bg-gold/25 transition-colors">
              <Sun className="h-4.5 w-4.5 text-gold" />
            </div>
            <div>
              <span className="font-display text-lg font-semibold text-silver block leading-tight">Gümüş Güneş</span>
              <span className="text-[10px] text-gold/70 font-medium tracking-wider uppercase">Admin Panel</span>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-silver/60 hover:text-silver">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        {user?.storeName && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-silver/50">
            <Store className="h-3 w-3" />
            <span className="truncate">{user.storeName}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {visibleGroups.map((group) => {
          const isCollapsed = collapsed.has(group.label)

          const visibleChildren = group.children.filter(
            (c) => !c.permission || isFullAccess || user?.permissions?.includes(c.permission)
          )
          if (visibleChildren.length === 0) return null

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-silver/40 hover:text-silver/70 hover:bg-silver/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <group.icon className="h-3.5 w-3.5" />
                  {t('admin.sidebar.' + (sidebarLabelKey[group.label] || 'dashboard'))}
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
              </button>
              {!isCollapsed && (
                <div className="ml-2 space-y-0.5 mt-0.5">
                  {visibleChildren.map((child) => {
                    const isActive = pathname === child.href || (child.href !== '/admin' && pathname.startsWith(child.href))
                    const Icon = childIcons[child.label]
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          isActive
                            ? 'bg-gold/10 text-gold font-medium'
                            : 'text-silver/60 hover:text-silver hover:bg-silver/5'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gold" />
                        )}
                        {Icon ? <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-gold' : ''}`} /> : <span className="h-4 w-4 shrink-0" />}
                        {t('admin.sidebar.' + (sidebarItemKey[child.label] || child.label.toLowerCase().replace(/[\s&]+/g, '')))}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <AdminChat />
      <div className="px-3 py-4 border-t border-silver/10 space-y-1">
        <div className="flex items-center gap-1">
          <DarkModeToggle />
          <LanguageToggle />
          <ShortcutCheatSheet />
        </div>
        <button
          onClick={() => { logout(); router.push('/admin/login') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-silver/60 hover:text-silver hover:bg-silver/5 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('admin.common.signOut')}
        </button>
      </div>
    </aside>
  )
})
