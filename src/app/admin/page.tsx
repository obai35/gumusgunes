'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ShoppingBag, DollarSign, Package, AlertTriangle, Plus, Eye, Wallet,
  BarChart3, UserCheck, FileText, Clock, ChevronRight,
} from 'lucide-react'
import { StatsCard } from '@/components/admin/StatsCard'

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!Array.isArray(data) || data.length < 2) return null
  const max = Math.max(...data, 1)
  const h = 24, w = 80
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparklineCard({ icon: Icon, label, value, sparklineData, sparklineColor }: {
  icon: any; label: string; value: string; sparklineData?: number[]; sparklineColor?: string
}) {
  return (
    <StatsCard
      icon={Icon}
      label={label}
      value={value}
      sub={sparklineData && sparklineData.length > 1
        ? <Sparkline data={sparklineData} color={sparklineColor || '#7c3aed'} />
        : undefined}
    />
  )
}

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (!Array.isArray(data) || data.length === 0) return null

  const max = Math.max(...data.map(d => d.revenue), 1)
  const barWidth = 40
  const gap = 8
  const padding = { top: 8, bottom: 28, left: 0, right: 0 }
  const chartH = 160
  const svgW = data.length * (barWidth + gap) + padding.left + padding.right
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: string; label: string } | null>(null)

  return (
    <div className="bg-white rounded-xl border border-border p-5 overflow-x-auto relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">Revenue Trend (7 Days)</h3>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </div>
      <svg width={Math.max(svgW, 280)} height={chartH + padding.top + padding.bottom} className="overflow-visible">
        {data.map((d, i) => {
          const barH = (d.revenue / max) * chartH
          const x = padding.left + i * (barWidth + gap)
          const y = padding.top + chartH - barH
          const dayLabel = (() => {
            const dt = new Date(d.date)
            return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          })()
          return (
            <g key={d.date}>
              <rect
                x={x} y={y} width={barWidth} height={Math.max(barH, 2)}
                className="fill-navy/60 hover:fill-navy transition-colors cursor-pointer"
                rx={4}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGElement).getBoundingClientRect()
                  const container = (e.target as SVGElement).closest('svg')?.getBoundingClientRect()
                  setTooltip({
                    x: rect.left - (container?.left || 0) + barWidth / 2,
                    y: rect.top - (container?.top || 0),
                    value: `$${d.revenue.toFixed(2)}`,
                    label: dayLabel,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              <text
                x={x + barWidth / 2} y={padding.top + chartH + 16}
                textAnchor="middle" className="fill-muted-foreground" fontSize={9}
              >
                {d.date.slice(5)}
              </text>
            </g>
          )
        })}
      </svg>
      {tooltip && (
        <div
          className="absolute bg-navy text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none z-10 whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <p className="font-medium">{tooltip.label}</p>
          <p className="text-gold font-semibold">{tooltip.value}</p>
        </div>
      )}
    </div>
  )
}

const ACTION_ICONS: Record<string, string> = {
  create: 'green', update: 'blue', delete: 'red', login: 'purple', logout: 'gray',
}

function ActivityIcon({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
    gray: 'text-gray-600 bg-gray-100',
  }
  const color = colorMap[ACTION_ICONS[action] || 'gray']
  const iconMap: Record<string, any> = {
    create: Plus, update: UserCheck, delete: AlertTriangle, login: Clock, logout: Clock,
  }
  const Icon = iconMap[action] || Clock
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
  )
}

export default function AdminDashboard() {
  const [overviewDay, setOverviewDay] = useState<any>(null)
  const [overviewWeek, setOverviewWeek] = useState<any>(null)
  const [overviewMonth, setOverviewMonth] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [loading, setLoading] = useState(true)

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

  const weekRevenue = Array.isArray(overviewWeek?.dailyRevenue) ? overviewWeek.dailyRevenue.map((d: any) => d.revenue) : []

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard icon={ShoppingBag} label="Orders Today" value={String(overviewDay?.totalOrders || 0)} />
          <SparklineCard
            icon={DollarSign}
            label="Revenue (Week)"
            value={`$${(overviewWeek?.totalRevenue || 0).toFixed(2)}`}
            sparklineData={weekRevenue}
            sparklineColor="#b8860b"
          />
          <StatsCard icon={Package} label="Total Orders" value={String(overviewMonth?.totalOrders || 0)} />
          <StatsCard icon={AlertTriangle} label="Low Stock Items" value={String(lowStockCount)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <RevenueChart data={overviewWeek?.dailyRevenue || []} />

        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </h2>
            <Link
              href="/admin/admins?tab=activity"
              className="text-xs text-gold hover:text-gold/80 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {activities.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
            )}
            {activities.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
                <ActivityIcon action={log.action} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy">
                    <span className="font-medium">{log.adminName || 'System'}</span>
                    {' '}
                    <span className="text-muted-foreground capitalize">{log.action}d</span>
                    {' '}
                    <span className="font-medium">{log.resource}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Link
          href="/admin/products/new"
          className="flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-navy"
        >
          <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <Plus className="h-5 w-5 text-gold" />
          </div>
          <span className="text-xs font-medium">New Product</span>
        </Link>
        <Link
          href="/admin/orders"
          className="flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-navy"
        >
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium">View Orders</span>
        </Link>
        <Link
          href="/admin/pos"
          className="flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-navy"
        >
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-xs font-medium">Open POS</span>
        </Link>
        <Link
          href="/admin/accounting"
          className="flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-navy"
        >
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium">Accounting</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-gold hover:text-gold/80 font-medium flex items-center gap-1"
            >
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
            <Link
              href="/admin/inventory"
              className="text-xs text-gold hover:text-gold/80 font-medium flex items-center gap-1"
            >
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
