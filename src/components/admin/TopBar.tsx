'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { useTranslation } from '@/hooks/use-translation'
import { useState, useEffect } from 'react'
import {
  Menu, Search, Bell, ChevronRight, Package, ShoppingCart, Users, Settings, Loader2,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDebounce } from '@/hooks/useDebounce'
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
  'adjust': 'adjust',
  'agent': 'agent',
  'login': 'login',
  'advertising': 'advertising',
}

function formatSegment(t: (key: string) => string, seg: string): string {
  const key = segmentTransKey[seg]
  if (key) return t('admin.sidebar.' + key)
  return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

type SearchProduct = { id: string; name: string; sku: string; price: number; imageUrl: string | null; isActive: boolean }
type SearchOrder = { id: string; orderNumber: string; fullName: string | null; email: string | null; status: string; totalAmount: number }
type SearchCustomer = { id: string; name: string | null; email: string | null; phone: string | null }
type SearchResults = { products: SearchProduct[]; orders: SearchOrder[]; customers: SearchCustomer[] }

const EMPTY_RESULTS: SearchResults = { products: [], orders: [], customers: [] }

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAdminAuth()
  const { t } = useTranslation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS)
  const debouncedQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    const q = debouncedQuery.trim()
    if (!searchOpen || !q) {
      setSearching(false)
      setResults(EMPTY_RESULTS)
      return
    }
    let cancelled = false
    setSearching(true)
    fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setResults(d && Array.isArray(d.products) && Array.isArray(d.orders) && Array.isArray(d.customers)
          ? d
          : EMPTY_RESULTS)
      })
      .catch(() => {
        if (!cancelled) setResults(EMPTY_RESULTS)
      })
      .finally(() => {
        if (!cancelled) setSearching(false)
      })
    return () => { cancelled = true }
  }, [debouncedQuery, searchOpen])

  const closeSearch = (href: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    setResults(EMPTY_RESULTS)
    router.push(href)
  }

  const segments = pathname.split('/').filter(Boolean)

  const searchItems = [
    { label: 'Products', icon: Package, href: '/admin/products' },
    { label: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
    { label: 'Customers', icon: Users, href: '/admin/customers' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ]

  const query = searchQuery.trim()
  const hasResults = results.products.length > 0 || results.orders.length > 0 || results.customers.length > 0

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

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-3 py-2">
                {t('admin.common.notifications')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t('admin.common.noNotifications')}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                {t('admin.common.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                {t('admin.common.settings')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) { setSearchQuery(''); setResults(EMPTY_RESULTS) } }}>
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search products, orders and customers</DialogDescription>
        </DialogHeader>
        <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
          <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput value={searchQuery} onValueChange={setSearchQuery} placeholder={t('admin.common.searchDot')} />
            <CommandList>
              {!query && (
                <CommandGroup heading={t('admin.common.quickNavigate')}>
                  {searchItems.map((item) => (
                    <CommandItem
                      key={item.href}
                      onSelect={() => closeSearch(item.href)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {query && searching && (
                <CommandItem disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{t('admin.common.loading')}</span>
                </CommandItem>
              )}

              {query && !searching && !hasResults && (
                <CommandEmpty>{t('admin.common.noResults')}</CommandEmpty>
              )}

              {query && !searching && results.products.length > 0 && (
                <CommandGroup heading={t('admin.sidebar.products')}>
                  {results.products.map((p) => (
                    <CommandItem key={p.id} onSelect={() => closeSearch(`/admin/products/${p.id}/edit`)}>
                      <Package className="mr-2 h-4 w-4" />
                      <span>{p.name}</span>
                      {p.sku && <span className="ml-auto text-xs text-muted-foreground">{p.sku}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {query && !searching && results.orders.length > 0 && (
                <CommandGroup heading={t('admin.sidebar.orders')}>
                  {results.orders.map((o) => (
                    <CommandItem key={o.id} onSelect={() => closeSearch(`/admin/orders/${o.id}`)}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>{o.orderNumber}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{o.fullName || o.email || ''}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {query && !searching && results.customers.length > 0 && (
                <CommandGroup heading={t('admin.sidebar.customers')}>
                  {results.customers.map((c) => (
                    <CommandItem key={c.id} onSelect={() => closeSearch(`/admin/customers/${c.id}`)}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>{c.name || c.email || c.phone || '—'}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{c.email || c.phone || ''}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </header>
  )
}
