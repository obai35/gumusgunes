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

const segmentTransKey: Record<string, string> = {
  'admin': 'dashboard',
  'orders': 'orders',
  'returns': 'returns',
  'receipts': 'receipts',
  'pos': 'pos',
  'shipping': 'shipping',
  'customer-service': 'customerService',
  'branches': 'branches',
  'products': 'products',
  'categories': 'categories',
  'brands': 'brands',
  'reviews': 'reviews',
  'quality-control': 'qualityControl',
  'inventory': 'inventory',
  'stock-transfers': 'stockTransfers',
  'purchase-orders': 'purchaseOrders',
  'warehouses': 'warehouses',
  'discounts': 'discounts',
  'customers': 'customers',
  'accounting': 'accounting',
  'reports': 'reports',
  'tax-rates': 'taxRates',
  'payments': 'payments',
  'currencies': 'currencies',
  'pricing': 'pricing',
  'content': 'content',
  'blog': 'blog',
  'faq': 'faq',
  'banners': 'banners',
  'pages': 'pages',
  'media': 'media',
  'system': 'system',
  'audit-log': 'auditLog',
  'webhooks': 'webhooks',
  'api-keys': 'apiKeys',
  'cache': 'cache',
  'feature-flags': 'featureFlags',
  'health': 'systemHealth',
  'admins': 'admins',
  'security': 'security',
  'settings': 'settings',
  'translations': 'translations',
  'editor': 'siteEditor',
  'social': 'social',
  'newsletter': 'newsletter',
  'manufacturing': 'manufacturing',
  'cost-pools': 'costPools',
  'formulas': 'formulas',
  'cost-cards': 'costCards',
  'lists': 'priceLists',
  'marketing': 'marketing',
  'abandoned-carts': 'abandonedCarts',
  'coupons': 'coupons',
  'email-campaigns': 'emailCampaigns',
  'gift-cards': 'giftCards',
  'push-campaigns': 'pushCampaigns',
  'referrals': 'referrals',
  'sales': 'sales',
  'seo': 'seo',
  'segments': 'segments',
  'tiers': 'tiers',
  'analytics': 'analytics',
  'campaigns': 'campaigns',
  'comments': 'comments',
  'posts': 'posts',
  'new': 'new',
  'customer-service': 'customerService',
  'adjust': 'adjust',
  'agent': 'agent',
  'settings': 'settings',
  'login': 'login',
  'advertising': 'advertising',
}

function formatSegment(t: (key: string) => string, seg: string): string {
  const key = segmentTransKey[seg]
  if (key) return t('admin.sidebar.' + key)
  return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
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
                      <BreadcrumbPage className="text-sm font-medium">{formatSegment(t, seg)}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink asChild>
                          <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">{formatSegment(t, seg)}</Link>
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
              <DropdownMenuItem>{t('admin.dashboard.profile')}</DropdownMenuItem>
              <DropdownMenuItem>{t('admin.common.settings')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
