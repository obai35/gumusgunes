'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ShoppingBag, DollarSign, Package, AlertTriangle, Plus, Eye, Wallet, FileText, ChevronRight, TrendingUp, TrendingDown,
} from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatsCard } from '@/components/admin/StatsCard'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { OrderFunnel } from '@/components/admin/OrderFunnel'
import { TopProducts } from '@/components/admin/TopProducts'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { PeriodSelector } from '@/components/admin/PeriodSelector'

const quickActionKeys = [
  { href: '/admin/products/new', labelKey: 'newProduct', descKey: 'newProductDesc', icon: Plus, color: 'gold' as const },
  { href: '/admin/orders', labelKey: 'viewOrders', descKey: 'viewOrdersDesc', icon: Eye, color: 'blue' as const },
  { href: '/admin/pos', labelKey: 'openPOS', descKey: 'openPOSDesc', icon: Wallet, color: 'green' as const },
  { href: '/admin/accounting', labelKey: 'accounting', descKey: 'accountingDesc', icon: FileText, color: 'purple' as const },
]

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [overviewDay, setOverviewDay] = useState<any>(null)
  const [overviewWeek, setOverviewWeek] = useState<any>(null)
  const [overviewMonth, setOverviewMonth] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [dashboardPeriod, setDashboardPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [dayRes, weekRes, monthRes, activityRes] = await Promise.all([
          fetch('/api/admin/accounting/overview?period=day'),
          fetch('/api/admin/accounting/overview?period=week'),
          fetch('/api/admin/accounting/overview?period=month'),
          fetch('/api/admin/activity?limit=10'),
        ])
        if (cancelled) return
        const [dayData, weekData, monthData, activityData] = await Promise.all([
          dayRes.json(), weekRes.json(), monthRes.json(), activityRes.json(),
        ])
        setOverviewDay(dayData)
        setOverviewWeek(weekData)
        setOverviewMonth(monthData)
        setActivities(Array.isArray(activityData.logs) ? activityData.logs : [])
      } catch {
        if (!cancelled) toast.error('Failed to load dashboard data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const weekRevenue = Array.isArray(overviewWeek?.dailyRevenue) ? overviewWeek.dailyRevenue : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">{t('admin.dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('admin.dashboard.subtitle')}</p>
        </div>
        <PeriodSelector value={dashboardPeriod} onChange={setDashboardPeriod} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card rounded-xl border-border h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard icon={ShoppingBag} label={t('admin.dashboard.ordersToday')} value={String(overviewDay?.totalOrders || 0)} accentColor="gold" />
          <StatsCard
            icon={DollarSign}
            label={t('admin.dashboard.revenue')}
            value={`$${(overviewWeek?.totalRevenue || 0).toFixed(2)}`}
            sub={t('admin.dashboard.thisWeek')}
            accentColor="blue"
          />
          <StatsCard icon={Package} label={t('admin.dashboard.totalOrders')} value={String(overviewMonth?.totalOrders || 0)} accentColor="green" />
          <StatsCard icon={AlertTriangle} label={t('admin.dashboard.lowStockItems')} value={String(lowStockCount)} accentColor="orange" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <RevenueChart
          data={weekRevenue}
          period={revenuePeriod}
          onPeriodChange={setRevenuePeriod}
          loading={loading}
        />
        <OrderFunnel loading={loading} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {quickActionKeys.map(action => {
          const colorClasses: Record<string, string> = {
            gold: 'bg-gold/10 text-gold group-hover:bg-gold/20',
            blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
            green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
            purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
          }
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center justify-center gap-2 bg-card rounded-xl border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-foreground"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${colorClasses[action.color] || colorClasses.gold}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{t('admin.dashboard.' + action.labelKey)}</span>
              <span className="text-[10px] text-muted-foreground">{t('admin.dashboard.' + action.descKey)}</span>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} loading={loading} />
        </div>
        <TopProducts loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title={t('admin.dashboard.recentOrders')} icon={ShoppingBag} href="/admin/orders" viewAllLabel={t('admin.dashboard.viewAll')}>
          <OrdersList t={t} />
        </SectionCard>
        <SectionCard title={t('admin.dashboard.lowStockAlerts')} icon={AlertTriangle} href="/admin/inventory" viewAllLabel={t('admin.dashboard.viewAll')}>
          <LowStockList onTotal={setLowStockCount} t={t} />
        </SectionCard>
      </div>
    </div>
  )
}

function statusLabel(t: (key: string) => string, status: string): string {
  const map: Record<string, string> = {
    delivered: 'admin.dashboard.statusDelivered',
    shipped: 'admin.dashboard.statusShipped',
    processing: 'admin.dashboard.statusProcessing',
    pending: 'admin.dashboard.statusPending',
  }
  return t(map[status] || status)
}

function SectionCard({ title, icon: Icon, href, viewAllLabel, children }: { title: string; icon: any; href: string; viewAllLabel: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h2>
        <Link href={href} className="text-xs text-gold hover:text-gold/80 font-medium flex items-center gap-1 transition-colors">
          {viewAllLabel} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {children}
    </div>
  )
}

function OrdersList({ t }: { t: (key: string) => string }) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/orders?limit=10')
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data.orders) ? data.orders : Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded" />)}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {orders.map((order: any) => (
        <div key={order.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors -mx-3">
          <div>
            <p className="text-sm font-medium text-foreground">{order.orderNumber || order.receiptNumber || `#${order.id.slice(0, 8)}`}</p>
            <p className="text-xs text-muted-foreground">{order.fullName} · ${(order.totalAmount || 0).toFixed(2)}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
            order.status === 'delivered' ? 'bg-green-50 text-green-700' :
            order.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
            order.status === 'processing' ? 'bg-yellow-50 text-yellow-700' :
            'bg-gray-50 text-gray-700'
          }`}>{statusLabel(t, order.status)}</span>
        </div>
      ))}
      {orders.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">{t('admin.dashboard.noOrders')}</p>}
    </div>
  )
}

function LowStockList({ onTotal, t }: { onTotal?: (n: number) => void; t: (key: string, ...args: (string | number)[]) => string }) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/products?lowStock=true&limit=20')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : []
        setProducts(list)
        if (onTotal) onTotal(data.total || list.length)
      })
      .catch(() => toast.error('Failed to load low stock items'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded" />)}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {products.map((p: any) => (
        <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors -mx-3">
          <div>
            <p className="text-sm font-medium text-foreground">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.sku}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            p.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
          }`}>{t('admin.dashboard.itemsLeft', p.stock)}</span>
        </div>
      ))}
      {products.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">{t('admin.dashboard.wellStocked')}</p>}
    </div>
  )
}
