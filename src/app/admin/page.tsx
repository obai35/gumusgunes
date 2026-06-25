import { ShoppingBag, DollarSign, Package, AlertTriangle } from 'lucide-react'
import { PrismaClient } from '@prisma/client'
import { StatsCard } from '@/components/admin/StatsCard'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)

  const [ordersToday, ordersWeek, totalOrders, lowStock, revenueWeek, recentOrders, lowStockProducts] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.order.count(),
      prisma.product.count({ where: { stock: { lt: 5 }, isActive: true } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: weekStart } } }),
      prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { items: true } }),
      prisma.product.findMany({
        where: { stock: { lt: 5 }, isActive: true },
        select: { id: true, name: true, sku: true, stock: true },
        orderBy: { stock: 'asc' }, take: 20,
      }),
    ])

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={ShoppingBag} label="Orders Today" value={String(ordersToday)} />
        <StatsCard icon={DollarSign} label="Revenue (Week)" value={`$${(revenueWeek._sum.totalAmount || 0).toFixed(2)}`} />
        <StatsCard icon={Package} label="Total Orders" value={String(totalOrders)} />
        <StatsCard icon={AlertTriangle} label="Low Stock Items" value={String(lowStock)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-display font-semibold text-navy mb-4">Recent Orders</h2>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-navy">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.fullName} · ${order.totalAmount.toFixed(2)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{order.status}</span>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-display font-semibold text-navy mb-4">Low Stock Alerts</h2>
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
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
            {lowStockProducts.length === 0 && <p className="text-sm text-muted-foreground">All products are well-stocked.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
