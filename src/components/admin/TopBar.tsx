'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { useTranslation } from '@/hooks/use-translation'
import {
  Menu, Search, Bell, ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SheetTrigger } from '@/components/ui/sheet'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

const segmentLabels: Record<string, string> = {
  'admin': 'Admin',
  'orders': 'Orders',
  'returns': 'Returns',
  'receipts': 'Receipts',
  'pos': 'POS',
  'shipping': 'Shipping',
  'customer-service': 'Customer Service',
  'branches': 'Branches',
  'products': 'Products',
  'categories': 'Categories',
  'brands': 'Brands',
  'reviews': 'Reviews',
  'quality-control': 'Quality Control',
  'inventory': 'Inventory',
  'stock-transfers': 'Stock Transfers',
  'purchase-orders': 'Purchase Orders',
  'warehouses': 'Warehouses',
  'discounts': 'Discounts',
  'customers': 'Customers',
  'accounting': 'Accounting',
  'reports': 'Reports',
  'tax-rates': 'Tax Rates',
  'payments': 'Payments',
  'currencies': 'Currencies',
  'pricing': 'Pricing',
  'content': 'Content',
  'blog': 'Blog',
  'faq': 'FAQ',
  'banners': 'Banners',
  'pages': 'Pages',
  'media': 'Media',
  'system': 'System',
  'audit-log': 'Audit Log',
  'webhooks': 'Webhooks',
  'api-keys': 'API Keys',
  'cache': 'Cache',
  'feature-flags': 'Feature Flags',
  'health': 'System Health',
  'admins': 'Admins',
  'security': 'Security',
  'settings': 'Settings',
  'translations': 'Translations',
  'editor': 'Site Editor',
  'social': 'Social',
  'newsletter': 'Newsletter',
  'manufacturing': 'Manufacturing',
  'cost-pools': 'Cost Pools',
  'formulas': 'Formulas',
  'cost-cards': 'Cost Cards',
  'lists': 'Price Lists',
}

function formatSegment(seg: string): string {
  return segmentLabels[seg] || seg
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function TopBar() {
  const pathname = usePathname()
  const { user } = useAdminAuth()
  const { t } = useTranslation()

  const segments = pathname.split('/').filter(Boolean)

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </div>

          <Breadcrumb>
            <BreadcrumbList>
              {segments.map((seg, i) => {
                const href = '/' + segments.slice(0, i + 1).join('/')
                const isLast = i === segments.length - 1
                return (
                  <BreadcrumbItem key={href}>
                    {isLast ? (
                      <BreadcrumbPage className="text-sm font-medium">{formatSegment(seg)}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink asChild>
                          <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">{formatSegment(seg)}</Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </BreadcrumbSeparator>
                      </>
                    )}
                  </BreadcrumbItem>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
            <Search className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-gold/10 text-gold font-medium">
                    {user?.email?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground font-medium hidden sm:inline">{user?.email?.split('@')[0] || 'Admin'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>{t('admin.common.settings')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
