import Link from 'next/link'
import { PrismaClient } from '@prisma/client'
import { Package, ArrowUpDown } from 'lucide-react'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { stock: 'asc' },
  })

  const recentLogs = await prisma.inventoryLog.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true, sku: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Inventory</h1>
        <Link
          href="/admin/inventory/adjust"
          className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
        >
          <ArrowUpDown className="h-4 w-4" /> Adjust Stock
        </Link>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-gray-50/50 cursor-pointer" onClick={() => window.location.href = `/admin/products/${p.id}/edit`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />}
                    </div>
                    <span className="font-medium text-navy">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.category?.name}</td>
                <td className="px-4 py-3 font-medium text-navy">{p.stock}</td>
                <td className="px-4 py-3">
                  {p.stock === 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Out of Stock</span>
                  ) : p.stock < 5 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Low Stock</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">In Stock</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-display font-semibold text-navy mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" /> Recent Inventory Activity
        </h2>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Change</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Note</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id} className="border-b border-border/50 text-xs">
                  <td className="px-4 py-3 font-medium text-navy">{log.product.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      log.type === 'SALE' ? 'bg-blue-100 text-blue-700' :
                      log.type === 'ADJUSTMENT' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{log.type}</span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${log.change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {log.change > 0 ? '+' : ''}{log.change}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.note || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
