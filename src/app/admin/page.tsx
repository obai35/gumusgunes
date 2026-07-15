'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ShoppingBag, DollarSign, Package, AlertTriangle, Plus, Eye, Wallet, FileText, ChevronRight,
} from 'lucide-react'
import { StatsCard } from '@/components/admin/StatsCard'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { OrderFunnel } from '@/components/admin/OrderFunnel'
import { TopProducts } from '@/components/admin/TopProducts'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { PeriodSelector } from '@/components/admin/PeriodSelector'

export default function AdminDashboard() {
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
        <h1 className="text-2xl font-display font-semibold text-navy">Dashboard</h1>
        <PeriodSelector value={dashboardPeriod} onChange={setDashboardPeriod} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard icon={ShoppingBag} label="Orders Today" value={String(overviewDay?.totalOrders || 0)} />
          <StatsCard
            icon={DollarSign}
            label="Revenue"
            value={`$${(overviewWeek?.totalRevenue || 0).toFixed(2)}`}
            sub="This week"
          />
          <StatsCard icon={Package} label="Total Orders" value={String(overviewMonth?.totalOrders || 0)} />
          <StatsCard icon={AlertTriangle} label="Low Stock Items" value={String(lowStockCount)} />
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
        <Link href="/admin/products/new" className="flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-navy">
          <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <Plus className="h-5 w-5 text-gold" />
          </div>
          <span className="text-xs font-medium">New Product</span>
        </Link>
        <Link href="/admin/orders" className="flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-navy">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium">View Orders</span>
        </Link>
        <Link href="/admin/pos" className="flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-navy">
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-xs font-medium">Open POS</span>
        </Link>
        <Link href="/admin/accounting" className="flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-navy">
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium">Accounting</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} loading={loading} />
        </div>
        <TopProducts loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-xs text-gold hover:text-gold/80 font-medium flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <OrdersList />
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Low Stock Alerts
            </h2>
            <Link href="/admin/inventory" className="text-xs text-gold hover:text-gold/80 font-medium flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <LowStockList onTotal={setLowStockCount} />
        </div>
      </div>
    </div>
  )
}

function OrdersList() {
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
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded" />)}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {orders.map((order: any) => (
        <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <div>
            <p className="text-sm font-medium text-navy">{order.orderNumber || order.receiptNumber || `#${order.id.slice(0, 8)}`}</p>
            <p className="text-xs text-muted-foreground">{order.fullName} · ${(order.totalAmount || 0).toFixed(2)}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
            order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>{order.status}</span>
        </div>
      ))}
      {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
    </div>
  )
}

function LowStockList({ onTotal }: { onTotal?: (n: number) => void }) {
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
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded" />)}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {products.map((p: any) => (
        <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <div>
            <p className="text-sm font-medium text-navy">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.sku}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
          }`}>{p.stock} left</span>
        </div>
      ))}
      {products.length === 0 && <p className="text-sm text-muted-foreground">All products are well-stocked.</p>}
    </div>
  )
}
